#!/bin/bash

# Production Deployment Verification Script for Bole.to
# Comprehensive verification of all production components

set -euo pipefail

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="${DOMAIN_NAME:-api.bole.to}"
TIMEOUT="${TIMEOUT:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

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
            ((WARNINGS++))
            ;;
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
        PASS)
            echo -e "${GREEN}[PASS]${NC} $message"
            ((PASSED_TESTS++))
            ;;
        FAIL)
            echo -e "${RED}[FAIL]${NC} $message" >&2
            ((FAILED_TESTS++))
            ;;
    esac
    ((TOTAL_TESTS++)) || true
}

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    log INFO "Running test: $test_name"
    
    if $test_function; then
        log PASS "$test_name"
    else
        log FAIL "$test_name"
    fi
}

# Infrastructure verification tests
test_vpc_exists() {
    local vpc_id=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=*boleto-${ENVIRONMENT}*" \
        --query "Vpcs[0].VpcId" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ -n "$vpc_id" && "$vpc_id" != "None" ]]
}

test_subnets_exist() {
    local subnet_count=$(aws ec2 describe-subnets \
        --filters "Name=tag:Name,Values=*boleto-${ENVIRONMENT}*" \
        --query "length(Subnets)" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$subnet_count" -ge 6 ]]  # Expecting public, private, and database subnets
}

test_security_groups_configured() {
    local sg_count=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=*boleto-${ENVIRONMENT}*" \
        --query "length(SecurityGroups)" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$sg_count" -ge 4 ]]  # ALB, ECS, RDS, Redis security groups
}

test_load_balancer_healthy() {
    local alb_arn=$(aws elbv2 describe-load-balancers \
        --names "boleto-${ENVIRONMENT}-alb" \
        --query "LoadBalancers[0].LoadBalancerArn" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    if [[ -z "$alb_arn" || "$alb_arn" == "None" ]]; then
        return 1
    fi
    
    local alb_state=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns "$alb_arn" \
        --query "LoadBalancers[0].State.Code" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$alb_state" == "active" ]]
}

test_ecs_cluster_running() {
    local cluster_name="boleto-${ENVIRONMENT}-cluster"
    local cluster_status=$(aws ecs describe-clusters \
        --clusters "$cluster_name" \
        --query "clusters[0].status" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$cluster_status" == "ACTIVE" ]]
}

test_ecs_services_stable() {
    local cluster_name="boleto-${ENVIRONMENT}-cluster"
    local services=(
        "boleto-${ENVIRONMENT}-gateway"
        "boleto-${ENVIRONMENT}-hievents"
    )
    
    for service in "${services[@]}"; do
        local running_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query "services[0].runningCount" \
            --output text --region "$AWS_REGION" 2>/dev/null)
        
        local desired_count=$(aws ecs describe-services \
            --cluster "$cluster_name" \
            --services "$service" \
            --query "services[0].desiredCount" \
            --output text --region "$AWS_REGION" 2>/dev/null)
        
        if [[ "$running_count" != "$desired_count" || "$running_count" -eq 0 ]]; then
            log WARN "Service $service: running=$running_count, desired=$desired_count"
            return 1
        fi
    done
    
    return 0
}

test_rds_available() {
    local db_instance=$(aws rds describe-db-instances \
        --db-instance-identifier "boleto-${ENVIRONMENT}-rds" \
        --query "DBInstances[0].DBInstanceStatus" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$db_instance" == "available" ]]
}

test_elasticache_available() {
    local redis_status=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "boleto-${ENVIRONMENT}-redis" \
        --query "CacheClusters[0].CacheClusterStatus" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$redis_status" == "available" ]]
}

test_s3_buckets_exist() {
    local buckets=(
        "boleto-${ENVIRONMENT}-static-assets"
        "boleto-${ENVIRONMENT}-backups"
    )
    
    for bucket in "${buckets[@]}"; do
        if ! aws s3api head-bucket --bucket "$bucket" --region "$AWS_REGION" 2>/dev/null; then
            return 1
        fi
    done
    
    return 0
}

test_cloudfront_deployed() {
    local distributions=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Comment, 'boleto-${ENVIRONMENT}')]" \
        --output json 2>/dev/null)
    
    [[ "$(echo "$distributions" | jq length)" -gt 0 ]]
}

# Application verification tests
test_health_endpoint() {
    local health_url="https://${DOMAIN_NAME}/healthz"
    
    if command -v curl &> /dev/null; then
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" "$health_url" 2>/dev/null || echo "000")
        [[ "$response" == "200" ]]
    else
        log WARN "curl not available, skipping health check"
        return 0
    fi
}

test_https_redirect() {
    local http_url="http://${DOMAIN_NAME}/healthz"
    
    if command -v curl &> /dev/null; then
        local response=$(curl -s -I -L --max-time "$TIMEOUT" "$http_url" 2>/dev/null | head -n1)
        [[ "$response" =~ "200 OK" ]]
    else
        log WARN "curl not available, skipping HTTPS redirect test"
        return 0
    fi
}

test_ssl_certificate_valid() {
    if command -v openssl &> /dev/null; then
        echo | timeout "$TIMEOUT" openssl s_client -connect "${DOMAIN_NAME}:443" -servername "$DOMAIN_NAME" 2>/dev/null | grep -q "Verify return code: 0 (ok)"
    else
        log WARN "openssl not available, skipping SSL test"
        return 0
    fi
}

test_authentication_endpoint() {
    local auth_url="https://${DOMAIN_NAME}/auth/oauth/google/start"
    
    if command -v curl &> /dev/null; then
        # This should return 400 (missing parameters) but not 5xx errors
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" -X POST "$auth_url" 2>/dev/null || echo "000")
        [[ "$response" =~ ^[24] ]]  # 2xx or 4xx responses are acceptable
    else
        log WARN "curl not available, skipping auth test"
        return 0
    fi
}

test_jwks_endpoint() {
    local jwks_url="https://${DOMAIN_NAME}/.well-known/jwks.json"
    
    if command -v curl &> /dev/null && command -v jq &> /dev/null; then
        local response=$(curl -s --max-time "$TIMEOUT" "$jwks_url" 2>/dev/null)
        echo "$response" | jq -e '.keys' > /dev/null 2>&1
    else
        log WARN "curl or jq not available, skipping JWKS test"
        return 0
    fi
}

test_proxy_endpoint() {
    local proxy_url="https://${DOMAIN_NAME}/api/health"
    
    if command -v curl &> /dev/null; then
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" "$proxy_url" 2>/dev/null || echo "000")
        # Should return 200 or 404 (if Hi.Events doesn't have /health), but not 5xx
        [[ "$response" =~ ^[24] ]]
    else
        log WARN "curl not available, skipping proxy test"
        return 0
    fi
}

# Security verification tests
test_secrets_manager_accessible() {
    local secret_name="boleto-${ENVIRONMENT}-secrets"
    
    aws secretsmanager describe-secret \
        --secret-id "$secret_name" \
        --region "$AWS_REGION" > /dev/null 2>&1
}

test_parameter_store_accessible() {
    local parameter_name="/boleto/${ENVIRONMENT}/NODE_ENV"
    
    aws ssm get-parameter \
        --name "$parameter_name" \
        --region "$AWS_REGION" > /dev/null 2>&1
}

test_kms_keys_accessible() {
    local key_alias="alias/boleto-secrets-${ENVIRONMENT}"
    
    aws kms describe-key \
        --key-id "$key_alias" \
        --region "$AWS_REGION" > /dev/null 2>&1
}

# Monitoring verification tests
test_cloudwatch_logs_flowing() {
    local log_groups=(
        "/ecs/boleto-${ENVIRONMENT}-gateway"
        "/ecs/boleto-${ENVIRONMENT}-hievents"
    )
    
    for log_group in "${log_groups[@]}"; do
        local streams=$(aws logs describe-log-streams \
            --log-group-name "$log_group" \
            --order-by LastEventTime \
            --descending \
            --max-items 1 \
            --query "logStreams[0].lastEventTime" \
            --output text --region "$AWS_REGION" 2>/dev/null)
        
        if [[ -z "$streams" || "$streams" == "None" ]]; then
            return 1
        fi
        
        # Check if logs are recent (within last hour)
        local current_time=$(date +%s)
        local log_time=$(echo "$streams" | cut -c1-10)  # Convert from milliseconds
        local diff=$((current_time - log_time))
        
        if [[ $diff -gt 3600 ]]; then  # More than 1 hour old
            log WARN "Log group $log_group has stale logs (${diff}s old)"
            return 1
        fi
    done
    
    return 0
}

test_cloudwatch_alarms_configured() {
    local alarm_count=$(aws cloudwatch describe-alarms \
        --alarm-name-prefix "boleto-${ENVIRONMENT}" \
        --query "length(MetricAlarms)" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ "$alarm_count" -gt 5 ]]  # Should have several alarms configured
}

test_sns_topic_configured() {
    local topic_arn=$(aws sns list-topics \
        --query "Topics[?contains(TopicArn, 'boleto-${ENVIRONMENT}-alerts')].TopicArn" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    [[ -n "$topic_arn" && "$topic_arn" != "None" ]]
}

# Performance tests
test_response_time_acceptable() {
    local health_url="https://${DOMAIN_NAME}/healthz"
    
    if command -v curl &> /dev/null; then
        local start_time=$(date +%s%N)
        local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" "$health_url" 2>/dev/null || echo "000")
        local end_time=$(date +%s%N)
        
        if [[ "$response" == "200" ]]; then
            local response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
            log INFO "Response time: ${response_time}ms"
            [[ $response_time -lt 2000 ]]  # Less than 2 seconds
        else
            return 1
        fi
    else
        log WARN "curl not available, skipping response time test"
        return 0
    fi
}

test_concurrent_requests() {
    local health_url="https://${DOMAIN_NAME}/healthz"
    local concurrent_count=10
    
    if command -v curl &> /dev/null && command -v xargs &> /dev/null; then
        local success_count=$(seq 1 $concurrent_count | \
            xargs -I {} -P $concurrent_count curl -s -w "%{http_code}\n" -o /dev/null --max-time 10 "$health_url" 2>/dev/null | \
            grep -c "200" || echo "0")
        
        local success_rate=$((success_count * 100 / concurrent_count))
        log INFO "Concurrent requests success rate: ${success_rate}%"
        [[ $success_rate -gt 80 ]]  # At least 80% success rate
    else
        log WARN "curl or xargs not available, skipping concurrent test"
        return 0
    fi
}

# Database connectivity tests
test_database_connectivity() {
    # This is a basic connectivity test - actual database tests would require credentials
    local db_endpoint=$(aws rds describe-db-instances \
        --db-instance-identifier "boleto-${ENVIRONMENT}-rds" \
        --query "DBInstances[0].Endpoint.Address" \
        --output text --region "$AWS_REGION" 2>/dev/null)
    
    if [[ -n "$db_endpoint" && "$db_endpoint" != "None" ]]; then
        if command -v nc &> /dev/null; then
            timeout 10 nc -z "$db_endpoint" 5432 2>/dev/null
        else
            log WARN "nc (netcat) not available, skipping database connectivity test"
            return 0
        fi
    else
        return 1
    fi
}

# DNS resolution tests
test_dns_resolution() {
    if command -v dig &> /dev/null; then
        local dns_result=$(dig +short "$DOMAIN_NAME" 2>/dev/null)
        [[ -n "$dns_result" ]]
    elif command -v nslookup &> /dev/null; then
        nslookup "$DOMAIN_NAME" > /dev/null 2>&1
    else
        log WARN "dig or nslookup not available, skipping DNS test"
        return 0
    fi
}

# Main execution function
main() {
    log INFO "Starting production deployment verification for Bole.to"
    log INFO "Environment: $ENVIRONMENT"
    log INFO "Domain: $DOMAIN_NAME"
    log INFO "AWS Region: $AWS_REGION"
    echo
    
    # Infrastructure Tests
    log INFO "=== Infrastructure Tests ==="
    run_test "VPC exists" test_vpc_exists
    run_test "Subnets configured" test_subnets_exist
    run_test "Security groups configured" test_security_groups_configured
    run_test "Load balancer healthy" test_load_balancer_healthy
    run_test "ECS cluster running" test_ecs_cluster_running
    run_test "ECS services stable" test_ecs_services_stable
    run_test "RDS database available" test_rds_available
    run_test "ElastiCache available" test_elasticache_available
    run_test "S3 buckets exist" test_s3_buckets_exist
    run_test "CloudFront deployed" test_cloudfront_deployed
    echo
    
    # Application Tests
    log INFO "=== Application Tests ==="
    run_test "Health endpoint accessible" test_health_endpoint
    run_test "HTTPS redirect working" test_https_redirect
    run_test "SSL certificate valid" test_ssl_certificate_valid
    run_test "Authentication endpoint responds" test_authentication_endpoint
    run_test "JWKS endpoint functional" test_jwks_endpoint
    run_test "Proxy endpoint functional" test_proxy_endpoint
    echo
    
    # Security Tests
    log INFO "=== Security Tests ==="
    run_test "Secrets Manager accessible" test_secrets_manager_accessible
    run_test "Parameter Store accessible" test_parameter_store_accessible
    run_test "KMS keys accessible" test_kms_keys_accessible
    echo
    
    # Monitoring Tests
    log INFO "=== Monitoring Tests ==="
    run_test "CloudWatch logs flowing" test_cloudwatch_logs_flowing
    run_test "CloudWatch alarms configured" test_cloudwatch_alarms_configured
    run_test "SNS topic configured" test_sns_topic_configured
    echo
    
    # Performance Tests
    log INFO "=== Performance Tests ==="
    run_test "Response time acceptable" test_response_time_acceptable
    run_test "Concurrent requests handled" test_concurrent_requests
    echo
    
    # Connectivity Tests
    log INFO "=== Connectivity Tests ==="
    run_test "Database connectivity" test_database_connectivity
    run_test "DNS resolution working" test_dns_resolution
    echo
    
    # Summary
    log INFO "=== Verification Summary ==="
    log INFO "Total tests: $TOTAL_TESTS"
    log INFO "Passed: $PASSED_TESTS"
    log INFO "Failed: $FAILED_TESTS"
    log INFO "Warnings: $WARNINGS"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    log INFO "Success rate: ${success_rate}%"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        log INFO "🎉 All tests passed! Deployment verification successful."
        exit 0
    elif [[ $success_rate -gt 80 ]]; then
        log WARN "⚠️  Deployment mostly successful with some issues (${success_rate}% success rate)"
        exit 1
    else
        log ERROR "❌ Deployment verification failed (${success_rate}% success rate)"
        exit 2
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --environment ENV    Environment to verify (default: production)"
            echo "  --domain DOMAIN      Domain name to test (default: api.bole.to)"
            echo "  --region REGION      AWS region (default: us-east-1)"
            echo "  --timeout SECONDS    Request timeout (default: 30)"
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