#!/bin/bash

# Setup script for configuring secrets and environment variables
# This script helps set up the necessary secrets for the deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
}

# Check if required tools are installed
check_requirements() {
    log "Checking requirements..."
    
    command -v php >/dev/null 2>&1 || error "PHP is required but not installed"
    command -v composer >/dev/null 2>&1 || error "Composer is required but not installed"
    command -v openssl >/dev/null 2>&1 || error "OpenSSL is required but not installed"
    
    success "All requirements satisfied"
}

# Generate Laravel App Key
generate_app_key() {
    log "Generating Laravel application key..."
    
    # Check if Hi.Events directory exists
    HIEVENTS_DIR="$(dirname "$0")/../../services/hi-events"
    if [[ ! -d "$HIEVENTS_DIR" ]]; then
        error "Hi.Events directory not found at: $HIEVENTS_DIR"
    fi
    
    cd "$HIEVENTS_DIR"
    
    # Copy .env.example if .env doesn't exist
    if [[ ! -f .env ]]; then
        cp .env.example .env || error "Failed to create .env file"
    fi
    
    # Generate app key
    php artisan key:generate --show | grep -o 'base64:.*'
}

# Generate JWT Secret
generate_jwt_secret() {
    log "Generating JWT secret..."
    openssl rand -base64 32
}

# Generate random password
generate_password() {
    openssl rand -base64 24
}

# Setup GitHub Secrets Guide
show_github_secrets_guide() {
    log "GitHub Secrets Setup Guide"
    
    echo ""
    echo "To deploy via GitHub Actions, you need to configure the following secrets in your repository:"
    echo "Go to: Settings > Secrets and variables > Actions > New repository secret"
    echo ""
    
    echo "Required Secrets:"
    echo "=================="
    echo ""
    
    echo "1. DIGITALOCEAN_TOKEN"
    echo "   - Go to: https://cloud.digitalocean.com/account/api/tokens"
    echo "   - Create a Personal Access Token with full permissions"
    echo "   - Copy the token value"
    echo ""
    
    echo "2. CLOUDFLARE_API_TOKEN"
    echo "   - Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "   - Create Custom Token with:"
    echo "     • Zone: Zone Settings, Zone: Read, DNS: Edit"
    echo "     • Include: All zones from account"
    echo "   - Copy the token value"
    echo ""
    
    echo "3. LARAVEL_APP_KEY"
    APP_KEY=$(generate_app_key)
    echo "   Value: ${APP_KEY}"
    echo ""
    
    echo "4. JWT_SECRET"
    JWT_SECRET=$(generate_jwt_secret)
    echo "   Value: ${JWT_SECRET}"
    echo ""
    
    echo "5. STRIPE_PUBLIC_KEY_TEST"
    echo "   - Go to: https://dashboard.stripe.com/test/apikeys"
    echo "   - Copy the Publishable key (pk_test_...)"
    echo ""
    
    echo "6. STRIPE_SECRET_KEY_TEST"
    echo "   - Go to: https://dashboard.stripe.com/test/apikeys"
    echo "   - Copy the Secret key (sk_test_...)"
    echo ""
    
    echo "Email Configuration (choose one):"
    echo "=================================="
    echo ""
    echo "Option A - Mailgun:"
    echo "7. MAIL_HOST = smtp.mailgun.org"
    echo "8. MAIL_PORT = 587"
    echo "9. MAIL_USERNAME = (your Mailgun SMTP username)"
    echo "10. MAIL_PASSWORD = (your Mailgun SMTP password)"
    echo ""
    
    echo "Option B - Gmail:"
    echo "7. MAIL_HOST = smtp.gmail.com"
    echo "8. MAIL_PORT = 587"
    echo "9. MAIL_USERNAME = (your Gmail address)"
    echo "10. MAIL_PASSWORD = (your Gmail app password)"
    echo ""
    
    echo "Option C - SendGrid:"
    echo "7. MAIL_HOST = smtp.sendgrid.net"
    echo "8. MAIL_PORT = 587"
    echo "9. MAIL_USERNAME = apikey"
    echo "10. MAIL_PASSWORD = (your SendGrid API key)"
    echo ""
}

# Generate terraform.tfvars template
generate_tfvars_template() {
    log "Generating terraform.tfvars template..."
    
    TFVARS_FILE="$(dirname "$0")/../terraform/staging/terraform.tfvars"
    TFVARS_EXAMPLE="$(dirname "$0")/../terraform/staging/terraform.tfvars.example"
    
    if [[ -f "$TFVARS_FILE" ]]; then
        warning "terraform.tfvars already exists. Backing up to terraform.tfvars.backup"
        cp "$TFVARS_FILE" "${TFVARS_FILE}.backup"
    fi
    
    if [[ ! -f "$TFVARS_EXAMPLE" ]]; then
        error "terraform.tfvars.example not found"
    fi
    
    # Copy example and add generated values
    cp "$TFVARS_EXAMPLE" "$TFVARS_FILE"
    
    # Generate and replace values
    APP_KEY=$(generate_app_key)
    JWT_SECRET=$(generate_jwt_secret)
    
    # Update the file with generated values
    sed -i.bak "s|app_key.*=.*|app_key = \"${APP_KEY}\"|" "$TFVARS_FILE"
    sed -i.bak "s|jwt_secret.*=.*|jwt_secret = \"${JWT_SECRET}\"|" "$TFVARS_FILE"
    
    rm "${TFVARS_FILE}.bak"
    
    success "terraform.tfvars created with generated keys"
    warning "Please edit $TFVARS_FILE and configure the remaining values:"
    echo "  - DigitalOcean token"
    echo "  - Cloudflare API token"
    echo "  - Stripe keys"
    echo "  - Email configuration"
    echo "  - GitHub repository URL"
}

# Show cost estimation
show_cost_estimation() {
    log "Cost Estimation for Staging Environment"
    echo ""
    echo "Monthly costs (USD):"
    echo "===================="
    echo "• PostgreSQL Database (db-s-1vcpu-1gb): ~\$15/month"
    echo "• Gateway App (basic-xxs): ~\$5/month"
    echo "• Hi.Events App (basic-xxs): ~\$5/month"
    echo "• Container Registry (basic): \$0/month"
    echo "• Cloudflare (free features): \$0/month"
    echo "• Data transfer: ~\$1-2/month (estimated)"
    echo ""
    echo "Total estimated cost: ~\$26-27/month"
    echo ""
    echo "Notes:"
    echo "• Costs may vary based on actual usage"
    echo "• Database backups are included"
    echo "• SSL certificates are free via Cloudflare"
    echo "• First \$200 credit for new DigitalOcean accounts"
}

# Main menu
main_menu() {
    echo ""
    echo "Bole.to Infrastructure Setup Helper"
    echo "===================================="
    echo ""
    echo "Choose an option:"
    echo "1. Show GitHub Secrets setup guide"
    echo "2. Generate terraform.tfvars template"
    echo "3. Show cost estimation"
    echo "4. Generate Laravel app key only"
    echo "5. Generate JWT secret only"
    echo "6. All of the above"
    echo "0. Exit"
    echo ""
    read -p "Enter your choice [0-6]: " choice
    
    case $choice in
        1)
            show_github_secrets_guide
            ;;
        2)
            generate_tfvars_template
            ;;
        3)
            show_cost_estimation
            ;;
        4)
            echo "Laravel App Key: $(generate_app_key)"
            ;;
        5)
            echo "JWT Secret: $(generate_jwt_secret)"
            ;;
        6)
            show_github_secrets_guide
            echo ""
            generate_tfvars_template
            echo ""
            show_cost_estimation
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            error "Invalid choice. Please select 0-6."
            main_menu
            ;;
    esac
}

# Run setup
main() {
    log "🚀 Starting Bole.to Infrastructure Setup"
    
    check_requirements
    main_menu
    
    echo ""
    success "Setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your secrets (GitHub or terraform.tfvars)"
    echo "2. Update your repository URL in the configuration"
    echo "3. Run the deployment: ./deploy-staging.sh"
}

main "$@"