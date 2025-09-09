#!/bin/bash
# Verify Production Deployment
set -euo pipefail

ENVIRONMENT=${1:-production}
DOMAIN_NAME=${2:-api.bole.to}
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

# Test results
declare -a PASSED_TESTS=()
declare -a FAILED_TESTS=()

# Record test result
record_test() {
    local test_name=$1
    local result=$2
    
    if [[ "$result" == "PASS" ]]; then
        PASSED_TESTS+=("$test_name")
        log_info "✓ $test_name"
    else
        FAILED_TESTS+=("$test_name")
        log_error "✗ $test_name"
    fi
}

# HTTP health check
test_http_health() {
    log_info "Testing HTTP health endpoints..."
    
    # Test Gateway health
    if curl -sf "https://${DOMAIN_NAME}/healthz" >/dev/null 2>&1; then
        record_test "Gateway health endpoint" "PASS"
    else
        record_test "Gateway health endpoint" "FAIL"
    fi
    
    # Test Hi.Events health (via Gateway proxy)
    if curl -sf "https://${DOMAIN_NAME}/api/health" >/dev/null 2>&1; then
        record_test "Hi.Events health endpoint" "PASS"
    else
        record_test "Hi.Events health endpoint" "FAIL"
    fi
}

# Test SSL/TLS configuration
test_ssl_config() {
    log_info "Testing SSL/TLS configuration..."
    
    # Test SSL certificate
    local ssl_result=$(echo | timeout 5 openssl s_client -servername "${DOMAIN_NAME}" -connect "${DOMAIN_NAME}:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo "FAILED")
    
    if [[ "$ssl_result" != "FAILED" ]] && [[ "$ssl_result" =~ CN.*${DOMAIN_NAME} ]]; then
        record_test "SSL certificate validation" "PASS"
    else
        record_test "SSL certificate validation" "FAIL"
    fi
    
    # Test HTTPS redirect
    local redirect_result=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN_NAME}/healthz" || echo "000")
    
    if [[ "$redirect_result" =~ ^30[12]$ ]]; then
        record_test "HTTPS redirect" "PASS"
    else
        record_test "HTTPS redirect" "FAIL"
    fi
    
    # Test HSTS header
    local hsts_header=$(curl -s -I "https://${DOMAIN_NAME}/healthz" | grep -i "strict-transport-security" || echo "")
    
    if [[ -n "$hsts_header" ]]; then
        record_test "HSTS header present" "PASS"
    else
        record_test "HSTS header present" "FAIL"
    fi
}

# Test security headers
test_security_headers() {
    log_info "Testing security headers..."
    
    local headers=$(curl -s -I "https://${DOMAIN_NAME}/healthz")
    
    # Test X-Content-Type-Options
    if echo "$headers" | grep -qi "x-content-type-options.*nosniff"; then
        record_test "X-Content-Type-Options header" "PASS"
    else
        record_test "X-Content-Type-Options header" "FAIL"
    fi
    
    # Test X-Frame-Options
    if echo "$headers" | grep -qi "x-frame-options.*deny"; then
        record_test "X-Frame-Options header" "PASS"
    else
        record_test "X-Frame-Options header" "FAIL"
    fi
    
    # Test Content-Security-Policy
    if echo "$headers" | grep -qi "content-security-policy"; then
        record_test "Content-Security-Policy header" "PASS"
    else
        record_test "Content-Security-Policy header" "FAIL"
    fi
}

# Test JWKS endpoint
test_jwks_endpoint() {
    log_info "Testing JWKS endpoint..."
    
    local jwks_response=$(curl -s "https://${DOMAIN_NAME}/.well-known/jwks.json" 2>/dev/null)
    
    if echo "$jwks_response" | jq -e '.keys[]' >/dev/null 2>&1; then
        record_test "JWKS endpoint" "PASS"
    else
        record_test "JWKS endpoint" "FAIL"
    fi
}

# Test rate limiting
test_rate_limiting() {
    log_info "Testing rate limiting..."
    
    local rate_limit_hit=false
    
    # Make multiple requests quickly
    for i in {1..15}; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}/healthz" || echo "000")
        
        if [[ "$status_code" == "429" ]]; then
            rate_limit_hit=true
            break
        fi
        
        sleep 0.1
    done
    
    if [[ "$rate_limit_hit" == "true" ]]; then
        record_test "Rate limiting active" "PASS"
    else
        record_test "Rate limiting active" "WARN"
        log_warn "Rate limiting may not be configured or threshold is too high"
    fi
}

# Test database connectivity (indirect)
test_database_connectivity() {
    log_info "Testing database connectivity (indirect)..."
    
    # Test an endpoint that requires database access
    local db_test_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}/api/health" || echo "000")
    
    if [[ "$db_test_response" == "200" ]]; then
        record_test "Database connectivity" "PASS"
    else
        record_test "Database connectivity" "FAIL"
    fi
}

# Test load balancer health
test_load_balancer() {
    log_info "Testing load balancer health..."
    
    # Test multiple requests to ensure load balancing
    local unique_responses=0
    declare -A response_hashes
    
    for i in {1..5}; do
        local response=$(curl -s "https://${DOMAIN_NAME}/healthz" 2>/dev/null | jq -r '.requestId // ""' 2>/dev/null || echo "")
        
        if [[ -n "$response" ]] && [[ -z "${response_hashes[$response]:-}" ]]; then
            response_hashes[$response]=1
            ((unique_responses++))
        fi
        
        sleep 0.5
    done
    
    if [[ $unique_responses -ge 2 ]]; then
        record_test "Load balancer distribution" "PASS"
    else
        record_test "Load balancer distribution" "WARN"
        log_warn "Load balancer may not be distributing requests across multiple instances"
    fi
}

# Test CloudFront cache
test_cloudfront_cache() {
    log_info "Testing CloudFront caching..."
    
    # Test CloudFront headers
    local cf_headers=$(curl -s -I "https://${DOMAIN_NAME}/healthz")
    
    if echo "$cf_headers" | grep -qi "x-cache.*cloudfront"; then
        record_test "CloudFront headers present" "PASS"
    else
        record_test "CloudFront headers present" "FAIL"
    fi
    
    # Test static asset caching
    local static_cache=$(curl -s -I "https://${DOMAIN_NAME}/assets/favicon.ico" 2>/dev/null | grep -i "cache-control" || echo "")
    
    if [[ -n "$static_cache" ]]; then
        record_test "Static asset caching" "PASS"
    else
        record_test "Static asset caching" "WARN"
        log_warn "Static asset caching may not be configured"
    fi
}

# Test authentication endpoints
test_auth_endpoints() {
    log_info "Testing authentication endpoints..."
    
    # Test OAuth endpoints are accessible
    local google_auth=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}/auth/google" || echo "000")
    
    if [[ "$google_auth" =~ ^[23][0-9][0-9]$ ]]; then
        record_test "Google OAuth endpoint" "PASS"
    else
        record_test "Google OAuth endpoint" "FAIL"
    fi
    
    local apple_auth=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}/auth/apple" || echo "000")
    
    if [[ "$apple_auth" =~ ^[23][0-9][0-9]$ ]]; then
        record_test "Apple OAuth endpoint" "PASS"
    else
        record_test "Apple OAuth endpoint" "FAIL"
    fi
}

# Performance test
test_performance() {
    log_info "Testing response times..."
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" "https://${DOMAIN_NAME}/healthz" || echo "99.999")
    local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "99999")
    local response_time_int=${response_time_ms%.*}
    
    if [[ $response_time_int -lt 2000 ]]; then
        record_test "Response time < 2s ($response_time_int ms)" "PASS"
    else
        record_test "Response time < 2s ($response_time_int ms)" "FAIL"
    fi
}

# DNS resolution test
test_dns_resolution() {
    log_info "Testing DNS resolution..."
    
    local dns_result=$(dig +short "${DOMAIN_NAME}" | head -1)
    
    if [[ -n "$dns_result" ]] && [[ "$dns_result" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        record_test "DNS resolution" "PASS"
    else
        record_test "DNS resolution" "FAIL"
    fi
}

# Monitor AWS services health
test_aws_services() {
    log_info "Testing AWS services health..."
    
    if command -v aws >/dev/null 2>&1; then
        # Test ECS services
        local ecs_services=$(aws ecs describe-services \
            --cluster "boleto-${ENVIRONMENT}-cluster" \
            --services "boleto-${ENVIRONMENT}-gateway" "boleto-${ENVIRONMENT}-hievents" \
            --query 'services[?status==`ACTIVE`]' \
            --output json 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
        
        if [[ "$ecs_services" == "2" ]]; then
            record_test "ECS services health" "PASS"
        else
            record_test "ECS services health" "FAIL"
        fi
        
        # Test RDS instance
        local rds_status=$(aws rds describe-db-instances \
            --db-instance-identifier "boleto-${ENVIRONMENT}-postgres" \
            --query 'DBInstances[0].DBInstanceStatus' \
            --output text 2>/dev/null || echo "unknown")
        
        if [[ "$rds_status" == "available" ]]; then
            record_test "RDS database health" "PASS"
        else
            record_test "RDS database health" "FAIL"
        fi
    else
        log_warn "AWS CLI not available, skipping AWS services health check"
    fi
}

# Generate test report
generate_report() {
    echo ""
    log_info "=== DEPLOYMENT VERIFICATION REPORT ==="
    echo ""
    
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Domain: ${DOMAIN_NAME}"
    log_info "Test Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    echo ""
    log_info "Passed Tests (${#PASSED_TESTS[@]}):"
    for test in "${PASSED_TESTS[@]}"; do
        echo -e "${GREEN}  ✓${NC} $test"
    done
    
    if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
        echo ""
        log_error "Failed Tests (${#FAILED_TESTS[@]}):"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "${RED}  ✗${NC} $test"
        done
    fi
    
    echo ""
    local total_tests=$((${#PASSED_TESTS[@]} + ${#FAILED_TESTS[@]}))
    local success_rate=$(echo "scale=1; ${#PASSED_TESTS[@]} * 100 / $total_tests" | bc 2>/dev/null || echo "0")
    
    log_info "Success Rate: ${success_rate}% (${#PASSED_TESTS[@]}/$total_tests)"
    
    if [[ ${#FAILED_TESTS[@]} -eq 0 ]]; then
        log_info "🎉 All tests passed! Deployment verification successful."
        return 0
    else
        log_error "❌ Some tests failed. Please review and fix the issues."
        return 1
    fi
}

# Main verification function
main() {
    log_info "Starting deployment verification for ${ENVIRONMENT} environment"
    log_info "Testing domain: ${DOMAIN_NAME}"
    
    # Check prerequisites
    local missing_deps=()
    
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    command -v openssl >/dev/null 2>&1 || missing_deps+=("openssl")
    command -v dig >/dev/null 2>&1 || missing_deps+=("dig")
    command -v bc >/dev/null 2>&1 || missing_deps+=("bc")
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_error "Please install the missing tools and try again."
        exit 1
    fi
    
    # Run all tests
    test_dns_resolution
    test_http_health
    test_ssl_config
    test_security_headers
    test_jwks_endpoint
    test_rate_limiting
    test_database_connectivity
    test_load_balancer
    test_cloudfront_cache
    test_auth_endpoints
    test_performance
    test_aws_services
    
    # Generate final report
    generate_report
}

# Run main function
main "$@"