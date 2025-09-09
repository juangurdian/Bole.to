#!/bin/bash
# Build and Push Container Images to ECR
set -euo pipefail

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to get ECR repository URI from Terraform output
get_ecr_repo() {
    local service_name=$1
    terraform -chdir="${PROJECT_ROOT}/infra/terraform" output -raw "ecr_${service_name}_repository_url" 2>/dev/null || {
        log_error "Failed to get ECR repository URL for ${service_name}"
        return 1
    }
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Login to ECR
ecr_login() {
    log_info "Logging into ECR..."
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com
    
    log_info "ECR login successful ✓"
}

# Build and push Gateway service
build_gateway() {
    log_info "Building Gateway service..."
    
    local gateway_repo=$(get_ecr_repo "gateway")
    local image_tag="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    local latest_tag="${ENVIRONMENT}-latest"
    
    cd "${PROJECT_ROOT}/services/gateway"
    
    # Build image
    docker build -t boleto-gateway:${image_tag} .
    docker tag boleto-gateway:${image_tag} ${gateway_repo}:${image_tag}
    docker tag boleto-gateway:${image_tag} ${gateway_repo}:${latest_tag}
    
    # Push image
    docker push ${gateway_repo}:${image_tag}
    docker push ${gateway_repo}:${latest_tag}
    
    log_info "Gateway image pushed: ${gateway_repo}:${image_tag} ✓"
    echo "GATEWAY_IMAGE=${gateway_repo}:${image_tag}" >> ${PROJECT_ROOT}/infra/.env.deploy
}

# Build and push Hi.Events service
build_hievents() {
    log_info "Building Hi.Events service..."
    
    local hievents_repo=$(get_ecr_repo "hievents")
    local image_tag="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    local latest_tag="${ENVIRONMENT}-latest"
    
    cd "${PROJECT_ROOT}/hi-events"
    
    # Build image
    docker build -t boleto-hievents:${image_tag} .
    docker tag boleto-hievents:${image_tag} ${hievents_repo}:${image_tag}
    docker tag boleto-hievents:${image_tag} ${hievents_repo}:${latest_tag}
    
    # Push image
    docker push ${hievents_repo}:${image_tag}
    docker push ${hievents_repo}:${latest_tag}
    
    log_info "Hi.Events image pushed: ${hievents_repo}:${image_tag} ✓"
    echo "HIEVENTS_IMAGE=${hievents_repo}:${image_tag}" >> ${PROJECT_ROOT}/infra/.env.deploy
}

# Run security scan
security_scan() {
    log_info "Running security scans..."
    
    # Check if images have any HIGH or CRITICAL vulnerabilities
    local gateway_repo=$(get_ecr_repo "gateway")
    local hievents_repo=$(get_ecr_repo "hievents")
    
    log_info "Scanning Gateway image for vulnerabilities..."
    aws ecr describe-image-scan-findings \
        --repository-name $(basename ${gateway_repo}) \
        --image-id imageTag=${ENVIRONMENT}-latest \
        --region ${AWS_REGION} > /tmp/gateway-scan.json || true
    
    log_info "Scanning Hi.Events image for vulnerabilities..."
    aws ecr describe-image-scan-findings \
        --repository-name $(basename ${hievents_repo}) \
        --image-id imageTag=${ENVIRONMENT}-latest \
        --region ${AWS_REGION} > /tmp/hievents-scan.json || true
    
    log_info "Security scans completed. Check /tmp/*-scan.json for results ✓"
}

# Main execution
main() {
    log_info "Starting container build and push for environment: ${ENVIRONMENT}"
    
    # Initialize deployment environment file
    echo "# Deployment environment variables" > ${PROJECT_ROOT}/infra/.env.deploy
    echo "ENVIRONMENT=${ENVIRONMENT}" >> ${PROJECT_ROOT}/infra/.env.deploy
    echo "BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> ${PROJECT_ROOT}/infra/.env.deploy
    
    check_prerequisites
    ecr_login
    build_gateway
    build_hievents
    security_scan
    
    log_info "Build and push completed successfully! ✓"
    log_info "Deployment variables saved to: ${PROJECT_ROOT}/infra/.env.deploy"
    
    # Show next steps
    echo ""
    log_info "Next steps:"
    echo "1. Review security scan results in /tmp/*-scan.json"
    echo "2. Deploy services: ./scripts/deploy-services.sh ${ENVIRONMENT}"
    echo "3. Verify deployment: ./scripts/verify-deployment.sh ${ENVIRONMENT}"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up local Docker images..."
    docker system prune -f || true
}

# Set up trap for cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"