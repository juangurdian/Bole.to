#!/bin/bash

# SSL Certificate Automation Script for Bole.to Production
# Handles ACM certificate creation, validation, and monitoring

set -euo pipefail

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-api.bole.to}"
HOSTED_ZONE_NAME="${HOSTED_ZONE_NAME:-bole.to}"
AWS_REGION="${AWS_REGION:-us-east-1}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-devops@bole.to}"
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
    
    # Check permissions
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    log INFO "Running as AWS account: $account_id"
    
    log INFO "Prerequisites check completed"
}

# Get hosted zone ID
get_hosted_zone_id() {
    log INFO "Finding hosted zone for $HOSTED_ZONE_NAME..."
    
    local hosted_zone_id=$(aws route53 list-hosted-zones-by-name \
        --dns-name "$HOSTED_ZONE_NAME" \
        --query "HostedZones[?Name=='${HOSTED_ZONE_NAME}.'].Id" \
        --output text | sed 's|/hostedzone/||')
    
    if [[ -z "$hosted_zone_id" || "$hosted_zone_id" == "None" ]]; then
        log ERROR "Hosted zone for $HOSTED_ZONE_NAME not found"
        log INFO "Please create the hosted zone first or verify the domain name"
        exit 1
    fi
    
    log INFO "Found hosted zone ID: $hosted_zone_id"
    echo "$hosted_zone_id"
}

# Check if certificate already exists
check_existing_certificate() {
    log INFO "Checking for existing certificates for $DOMAIN_NAME..."
    
    local existing_cert=$(aws acm list-certificates \
        --region "$AWS_REGION" \
        --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
        --output text)
    
    if [[ -n "$existing_cert" && "$existing_cert" != "None" ]]; then
        log INFO "Found existing certificate: $existing_cert"
        
        # Check certificate status
        local cert_status=$(aws acm describe-certificate \
            --certificate-arn "$existing_cert" \
            --region "$AWS_REGION" \
            --query "Certificate.Status" \
            --output text)
        
        log INFO "Certificate status: $cert_status"
        
        if [[ "$cert_status" == "ISSUED" ]]; then
            log INFO "Valid certificate already exists"
            echo "$existing_cert"
            return 0
        fi
    fi
    
    log INFO "No valid certificate found"
    return 1
}

# Request new certificate
request_certificate() {
    log INFO "Requesting new SSL certificate for $DOMAIN_NAME..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would request certificate for $DOMAIN_NAME"
        return 0
    fi
    
    local cert_arn=$(aws acm request-certificate \
        --domain-name "$DOMAIN_NAME" \
        --subject-alternative-names "*.${DOMAIN_NAME#*.}" \
        --validation-method DNS \
        --region "$AWS_REGION" \
        --tags "Key=Name,Value=boleto-production-cert" \
               "Key=Environment,Value=production" \
               "Key=ManagedBy,Value=automation" \
        --query "CertificateArn" \
        --output text)
    
    if [[ $? -eq 0 && -n "$cert_arn" ]]; then
        log INFO "Certificate requested successfully: $cert_arn"
        echo "$cert_arn"
    else
        log ERROR "Failed to request certificate"
        exit 1
    fi
}

# Wait for validation records
wait_for_validation_records() {
    local cert_arn=$1
    local max_attempts=30
    local attempt=1
    
    log INFO "Waiting for DNS validation records to be available..."
    
    while [[ $attempt -le $max_attempts ]]; do
        local validation_records=$(aws acm describe-certificate \
            --certificate-arn "$cert_arn" \
            --region "$AWS_REGION" \
            --query "Certificate.DomainValidationOptions[0].ResourceRecord" \
            --output json 2>/dev/null)
        
        if [[ -n "$validation_records" && "$validation_records" != "null" ]]; then
            log INFO "Validation records available after $attempt attempts"
            echo "$validation_records"
            return 0
        fi
        
        log DEBUG "Attempt $attempt/$max_attempts: Validation records not yet available"
        sleep 10
        ((attempt++))
    done
    
    log ERROR "Timeout waiting for validation records"
    exit 1
}

# Create DNS validation records
create_validation_records() {
    local cert_arn=$1
    local hosted_zone_id=$2
    
    log INFO "Creating DNS validation records..."
    
    # Get validation records
    local validation_records=$(wait_for_validation_records "$cert_arn")
    local validation_name=$(echo "$validation_records" | jq -r '.Name')
    local validation_value=$(echo "$validation_records" | jq -r '.Value')
    
    if [[ -z "$validation_name" || -z "$validation_value" || "$validation_name" == "null" || "$validation_value" == "null" ]]; then
        log ERROR "Invalid validation records received"
        exit 1
    fi
    
    log INFO "Adding DNS validation record: $validation_name"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would create DNS record $validation_name -> $validation_value"
        return 0
    fi
    
    # Create change batch
    local change_batch=$(cat <<EOF
{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "$validation_name",
            "Type": "CNAME",
            "TTL": 300,
            "ResourceRecords": [{
                "Value": "$validation_value"
            }]
        }
    }]
}
EOF
)
    
    # Apply DNS change
    local change_id=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$hosted_zone_id" \
        --change-batch "$change_batch" \
        --query "ChangeInfo.Id" \
        --output text)
    
    if [[ $? -eq 0 && -n "$change_id" ]]; then
        log INFO "DNS validation record created: $change_id"
        
        # Wait for DNS change to propagate
        log INFO "Waiting for DNS changes to propagate..."
        aws route53 wait resource-record-sets-changed --id "$change_id"
        log INFO "DNS changes propagated successfully"
    else
        log ERROR "Failed to create DNS validation record"
        exit 1
    fi
}

# Wait for certificate validation
wait_for_certificate_validation() {
    local cert_arn=$1
    local max_wait_time=1200  # 20 minutes
    local check_interval=30
    local elapsed_time=0
    
    log INFO "Waiting for certificate validation (max ${max_wait_time}s)..."
    
    while [[ $elapsed_time -lt $max_wait_time ]]; do
        local cert_status=$(aws acm describe-certificate \
            --certificate-arn "$cert_arn" \
            --region "$AWS_REGION" \
            --query "Certificate.Status" \
            --output text)
        
        case $cert_status in
            "ISSUED")
                log INFO "Certificate validated and issued successfully!"
                return 0
                ;;
            "PENDING_VALIDATION")
                log DEBUG "Certificate still pending validation... (${elapsed_time}s elapsed)"
                ;;
            "FAILED")
                log ERROR "Certificate validation failed"
                return 1
                ;;
            *)
                log WARN "Unknown certificate status: $cert_status"
                ;;
        esac
        
        sleep $check_interval
        elapsed_time=$((elapsed_time + check_interval))
    done
    
    log ERROR "Timeout waiting for certificate validation"
    return 1
}

# Set up certificate monitoring
setup_certificate_monitoring() {
    local cert_arn=$1
    
    log INFO "Setting up certificate expiration monitoring..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would set up certificate monitoring"
        return 0
    fi
    
    # Create SNS topic for alerts if it doesn't exist
    local topic_arn=$(aws sns create-topic \
        --name "boleto-ssl-certificate-alerts" \
        --region "$AWS_REGION" \
        --query "TopicArn" \
        --output text)
    
    # Subscribe email to topic
    aws sns subscribe \
        --topic-arn "$topic_arn" \
        --protocol email \
        --notification-endpoint "$NOTIFICATION_EMAIL" \
        --region "$AWS_REGION" > /dev/null || log WARN "Email subscription may already exist"
    
    # Create CloudWatch alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "SSL-Certificate-Expiration-${DOMAIN_NAME//\./-}" \
        --alarm-description "Alert when SSL certificate is about to expire" \
        --metric-name DaysToExpiry \
        --namespace AWS/CertificateManager \
        --statistic Average \
        --period 86400 \
        --evaluation-periods 1 \
        --threshold 30 \
        --comparison-operator LessThanThreshold \
        --dimensions Name=CertificateArn,Value="$cert_arn" \
        --alarm-actions "$topic_arn" \
        --ok-actions "$topic_arn" \
        --region "$AWS_REGION"
    
    log INFO "Certificate monitoring set up with email alerts to $NOTIFICATION_EMAIL"
}

# Verify certificate installation
verify_certificate() {
    local domain=$1
    
    log INFO "Verifying certificate installation for $domain..."
    
    # Wait a bit for DNS propagation
    sleep 30
    
    # Test SSL connection
    if command -v openssl &> /dev/null; then
        log INFO "Testing SSL connection..."
        if echo | timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0 (ok)"; then
            log INFO "SSL certificate verification successful"
        else
            log WARN "SSL certificate verification failed or incomplete"
        fi
    fi
    
    # Test HTTPS connectivity
    if command -v curl &> /dev/null; then
        log INFO "Testing HTTPS connectivity..."
        if curl -s --max-time 30 "https://$domain/healthz" > /dev/null 2>&1; then
            log INFO "HTTPS connectivity test successful"
        else
            log WARN "HTTPS connectivity test failed (service may not be deployed yet)"
        fi
    fi
}

# Main execution
main() {
    log INFO "Starting SSL certificate automation for $DOMAIN_NAME"
    log INFO "Region: $AWS_REGION"
    log INFO "Hosted Zone: $HOSTED_ZONE_NAME"
    
    # Check prerequisites
    check_prerequisites
    
    # Get hosted zone ID
    local hosted_zone_id
    hosted_zone_id=$(get_hosted_zone_id)
    
    # Check for existing certificate
    local cert_arn
    if cert_arn=$(check_existing_certificate); then
        log INFO "Using existing certificate: $cert_arn"
    else
        # Request new certificate
        cert_arn=$(request_certificate)
        
        # Create DNS validation records
        create_validation_records "$cert_arn" "$hosted_zone_id"
        
        # Wait for certificate validation
        if ! wait_for_certificate_validation "$cert_arn"; then
            log ERROR "Certificate validation failed"
            exit 1
        fi
    fi
    
    # Set up monitoring
    setup_certificate_monitoring "$cert_arn"
    
    # Verify certificate (optional)
    # verify_certificate "$DOMAIN_NAME"
    
    log INFO "SSL certificate automation completed successfully"
    log INFO "Certificate ARN: $cert_arn"
    log INFO "You can now use this certificate in your CloudFront distribution and ALB"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        --zone)
            HOSTED_ZONE_NAME="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --email)
            NOTIFICATION_EMAIL="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --domain DOMAIN      Domain name for certificate (default: api.bole.to)"
            echo "  --zone ZONE          Hosted zone name (default: bole.to)"
            echo "  --region REGION      AWS region (default: us-east-1)"
            echo "  --email EMAIL        Notification email (default: devops@bole.to)"
            echo "  --dry-run            Show what would be done without executing"
            echo "  --help               Show this help message"
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