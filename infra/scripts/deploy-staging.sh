#!/bin/bash

# Bole.to Staging Deployment Script
# This script deploys the infrastructure and applications to the staging environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/infra/terraform/staging"
ENV_FILE="${TERRAFORM_DIR}/terraform.tfvars"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

confirm() {
    read -p "$(echo -e "${YELLOW}$1 (y/N): ${NC}")" -r
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check if required tools are installed
    command -v terraform >/dev/null 2>&1 || error "Terraform is not installed"
    command -v doctl >/dev/null 2>&1 || warning "DigitalOcean CLI not installed (optional but recommended)"
    
    # Check Terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    log "Using Terraform version: ${TERRAFORM_VERSION}"
    
    # Check if terraform.tfvars exists
    if [[ ! -f "${ENV_FILE}" ]]; then
        error "terraform.tfvars not found at ${ENV_FILE}. Please copy from terraform.tfvars.example and configure."
    fi
    
    # Check if we're in the right directory
    if [[ ! -d "${TERRAFORM_DIR}" ]]; then
        error "Terraform staging directory not found: ${TERRAFORM_DIR}"
    fi
    
    # Check if git repo is clean (optional warning)
    if command -v git >/dev/null 2>&1; then
        if [[ -n $(git status --porcelain) ]]; then
            warning "Git repository has uncommitted changes"
        fi
    fi
    
    success "Pre-flight checks completed"
}

# Initialize Terraform
init_terraform() {
    log "Initializing Terraform..."
    cd "${TERRAFORM_DIR}"
    
    terraform init
    
    success "Terraform initialized"
}

# Plan deployment
plan_deployment() {
    log "Planning Terraform deployment..."
    cd "${TERRAFORM_DIR}"
    
    terraform plan -var-file="${ENV_FILE}" -out=staging.tfplan
    
    success "Terraform plan completed"
}

# Apply deployment
apply_deployment() {
    log "Applying Terraform deployment..."
    cd "${TERRAFORM_DIR}"
    
    if confirm "Are you sure you want to apply the Terraform plan?"; then
        terraform apply staging.tfplan
        success "Terraform deployment completed"
    else
        warning "Deployment cancelled"
        exit 0
    fi
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    cd "${TERRAFORM_DIR}"
    
    # Get outputs
    GATEWAY_URL=$(terraform output -raw gateway_url)
    HIEVENTS_URL=$(terraform output -raw hievents_url)
    
    log "Testing gateway health endpoint..."
    if curl -sSf "${GATEWAY_URL}/healthz" > /dev/null; then
        success "Gateway health check passed"
    else
        error "Gateway health check failed"
    fi
    
    log "Testing Hi.Events backend..."
    if curl -sSf "${HIEVENTS_URL}/api/public/color-themes" > /dev/null; then
        success "Hi.Events backend health check passed"
    else
        error "Hi.Events backend health check failed"
    fi
    
    success "Deployment validation completed"
}

# Show deployment info
show_info() {
    log "Deployment Information:"
    cd "${TERRAFORM_DIR}"
    
    echo ""
    echo "🔗 Service URLs:"
    echo "   Gateway API: $(terraform output -raw gateway_url)"
    echo "   Hi.Events Backend: $(terraform output -raw hievents_url)"
    echo ""
    echo "🏥 Health Check Endpoints:"
    terraform output -json health_check_endpoints | jq -r 'to_entries[] | "   \(.key): \(.value)"'
    echo ""
    echo "💰 Estimated Monthly Cost:"
    terraform output -json estimated_monthly_cost | jq -r '.total_estimated'
    echo ""
    echo "🌍 Environment Info:"
    terraform output -json environment_info | jq -r 'to_entries[] | "   \(.key): \(.value)"'
}

# Cleanup function
cleanup() {
    if [[ -f "${TERRAFORM_DIR}/staging.tfplan" ]]; then
        rm "${TERRAFORM_DIR}/staging.tfplan"
    fi
}

# Main execution
main() {
    log "🚀 Starting Bole.to Staging Deployment"
    
    trap cleanup EXIT
    
    preflight_checks
    init_terraform
    plan_deployment
    apply_deployment
    
    # Wait a bit for services to start
    log "Waiting for services to start..."
    sleep 30
    
    validate_deployment
    show_info
    
    success "🎉 Staging deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the mobile app against the new staging API"
    echo "2. Run integration tests"
    echo "3. Monitor the services for any issues"
    echo "4. Update mobile app configuration to use the new staging URL"
}

# Help function
show_help() {
    cat << EOF
Bole.to Staging Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help      Show this help message
    -p, --plan-only Only run terraform plan, don't apply
    -d, --destroy   Destroy the staging infrastructure
    -v, --validate  Only validate existing deployment

Examples:
    $0                  # Full deployment
    $0 --plan-only     # Plan only
    $0 --validate      # Validate existing deployment
    $0 --destroy       # Destroy infrastructure

EOF
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -p|--plan-only)
        preflight_checks
        init_terraform
        plan_deployment
        log "Plan completed. Review the output above."
        ;;
    -d|--destroy)
        if confirm "Are you sure you want to DESTROY the staging infrastructure?"; then
            cd "${TERRAFORM_DIR}"
            terraform destroy -var-file="${ENV_FILE}"
            success "Infrastructure destroyed"
        fi
        ;;
    -v|--validate)
        validate_deployment
        show_info
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1. Use --help for usage information."
        ;;
esac