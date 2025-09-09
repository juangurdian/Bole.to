#!/bin/bash
# Deploy ECS Services with New Container Images
set -euo pipefail

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Load deployment variables
load_deployment_vars() {
    if [[ -f "${PROJECT_ROOT}/infra/.env.deploy" ]]; then
        source "${PROJECT_ROOT}/infra/.env.deploy"
        log_info "Loaded deployment variables ✓"
    else
        log_error "Deployment variables not found. Run build-and-push.sh first."
        exit 1
    fi
}

# Get Terraform outputs
get_terraform_output() {
    local output_name=$1
    terraform -chdir="${PROJECT_ROOT}/infra/terraform" output -raw "${output_name}" 2>/dev/null || {
        log_error "Failed to get Terraform output: ${output_name}"
        return 1
    }
}

# Check ECS service health
check_service_health() {
    local cluster_name=$1
    local service_name=$2
    
    log_info "Checking health of service: ${service_name}"
    
    local service_info=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --region "${AWS_REGION}" \
        --query 'services[0]' 2>/dev/null)
    
    if [[ -z "$service_info" ]] || [[ "$service_info" == "null" ]]; then
        log_error "Service ${service_name} not found"
        return 1
    fi
    
    local running_count=$(echo "$service_info" | jq -r '.runningCount // 0')
    local desired_count=$(echo "$service_info" | jq -r '.desiredCount // 0')
    local service_status=$(echo "$service_info" | jq -r '.status // "UNKNOWN"')
    
    log_debug "Service ${service_name}: Running=${running_count}, Desired=${desired_count}, Status=${service_status}"
    
    if [[ "$service_status" != "ACTIVE" ]]; then
        log_error "Service ${service_name} is not ACTIVE (status: ${service_status})"
        return 1
    fi
    
    if [[ "$running_count" != "$desired_count" ]]; then
        log_warn "Service ${service_name}: Running tasks (${running_count}) != Desired (${desired_count})"
        return 1
    fi
    
    log_info "Service ${service_name} is healthy ✓"
    return 0
}

# Update ECS service with new image
update_ecs_service() {
    local service_name=$1
    local new_image=$2
    local cluster_name=$(get_terraform_output "cluster_name")
    
    log_info "Updating ${service_name} with image: ${new_image}"
    
    # Get current task definition
    local current_task_def_arn=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --region "${AWS_REGION}" \
        --query 'services[0].taskDefinition' \
        --output text)
    
    log_debug "Current task definition: ${current_task_def_arn}"
    
    # Get task definition details
    local task_def_json=$(aws ecs describe-task-definition \
        --task-definition "${current_task_def_arn}" \
        --region "${AWS_REGION}" \
        --query 'taskDefinition')
    
    # Create new task definition with updated image
    local new_task_def=$(echo "$task_def_json" | jq \
        --arg new_image "$new_image" \
        'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy) |
         .containerDefinitions[0].image = $new_image')
    
    # Register new task definition
    log_info "Registering new task definition..."
    local new_task_def_arn=$(echo "$new_task_def" | \
        aws ecs register-task-definition \
            --region "${AWS_REGION}" \
            --cli-input-json file:///dev/stdin \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
    
    log_info "New task definition registered: ${new_task_def_arn} ✓"
    
    # Update service
    log_info "Updating service ${service_name}..."
    aws ecs update-service \
        --cluster "${cluster_name}" \
        --service "${service_name}" \
        --task-definition "${new_task_def_arn}" \
        --region "${AWS_REGION}" \
        --query 'service.serviceName' \
        --output text > /dev/null
    
    log_info "Service update initiated ✓"
    
    # Wait for deployment to complete
    wait_for_deployment "${cluster_name}" "${service_name}"
}

# Wait for ECS deployment to complete
wait_for_deployment() {
    local cluster_name=$1
    local service_name=$2
    local max_attempts=60  # 30 minutes max (30 seconds * 60)
    local attempt=1
    
    log_info "Waiting for deployment of ${service_name} to complete..."
    
    while [[ $attempt -le $max_attempts ]]; do
        local deployment_status=$(aws ecs describe-services \
            --cluster "${cluster_name}" \
            --services "${service_name}" \
            --region "${AWS_REGION}" \
            --query 'services[0].deployments[?status==`PRIMARY`].rolloutState' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        log_debug "Attempt ${attempt}/${max_attempts}: Deployment status = ${deployment_status}"
        
        if [[ "$deployment_status" == "COMPLETED" ]]; then
            log_info "Deployment of ${service_name} completed successfully ✓"
            return 0
        elif [[ "$deployment_status" == "FAILED" ]]; then
            log_error "Deployment of ${service_name} failed ✗"
            
            # Get deployment failure reason
            aws ecs describe-services \
                --cluster "${cluster_name}" \
                --services "${service_name}" \
                --region "${AWS_REGION}" \
                --query 'services[0].events[0:3]' \
                --output table
            
            return 1
        fi
        
        sleep 30
        ((attempt++))
    done
    
    log_error "Deployment of ${service_name} timed out after $((max_attempts * 30)) seconds"
    return 1
}

# Rollback service to previous version
rollback_service() {
    local service_name=$1
    local cluster_name=$(get_terraform_output "cluster_name")
    
    log_warn "Rolling back ${service_name} to previous task definition..."
    
    # Get task definition history
    local task_def_family=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --region "${AWS_REGION}" \
        --query 'services[0].taskDefinition' \
        --output text | cut -d':' -f6 | cut -d'/' -f2)
    
    # Get previous task definition
    local previous_task_def_arn=$(aws ecs list-task-definitions \
        --family-prefix "${task_def_family}" \
        --sort DESC \
        --region "${AWS_REGION}" \
        --query 'taskDefinitionArns[1]' \
        --output text)
    
    if [[ "$previous_task_def_arn" == "null" ]] || [[ -z "$previous_task_def_arn" ]]; then
        log_error "No previous task definition found for rollback"
        return 1
    fi
    
    log_info "Rolling back to: ${previous_task_def_arn}"
    
    # Update service with previous task definition
    aws ecs update-service \
        --cluster "${cluster_name}" \
        --service "${service_name}" \
        --task-definition "${previous_task_def_arn}" \
        --region "${AWS_REGION}" > /dev/null
    
    # Wait for rollback to complete
    wait_for_deployment "${cluster_name}" "${service_name}"
}

# Deploy Gateway service
deploy_gateway() {
    log_info "Deploying Gateway service..."
    
    if [[ -z "${GATEWAY_IMAGE:-}" ]]; then
        log_error "GATEWAY_IMAGE not found in deployment variables"
        return 1
    fi
    
    local service_name=$(get_terraform_output "gateway_service_name")
    update_ecs_service "${service_name}" "${GATEWAY_IMAGE}"
}

# Deploy Hi.Events service
deploy_hievents() {
    log_info "Deploying Hi.Events service..."
    
    if [[ -z "${HIEVENTS_IMAGE:-}" ]]; then
        log_error "HIEVENTS_IMAGE not found in deployment variables"
        return 1
    fi
    
    local service_name=$(get_terraform_output "hievents_service_name")
    update_ecs_service "${service_name}" "${HIEVENTS_IMAGE}"
}

# Run health checks
run_health_checks() {
    log_info "Running post-deployment health checks..."
    
    local cluster_name=$(get_terraform_output "cluster_name")
    local gateway_service=$(get_terraform_output "gateway_service_name")
    local hievents_service=$(get_terraform_output "hievents_service_name")
    
    local health_ok=true
    
    if ! check_service_health "${cluster_name}" "${gateway_service}"; then
        health_ok=false
    fi
    
    if ! check_service_health "${cluster_name}" "${hievents_service}"; then
        health_ok=false
    fi
    
    if [[ "$health_ok" == "true" ]]; then
        log_info "All health checks passed ✓"
        return 0
    else
        log_error "Some health checks failed ✗"
        return 1
    fi
}

# Main deployment function
main() {
    log_info "Starting ECS services deployment for environment: ${ENVIRONMENT}"
    
    # Check prerequisites
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    load_deployment_vars
    
    # Perform deployments
    local deployment_failed=false
    
    if ! deploy_gateway; then
        log_error "Gateway deployment failed"
        deployment_failed=true
    fi
    
    if ! deploy_hievents; then
        log_error "Hi.Events deployment failed"
        deployment_failed=true
    fi
    
    if [[ "$deployment_failed" == "true" ]]; then
        log_error "One or more deployments failed. Consider running rollback."
        exit 1
    fi
    
    # Run health checks
    if ! run_health_checks; then
        log_error "Health checks failed. Consider running rollback."
        exit 1
    fi
    
    log_info "Deployment completed successfully! ✓"
    
    # Show next steps
    echo ""
    log_info "Next steps:"
    echo "1. Monitor services: aws ecs describe-services --cluster $(get_terraform_output cluster_name) --services $(get_terraform_output gateway_service_name) $(get_terraform_output hievents_service_name)"
    echo "2. View CloudWatch dashboard: $(get_terraform_output cloudwatch_dashboard_url)"
    echo "3. Run verification tests: ./scripts/verify-deployment.sh ${ENVIRONMENT}"
}

# Handle rollback if deployment fails
rollback_on_failure() {
    log_warn "Deployment failed. Initiating rollback..."
    
    local gateway_service=$(get_terraform_output "gateway_service_name" 2>/dev/null)
    local hievents_service=$(get_terraform_output "hievents_service_name" 2>/dev/null)
    
    if [[ -n "$gateway_service" ]]; then
        rollback_service "$gateway_service" || true
    fi
    
    if [[ -n "$hievents_service" ]]; then
        rollback_service "$hievents_service" || true
    fi
    
    log_warn "Rollback completed. Please check service status."
}

# Set up trap for rollback on failure
if [[ "${NO_ROLLBACK:-false}" != "true" ]]; then
    trap rollback_on_failure ERR
fi

# Run main function
main "$@"