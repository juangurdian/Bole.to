#!/bin/bash

# Secrets Setup Script for Bole.to Production
# This script initializes AWS Secrets Manager and Parameter Store with production values

set -euo pipefail

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SECRET_NAME="boleto-${ENVIRONMENT}-secrets"
PARAMETER_PREFIX="/boleto/${ENVIRONMENT}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message" >&2
            ;;
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log ERROR "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log ERROR "jq not found. Please install jq for JSON processing."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log ERROR "AWS credentials not configured or invalid."
        exit 1
    fi
    
    # Check for required environment variables for secrets
    local required_secrets=(
        "DATABASE_PASSWORD"
        "JWT_PRIVATE_KEY"
        "JWT_PUBLIC_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    local missing_secrets=()
    for secret in "${required_secrets[@]}"; do
        if [[ -z "${!secret:-}" ]]; then
            missing_secrets+=("$secret")
        fi
    done
    
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log ERROR "Missing required environment variables for secrets:"
        for secret in "${missing_secrets[@]}"; do
            log ERROR "  - $secret"
        done
        log INFO "Please set these environment variables before running this script."
        exit 1
    fi
    
    log INFO "Prerequisites check completed"
}

# Generate secure random values for missing secrets
generate_secure_values() {
    log INFO "Generating secure values for missing secrets..."
    
    # Generate session secret if not provided
    if [[ -z "${SESSION_SECRET:-}" ]]; then
        export SESSION_SECRET=$(openssl rand -base64 32)
        log INFO "Generated SESSION_SECRET"
    fi
    
    # Generate webhook secret if not provided
    if [[ -z "${WEBHOOK_SECRET:-}" ]]; then
        export WEBHOOK_SECRET=$(openssl rand -base64 32)
        log INFO "Generated WEBHOOK_SECRET"
    fi
    
    # Generate Redis auth token if not provided
    if [[ -z "${REDIS_AUTH_TOKEN:-}" ]]; then
        export REDIS_AUTH_TOKEN=$(openssl rand -base64 32)
        log INFO "Generated REDIS_AUTH_TOKEN"
    fi
}

# Create KMS key for encryption
create_kms_key() {
    log INFO "Creating KMS key for secrets encryption..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would create KMS key"
        return 0
    fi
    
    local key_policy=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Enable IAM User Permissions",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):root"
            },
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow use of the key for Secrets Manager",
            "Effect": "Allow",
            "Principal": {
                "Service": "secretsmanager.amazonaws.com"
            },
            "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:Encrypt",
                "kms:GenerateDataKey*",
                "kms:ReEncrypt*"
            ],
            "Resource": "*"
        }
    ]
}
EOF
)
    
    # Check if key already exists
    local existing_key=$(aws kms list-aliases \
        --query "Aliases[?AliasName=='alias/boleto-secrets-${ENVIRONMENT}'].TargetKeyId" \
        --output text --region "$AWS_REGION")
    
    if [[ -n "$existing_key" && "$existing_key" != "None" ]]; then
        log INFO "KMS key already exists: $existing_key"
        echo "$existing_key"
        return 0
    fi
    
    # Create new KMS key
    local key_id=$(aws kms create-key \
        --policy "$key_policy" \
        --description "Encryption key for Bole.to ${ENVIRONMENT} secrets" \
        --region "$AWS_REGION" \
        --query "KeyMetadata.KeyId" \
        --output text)
    
    if [[ $? -eq 0 && -n "$key_id" ]]; then
        log INFO "Created KMS key: $key_id"
        
        # Create alias for the key
        aws kms create-alias \
            --alias-name "alias/boleto-secrets-${ENVIRONMENT}" \
            --target-key-id "$key_id" \
            --region "$AWS_REGION"
        
        log INFO "Created KMS key alias: alias/boleto-secrets-${ENVIRONMENT}"
        echo "$key_id"
    else
        log ERROR "Failed to create KMS key"
        exit 1
    fi
}

# Set up Secrets Manager secret
setup_secrets_manager() {
    local kms_key_id=$1
    
    log INFO "Setting up Secrets Manager secret: $SECRET_NAME"
    
    # Create secrets JSON
    local secrets_json=$(cat <<EOF
{
    "DATABASE_PASSWORD": "${DATABASE_PASSWORD}",
    "JWT_PRIVATE_KEY": "${JWT_PRIVATE_KEY}",
    "JWT_PUBLIC_KEY": "${JWT_PUBLIC_KEY}",
    "GOOGLE_CLIENT_ID": "${GOOGLE_CLIENT_ID}",
    "GOOGLE_CLIENT_SECRET": "${GOOGLE_CLIENT_SECRET}",
    "APPLE_CLIENT_ID": "${APPLE_CLIENT_ID:-com.bole.to}",
    "APPLE_KEY_ID": "${APPLE_KEY_ID:-}",
    "APPLE_TEAM_ID": "${APPLE_TEAM_ID:-}",
    "APPLE_PRIVATE_KEY": "${APPLE_PRIVATE_KEY:-}",
    "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}",
    "STRIPE_WEBHOOK_SECRET": "${STRIPE_WEBHOOK_SECRET}",
    "SESSION_SECRET": "${SESSION_SECRET}",
    "WEBHOOK_SECRET": "${WEBHOOK_SECRET}",
    "REDIS_AUTH_TOKEN": "${REDIS_AUTH_TOKEN}"
}
EOF
)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would create Secrets Manager secret"
        log DEBUG "Secret content (passwords hidden):"
        echo "$secrets_json" | jq 'with_entries(select(.key | contains("PASSWORD") | not) | select(.key | contains("SECRET") | not) | select(.key | contains("KEY") | not))'
        return 0
    fi
    
    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
        log INFO "Secret already exists, updating..."
        aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$secrets_json" \
            --region "$AWS_REGION" > /dev/null
        log INFO "Secret updated successfully"
    else
        log INFO "Creating new secret..."
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "Production secrets for Bole.to ${ENVIRONMENT}" \
            --secret-string "$secrets_json" \
            --kms-key-id "$kms_key_id" \
            --region "$AWS_REGION" \
            --tags "Key=Environment,Value=${ENVIRONMENT}" \
                   "Key=Application,Value=boleto" \
                   "Key=ManagedBy,Value=automation" > /dev/null
        log INFO "Secret created successfully"
    fi
}

# Set up Parameter Store parameters
setup_parameter_store() {
    log INFO "Setting up Parameter Store parameters..."
    
    # Define parameters
    declare -A parameters=(
        ["NODE_ENV"]="$ENVIRONMENT"
        ["LOG_LEVEL"]="info"
        ["PORT"]="3001"
        ["JWT_ISSUER"]="https://api.bole.to"
        ["JWT_AUDIENCE"]="boleto-mobile"
        ["JWT_ALGORITHM"]="RS256"
        ["CORS_ORIGINS"]="https://app.bole.to,https://www.bole.to,com.bole.to://"
        ["RATE_LIMIT_WINDOW_MS"]="900000"
        ["RATE_LIMIT_MAX_REQUESTS"]="100"
        ["RATE_LIMIT_AUTH_WINDOW_MS"]="300000"
        ["RATE_LIMIT_AUTH_MAX_REQUESTS"]="10"
        ["REQUEST_TIMEOUT"]="30000"
        ["HIEVENTS_API_URL"]="http://hi-events-service:8000/api"
        ["DATABASE_HOST"]="${DATABASE_HOST:-boleto-production-rds.region.rds.amazonaws.com}"
        ["DATABASE_PORT"]="5432"
        ["DATABASE_NAME"]="boleto_production"
        ["DATABASE_USER"]="boleto_app"
        ["REDIS_HOST"]="${REDIS_HOST:-boleto-production-redis.region.cache.amazonaws.com}"
        ["REDIS_PORT"]="6379"
        ["REDIS_DB"]="0"
        ["BACKUP_ENABLED"]="true"
        ["METRICS_ENABLED"]="true"
        ["HEALTH_CHECK_INTERVAL"]="30"
        ["FEATURE_FLAGS_ENABLED"]="true"
        ["AUDIT_LOGGING_ENABLED"]="true"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would create Parameter Store parameters:"
        for key in "${!parameters[@]}"; do
            log DEBUG "  ${PARAMETER_PREFIX}/$key = ${parameters[$key]}"
        done
        return 0
    fi
    
    # Create/update parameters
    for key in "${!parameters[@]}"; do
        local parameter_name="${PARAMETER_PREFIX}/$key"
        local parameter_value="${parameters[$key]}"
        
        aws ssm put-parameter \
            --name "$parameter_name" \
            --value "$parameter_value" \
            --type "String" \
            --overwrite \
            --region "$AWS_REGION" \
            --tags "Key=Environment,Value=${ENVIRONMENT}" \
                   "Key=Application,Value=boleto" > /dev/null
        
        log DEBUG "Created/updated parameter: $parameter_name"
    done
    
    log INFO "Parameter Store setup completed"
}

# Create IAM policy for accessing secrets
create_iam_policy() {
    log INFO "Creating IAM policy for secret access..."
    
    local policy_name="BoletoSecretsAccess-${ENVIRONMENT}"
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    
    local policy_document=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:${AWS_REGION}:${account_id}:secret:${SECRET_NAME}*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": [
                "arn:aws:ssm:${AWS_REGION}:${account_id}:parameter${PARAMETER_PREFIX}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": [
                "arn:aws:kms:${AWS_REGION}:${account_id}:key/*"
            ],
            "Condition": {
                "StringEquals": {
                    "kms:ViaService": [
                        "secretsmanager.${AWS_REGION}.amazonaws.com",
                        "ssm.${AWS_REGION}.amazonaws.com"
                    ]
                }
            }
        }
    ]
}
EOF
)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would create IAM policy $policy_name"
        return 0
    fi
    
    # Check if policy already exists
    if aws iam get-policy --policy-arn "arn:aws:iam::${account_id}:policy/${policy_name}" &> /dev/null; then
        log INFO "IAM policy already exists, updating..."
        aws iam create-policy-version \
            --policy-arn "arn:aws:iam::${account_id}:policy/${policy_name}" \
            --policy-document "$policy_document" \
            --set-as-default > /dev/null
    else
        log INFO "Creating new IAM policy..."
        aws iam create-policy \
            --policy-name "$policy_name" \
            --policy-document "$policy_document" \
            --description "Policy for accessing Bole.to ${ENVIRONMENT} secrets" > /dev/null
    fi
    
    log INFO "IAM policy setup completed"
}

# Verify secret access
verify_secret_access() {
    log INFO "Verifying secret access..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would verify secret access"
        return 0
    fi
    
    # Test Secrets Manager access
    if aws secretsmanager get-secret-value \
        --secret-id "$SECRET_NAME" \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        log INFO "✓ Secrets Manager access verified"
    else
        log WARN "✗ Secrets Manager access failed"
    fi
    
    # Test Parameter Store access
    if aws ssm get-parameter \
        --name "${PARAMETER_PREFIX}/NODE_ENV" \
        --region "$AWS_REGION" > /dev/null 2>&1; then
        log INFO "✓ Parameter Store access verified"
    else
        log WARN "✗ Parameter Store access failed"
    fi
}

# Print deployment information
print_deployment_info() {
    log INFO "Secrets setup completed successfully!"
    echo
    echo "=== Deployment Information ==="
    echo "Secret Name: $SECRET_NAME"
    echo "Parameter Prefix: $PARAMETER_PREFIX"
    echo "AWS Region: $AWS_REGION"
    echo "Environment: $ENVIRONMENT"
    echo
    echo "=== Next Steps ==="
    echo "1. Update your ECS task definitions to reference these secrets"
    echo "2. Ensure your ECS task role has the BoletoSecretsAccess-${ENVIRONMENT} policy"
    echo "3. Deploy your application containers"
    echo "4. Verify application can access secrets in CloudWatch logs"
    echo
    echo "=== Important Security Notes ==="
    echo "- Secrets are encrypted with KMS"
    echo "- Access is controlled via IAM policies"
    echo "- Consider setting up secret rotation for sensitive values"
    echo "- Monitor secret access via CloudTrail"
}

# Main execution
main() {
    log INFO "Starting secrets setup for Bole.to ${ENVIRONMENT}"
    log INFO "AWS Region: $AWS_REGION"
    
    # Check prerequisites
    check_prerequisites
    
    # Generate secure values
    generate_secure_values
    
    # Create KMS key
    local kms_key_id
    kms_key_id=$(create_kms_key)
    
    # Setup Secrets Manager
    setup_secrets_manager "$kms_key_id"
    
    # Setup Parameter Store
    setup_parameter_store
    
    # Create IAM policy
    create_iam_policy
    
    # Verify access
    verify_secret_access
    
    # Print deployment info
    print_deployment_info
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --environment ENV    Environment name (default: production)"
            echo "  --region REGION      AWS region (default: us-east-1)"
            echo "  --dry-run            Show what would be done without executing"
            echo "  --help               Show this help message"
            echo
            echo "Required Environment Variables:"
            echo "  DATABASE_PASSWORD    Strong password for database"
            echo "  JWT_PRIVATE_KEY      RSA private key for JWT signing"
            echo "  JWT_PUBLIC_KEY       RSA public key for JWT verification"
            echo "  GOOGLE_CLIENT_ID     Google OAuth client ID"
            echo "  GOOGLE_CLIENT_SECRET Google OAuth client secret"
            echo "  STRIPE_SECRET_KEY    Stripe secret key"
            echo "  STRIPE_WEBHOOK_SECRET Stripe webhook secret"
            echo
            echo "Optional Environment Variables:"
            echo "  APPLE_CLIENT_ID      Apple OAuth client ID"
            echo "  APPLE_KEY_ID         Apple OAuth key ID"
            echo "  APPLE_TEAM_ID        Apple OAuth team ID"
            echo "  APPLE_PRIVATE_KEY    Apple OAuth private key"
            echo "  SESSION_SECRET       Session encryption secret (auto-generated)"
            echo "  WEBHOOK_SECRET       Internal webhook secret (auto-generated)"
            echo "  REDIS_AUTH_TOKEN     Redis authentication token (auto-generated)"
            exit 0
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main