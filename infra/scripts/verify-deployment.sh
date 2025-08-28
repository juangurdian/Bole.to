#!/bin/bash

# Bole.to Deployment Verification Script
# This script tests all endpoints and services to ensure they're working correctly

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${1:-https://staging-api.bole.to}"
TIMEOUT=30
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

test_start() {
    TOTAL=$((TOTAL + 1))
    log "Testing: $1"
}

# Test functions
test_gateway_health() {
    test_start "Gateway Health Check"
    
    local response
    response=$(curl -s --max-time $TIMEOUT "${GATEWAY_URL}/healthz" || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        error "Gateway health check failed - no response"
        return 1
    fi
    
    # Check if response contains expected fields
    if echo "$response" | jq -e '.status' >/dev/null 2>&1; then
        local status
        status=$(echo "$response" | jq -r '.status')
        if [[ "$status" == "healthy" ]]; then
            success "Gateway is healthy"
        else
            error "Gateway status is: $status"
        fi
    else
        error "Gateway health response invalid: $response"
    fi
}

test_deep_health() {
    test_start "Deep Health Check (Gateway + Backend)"
    
    local response
    response=$(curl -s --max-time $((TIMEOUT * 2)) "${GATEWAY_URL}/healthz?deep=true" || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        error "Deep health check failed - no response"
        return 1
    fi
    
    # Check gateway status
    local gateway_status
    gateway_status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    # Check backend status if available
    local backend_healthy
    backend_healthy=$(echo "$response" | jq -r '.backend.healthy' 2>/dev/null || echo "unknown")
    
    if [[ "$gateway_status" == "healthy" && "$backend_healthy" == "true" ]]; then
        success "Deep health check passed - Gateway and Backend are healthy"
    elif [[ "$gateway_status" == "healthy" && "$backend_healthy" == "unknown" ]]; then
        warning "Gateway healthy, but backend status unknown"
    else
        error "Deep health check failed - Gateway: $gateway_status, Backend: $backend_healthy"
    fi
}

test_public_endpoints() {
    test_start "Public API Endpoints"
    
    # Test color themes endpoint (should not require auth)
    local response
    response=$(curl -s --max-time $TIMEOUT "${GATEWAY_URL}/api/public/color-themes" || echo "FAILED")
    
    if [[ "$response" == "FAILED" ]]; then
        error "Public color-themes endpoint failed"
        return 1
    fi
    
    # Check if it's a valid JSON response with data
    if echo "$response" | jq -e '.data' >/dev/null 2>&1; then
        success "Public endpoints accessible"
    else
        error "Public endpoints returned invalid response: $response"
    fi
}

test_cors_headers() {
    test_start "CORS Configuration"
    
    # Test OPTIONS request with Expo origin
    local headers
    headers=$(curl -s -I --max-time $TIMEOUT \
        -H "Origin: exp://192.168.1.100:19000" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        "${GATEWAY_URL}/api/public/color-themes" || echo "FAILED")
    
    if [[ "$headers" == "FAILED" ]]; then
        error "CORS preflight request failed"
        return 1
    fi
    
    if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
        success "CORS headers present"
    else
        error "CORS headers missing"
    fi
}

test_ssl_certificate() {
    test_start "SSL/TLS Configuration"
    
    # Extract hostname from URL
    local hostname
    hostname=$(echo "$GATEWAY_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    
    # Test SSL certificate
    local ssl_info
    ssl_info=$(echo | timeout $TIMEOUT openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo "FAILED")
    
    if [[ "$ssl_info" == "FAILED" ]]; then
        error "SSL certificate check failed"
        return 1
    fi
    
    # Check if certificate is for the correct domain
    if echo "$ssl_info" | grep -q "$hostname"; then
        success "SSL certificate valid for domain"
    else
        warning "SSL certificate subject: $ssl_info"
    fi
}

test_authentication_flow() {
    test_start "Authentication Flow"
    
    # Test registration (this will create a test user)
    log "Testing user registration..."
    local register_response
    register_response=$(curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        -X POST \
        "${GATEWAY_URL}/api/auth/register" \
        -d "{
            \"first_name\": \"Test\",
            \"last_name\": \"User\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"password_confirmation\": \"$TEST_PASSWORD\",
            \"timezone\": \"America/New_York\"
        }" || echo "FAILED")
    
    if [[ "$register_response" == "FAILED" ]]; then
        error "Registration endpoint failed"
        return 1
    fi
    
    # Check if registration was successful
    local token
    token=$(echo "$register_response" | jq -r '.data.token' 2>/dev/null || echo "null")
    
    if [[ "$token" != "null" && -n "$token" ]]; then
        success "User registration successful"
        
        # Test authenticated endpoint
        log "Testing authenticated endpoint..."
        local user_response
        user_response=$(curl -s --max-time $TIMEOUT \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "${GATEWAY_URL}/api/users/me" || echo "FAILED")
        
        if [[ "$user_response" != "FAILED" ]] && echo "$user_response" | jq -e '.data.email' >/dev/null 2>&1; then
            success "Authenticated endpoint working"
        else
            error "Authenticated endpoint failed"
        fi
        
        # Test logout
        log "Testing logout..."
        curl -s --max-time $TIMEOUT \
            -H "Authorization: Bearer $token" \
            -X POST \
            "${GATEWAY_URL}/api/auth/logout" >/dev/null 2>&1 || true
        
    else
        # Check if it's a validation error (expected for duplicate email)
        local error_message
        error_message=$(echo "$register_response" | jq -r '.error.message' 2>/dev/null || echo "Unknown error")
        
        if [[ "$error_message" == *"email"* ]]; then
            warning "Registration failed (likely duplicate email): $error_message"
            
            # Try login instead
            log "Testing login with existing credentials..."
            local login_response
            login_response=$(curl -s --max-time $TIMEOUT \
                -H "Content-Type: application/json" \
                -X POST \
                "${GATEWAY_URL}/api/auth/login" \
                -d "{
                    \"email\": \"$TEST_EMAIL\",
                    \"password\": \"$TEST_PASSWORD\"
                }" || echo "FAILED")
            
            local login_token
            login_token=$(echo "$login_response" | jq -r '.data.token' 2>/dev/null || echo "null")
            
            if [[ "$login_token" != "null" && -n "$login_token" ]]; then
                success "User login successful"
            else
                error "Login failed: $(echo "$login_response" | jq -r '.error.message' 2>/dev/null || echo 'Unknown error')"
            fi
        else
            error "Registration failed: $error_message"
        fi
    fi
}

test_rate_limiting() {
    test_start "Rate Limiting"
    
    # Make multiple requests quickly to test rate limiting
    local count=0
    local rate_limited=false
    
    for i in {1..10}; do
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${GATEWAY_URL}/healthz" || echo "000")
        
        if [[ "$response_code" == "429" ]]; then
            rate_limited=true
            break
        elif [[ "$response_code" == "200" ]]; then
            count=$((count + 1))
        fi
        
        sleep 0.1
    done
    
    if [[ $count -gt 0 ]]; then
        if [[ "$rate_limited" == true ]]; then
            success "Rate limiting is working (got 429 after $count requests)"
        else
            warning "Rate limiting not triggered in 10 requests"
        fi
    else
        error "No successful requests made during rate limit test"
    fi
}

test_request_logging() {
    test_start "Request Logging and Headers"
    
    # Test that proper headers are returned
    local headers
    headers=$(curl -s -I --max-time $TIMEOUT "${GATEWAY_URL}/healthz" || echo "FAILED")
    
    if [[ "$headers" == "FAILED" ]]; then
        error "Request headers test failed"
        return 1
    fi
    
    # Check for security headers
    local has_security_headers=0
    
    if echo "$headers" | grep -qi "x-request-id"; then
        has_security_headers=$((has_security_headers + 1))
    fi
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        has_security_headers=$((has_security_headers + 1))
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        has_security_headers=$((has_security_headers + 1))
    fi
    
    if [[ $has_security_headers -ge 2 ]]; then
        success "Security headers present"
    else
        warning "Some security headers missing"
    fi
}

# Performance test
test_response_times() {
    test_start "Response Time Performance"
    
    local total_time=0
    local request_count=5
    
    for i in $(seq 1 $request_count); do
        local response_time
        response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time $TIMEOUT "${GATEWAY_URL}/healthz" || echo "0")
        
        if [[ "$response_time" != "0" ]]; then
            total_time=$(echo "$total_time + $response_time" | bc -l)
        fi
    done
    
    if [[ "$total_time" != "0" ]]; then
        local avg_time
        avg_time=$(echo "scale=3; $total_time / $request_count" | bc -l)
        
        if (( $(echo "$avg_time < 2.0" | bc -l) )); then
            success "Average response time: ${avg_time}s (good)"
        elif (( $(echo "$avg_time < 5.0" | bc -l) )); then
            warning "Average response time: ${avg_time}s (acceptable)"
        else
            error "Average response time: ${avg_time}s (slow)"
        fi
    else
        error "Could not measure response times"
    fi
}

# Main test execution
main() {
    log "🚀 Starting Bole.to Deployment Verification"
    log "Testing endpoint: $GATEWAY_URL"
    echo ""
    
    # Prerequisites check
    command -v curl >/dev/null 2>&1 || { error "curl is required but not installed"; exit 1; }
    command -v jq >/dev/null 2>&1 || { error "jq is required but not installed"; exit 1; }
    
    # Run all tests
    test_gateway_health
    test_deep_health
    test_ssl_certificate
    test_public_endpoints
    test_cors_headers
    test_authentication_flow
    test_rate_limiting
    test_request_logging
    test_response_times
    
    echo ""
    log "📊 Test Results Summary"
    echo "==================="
    echo "Total Tests: $TOTAL"
    echo "Passed: $PASSED"
    echo "Failed: $FAILED"
    
    if [[ $FAILED -eq 0 ]]; then
        success "🎉 All tests passed! Deployment is healthy."
        echo ""
        echo "✅ The staging environment is ready for mobile app integration"
        echo "📱 Mobile team can now update the app to use: $GATEWAY_URL"
        echo ""
        echo "Next steps:"
        echo "1. Update mobile app API configuration"
        echo "2. Test mobile app with staging API"
        echo "3. Run integration tests"
        echo "4. Monitor service logs for any issues"
        exit 0
    else
        error "💥 $FAILED test(s) failed. Please investigate before proceeding."
        echo ""
        echo "🔍 Troubleshooting tips:"
        echo "• Check service logs in DigitalOcean console"
        echo "• Verify all environment variables are configured"
        echo "• Ensure database is accessible"
        echo "• Check Cloudflare DNS and proxy settings"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    -h|--help)
        echo "Bole.to Deployment Verification Script"
        echo ""
        echo "Usage: $0 [GATEWAY_URL]"
        echo ""
        echo "Arguments:"
        echo "  GATEWAY_URL    The gateway URL to test (default: https://staging-api.bole.to)"
        echo ""
        echo "Examples:"
        echo "  $0                                    # Test staging"
        echo "  $0 https://api.bole.to               # Test production"
        echo "  $0 https://custom-staging.bole.to    # Test custom endpoint"
        echo ""
        exit 0
        ;;
    *)
        main
        ;;
esac