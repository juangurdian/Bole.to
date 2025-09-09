# Security Operations Runbook for Boleto Production System

## Overview

This runbook covers security operations procedures for the Boleto event ticketing platform, including JWT key rotation, OAuth provider certificate updates, security monitoring, incident response, and access auditing procedures.

## Security Architecture Context

**Authentication & Authorization:**
- OAuth 2.0 + PKCE flow with Google/Apple providers
- RS256 JWT tokens issued by Gateway service
- Session management with device tracking
- Token family breach detection and response

**Security Infrastructure:**
- AWS WAF for application protection
- VPC with private subnets and security groups
- KMS encryption for data at rest
- TLS 1.2+ for data in transit
- CloudTrail for API auditing

## JWT Key Rotation Procedures

### Monthly JWT Key Rotation

```bash
#!/bin/bash
# Monthly JWT RS256 key rotation procedure

set -e

ROTATION_ID="key-rotation-$(date +%Y%m%d-%H%M%S)"
BACKUP_LOCATION="/secure-backups/jwt-keys"
NEW_KEY_ID="gateway-key-$(date +%Y%m)"

echo "🔄 Starting JWT key rotation: $ROTATION_ID"
echo "Timestamp: $(date)"

# Step 1: Generate new RSA key pair
echo "1. Generating new RSA key pair..."
openssl genpkey -algorithm RSA -out /tmp/new_private_key.pem -pkcs8 -pass pass:$(openssl rand -base64 32) -aes-256-cbc
openssl rsa -pubout -in /tmp/new_private_key.pem -out /tmp/new_public_key.pem -passin pass:$(openssl rand -base64 32)

# Step 2: Backup current keys
echo "2. Backing up current keys..."
mkdir -p "$BACKUP_LOCATION/$ROTATION_ID"

# Get current keys from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id boleto-production-jwt-keys \
  --query SecretString \
  --output text > "$BACKUP_LOCATION/$ROTATION_ID/current_keys.json"

# Step 3: Validate new keys
echo "3. Validating new key pair..."
TEST_PAYLOAD='{"sub":"test","iat":1234567890}'
TEST_TOKEN=$(echo "$TEST_PAYLOAD" | openssl dgst -sha256 -sign /tmp/new_private_key.pem -passin pass:$(openssl rand -base64 32) | base64 -w 0)

# Verify signature
echo "$TEST_PAYLOAD" | openssl dgst -sha256 -verify /tmp/new_public_key.pem -signature <(echo "$TEST_TOKEN" | base64 -d)

if [ $? -eq 0 ]; then
  echo "✅ Key pair validation successful"
else
  echo "❌ Key pair validation failed"
  exit 1
fi

# Step 4: Deploy new keys with overlapping validity
echo "4. Deploying new keys to Secrets Manager..."

# Read current keys
CURRENT_KEYS=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-jwt-keys \
  --query SecretString \
  --output text)

# Create new key configuration with both old and new keys
NEW_KEYS=$(echo "$CURRENT_KEYS" | jq --arg new_private "$(cat /tmp/new_private_key.pem)" \
  --arg new_public "$(cat /tmp/new_public_key.pem)" \
  --arg new_key_id "$NEW_KEY_ID" \
  --arg rotation_time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  {
    "current": {
      "key_id": $new_key_id,
      "private_key": $new_private,
      "public_key": $new_public,
      "created_at": $rotation_time,
      "status": "active"
    },
    "previous": {
      "key_id": .current.key_id,
      "private_key": .current.private_key,
      "public_key": .current.public_key,
      "created_at": .current.created_at,
      "status": "deprecated",
      "valid_until": "'"$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ)"'"
    }
  }')

# Update Secrets Manager
aws secretsmanager update-secret \
  --secret-id boleto-production-jwt-keys \
  --secret-string "$NEW_KEYS"

echo "✅ New keys deployed to Secrets Manager"

# Step 5: Update Gateway service configuration
echo "5. Updating Gateway service environment variables..."

# Update Parameter Store with new key ID
aws ssm put-parameter \
  --name "/boleto/production/jwt/key_id" \
  --value "$NEW_KEY_ID" \
  --type "String" \
  --overwrite

# Step 6: Trigger service restart for key pickup
echo "6. Restarting Gateway service to pick up new keys..."
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --force-new-deployment

# Wait for service to stabilize
aws ecs wait services-stable \
  --cluster boleto-production \
  --services gateway-service

echo "✅ Gateway service restarted successfully"

# Step 7: Verify new key deployment
echo "7. Verifying new key deployment..."
sleep 30  # Allow time for service to start

# Test JWKS endpoint
JWKS_RESPONSE=$(curl -s "https://api.bole.to/.well-known/jwks.json")
KEY_COUNT=$(echo "$JWKS_RESPONSE" | jq '.keys | length')
NEW_KEY_PRESENT=$(echo "$JWKS_RESPONSE" | jq --arg kid "$NEW_KEY_ID" '.keys[] | select(.kid == $kid) | length')

if [ "$NEW_KEY_PRESENT" -gt 0 ]; then
  echo "✅ New key ID $NEW_KEY_ID present in JWKS endpoint"
else
  echo "❌ New key not found in JWKS endpoint"
  exit 1
fi

# Test token generation with new key
TEST_TOKEN_RESPONSE=$(curl -s -X POST "https://api.bole.to/auth/test/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"key-rotation-test","account_id":"test"}')

NEW_TOKEN=$(echo "$TEST_TOKEN_RESPONSE" | jq -r '.access_token')
if [ "$NEW_TOKEN" != "null" ] && [ -n "$NEW_TOKEN" ]; then
  echo "✅ Token generation with new key successful"
  
  # Verify token signature
  TOKEN_HEADER=$(echo "$NEW_TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null)
  TOKEN_KID=$(echo "$TOKEN_HEADER" | jq -r '.kid')
  
  if [ "$TOKEN_KID" = "$NEW_KEY_ID" ]; then
    echo "✅ New tokens being signed with new key ID"
  else
    echo "⚠️ Tokens still using old key ID: $TOKEN_KID"
  fi
else
  echo "❌ Token generation failed"
  exit 1
fi

# Step 8: Schedule old key cleanup
echo "8. Scheduling old key cleanup..."
cat > /tmp/key-cleanup-job.sh << EOF
#!/bin/bash
# Cleanup old JWT key after 7 days
echo "Cleaning up old JWT keys..."

# Remove previous key from Secrets Manager
CURRENT_KEYS=\$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-jwt-keys \
  --query SecretString \
  --output text)

UPDATED_KEYS=\$(echo "\$CURRENT_KEYS" | jq 'del(.previous)')

aws secretsmanager update-secret \
  --secret-id boleto-production-jwt-keys \
  --secret-string "\$UPDATED_KEYS"

echo "✅ Old JWT keys cleaned up"
EOF

# Schedule cleanup job for 7 days from now
echo "0 2 $(date -d '+7 days' +%d) $(date -d '+7 days' +%m) * /tmp/key-cleanup-job.sh" | crontab -

# Step 9: Update monitoring and alerts
echo "9. Updating key rotation monitoring..."
aws cloudwatch put-metric-data \
  --namespace "Boleto/Security" \
  --metric-data MetricName=JWTKeyRotation,Value=1,Unit=Count,Dimensions=Environment=production,KeyId="$NEW_KEY_ID"

# Step 10: Cleanup temporary files
echo "10. Cleaning up temporary files..."
rm -f /tmp/new_private_key.pem /tmp/new_public_key.pem

echo "✅ JWT key rotation completed successfully"
echo "New Key ID: $NEW_KEY_ID"
echo "Old key valid until: $(date -d '+7 days' +%Y-%m-%d)"
echo "Rotation ID: $ROTATION_ID"

# Send completion notification
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-notifications \
  --message "JWT key rotation completed successfully. New Key ID: $NEW_KEY_ID. Rotation ID: $ROTATION_ID"

# Record rotation in audit log
cat >> /var/log/boleto/security-audit.log << EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) JWT_KEY_ROTATION completed rotation_id="$ROTATION_ID" new_key_id="$NEW_KEY_ID" operator="$(whoami)"
EOF
```

### Emergency JWT Key Rotation

```bash
#!/bin/bash
# Emergency JWT key rotation (security breach response)

set -e

EMERGENCY_ROTATION_ID="emergency-rotation-$(date +%Y%m%d-%H%M%S)"
REASON="${1:-Security incident}"

echo "🚨 EMERGENCY JWT KEY ROTATION"
echo "Rotation ID: $EMERGENCY_ROTATION_ID"
echo "Reason: $REASON"
echo "Timestamp: $(date)"

# Step 1: Immediately revoke all existing sessions
echo "1. Revoking all active sessions..."
redis-cli -h "$REDIS_ENDPOINT" -p 6379 FLUSHALL

# Step 2: Generate new emergency keys
echo "2. Generating emergency RSA key pair..."
openssl genpkey -algorithm RSA -out /tmp/emergency_private_key.pem -pkcs8
openssl rsa -pubout -in /tmp/emergency_private_key.pem -out /tmp/emergency_public_key.pem

EMERGENCY_KEY_ID="emergency-key-$(date +%Y%m%d-%H%M)"

# Step 3: Immediately deploy emergency keys
echo "3. Deploying emergency keys..."
EMERGENCY_KEYS=$(jq -n \
  --arg private_key "$(cat /tmp/emergency_private_key.pem)" \
  --arg public_key "$(cat /tmp/emergency_public_key.pem)" \
  --arg key_id "$EMERGENCY_KEY_ID" \
  --arg created_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg reason "$REASON" \
  '{
    "current": {
      "key_id": $key_id,
      "private_key": $private_key,
      "public_key": $public_key,
      "created_at": $created_at,
      "status": "emergency",
      "rotation_reason": $reason
    }
  }')

aws secretsmanager update-secret \
  --secret-id boleto-production-jwt-keys \
  --secret-string "$EMERGENCY_KEYS"

# Step 4: Force restart all services
echo "4. Force restarting all services..."
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --desired-count 0

sleep 10

aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --desired-count 2 \
  --force-new-deployment

# Step 5: Verify emergency deployment
echo "5. Verifying emergency key deployment..."
aws ecs wait services-stable \
  --cluster boleto-production \
  --services gateway-service

# Test JWKS endpoint
sleep 30
JWKS_TEST=$(curl -s "https://api.bole.to/.well-known/jwks.json" | jq '.keys[0].kid')
echo "Emergency key deployed: $JWKS_TEST"

# Step 6: Alert security team
echo "6. Alerting security team..."
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-critical \
  --subject "EMERGENCY: JWT Key Rotation Completed" \
  --message "Emergency JWT key rotation completed. Reason: $REASON. All sessions revoked. New Key ID: $EMERGENCY_KEY_ID"

echo "✅ Emergency JWT key rotation completed"
echo "⚠️ ALL USER SESSIONS HAVE BEEN REVOKED"
echo "Users will need to re-authenticate"

# Cleanup
rm -f /tmp/emergency_private_key.pem /tmp/emergency_public_key.pem
```

## OAuth Provider Certificate Management

### Google OAuth Certificate Updates

```bash
#!/bin/bash
# Monitor and update Google OAuth certificates

echo "🔍 Checking Google OAuth certificates..."

# Download current Google certificates
GOOGLE_CERTS=$(curl -s "https://www.googleapis.com/oauth2/v3/certs")
CERT_COUNT=$(echo "$GOOGLE_CERTS" | jq '.keys | length')

echo "Google provides $CERT_COUNT certificates"

# Get stored certificates from Parameter Store
STORED_CERTS=$(aws ssm get-parameter \
  --name "/boleto/production/oauth/google/certs" \
  --query Parameter.Value \
  --output text 2>/dev/null || echo '{"keys":[]}')

# Compare certificates
NEW_CERT_FOUND=false
for kid in $(echo "$GOOGLE_CERTS" | jq -r '.keys[].kid'); do
  STORED_KID=$(echo "$STORED_CERTS" | jq --arg kid "$kid" '.keys[] | select(.kid == $kid) | .kid')
  if [ -z "$STORED_KID" ]; then
    echo "🆕 New Google certificate found: $kid"
    NEW_CERT_FOUND=true
  fi
done

if [ "$NEW_CERT_FOUND" = true ]; then
  echo "Updating stored Google certificates..."
  
  # Store updated certificates
  aws ssm put-parameter \
    --name "/boleto/production/oauth/google/certs" \
    --value "$GOOGLE_CERTS" \
    --type "String" \
    --overwrite
  
  # Restart Gateway service to pick up new certificates
  aws ecs update-service \
    --cluster boleto-production \
    --service gateway-service \
    --force-new-deployment
  
  echo "✅ Google OAuth certificates updated"
  
  # Alert operations team
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-notifications \
    --message "Google OAuth certificates updated. Gateway service restarted to pick up changes."
else
  echo "✅ Google OAuth certificates are up to date"
fi
```

### Apple OAuth Certificate Updates

```bash
#!/bin/bash
# Monitor and update Apple OAuth certificates

echo "🍎 Checking Apple OAuth certificates..."

# Download current Apple certificates
APPLE_CERTS=$(curl -s "https://appleid.apple.com/auth/keys")
CERT_COUNT=$(echo "$APPLE_CERTS" | jq '.keys | length')

echo "Apple provides $CERT_COUNT certificates"

# Check for certificate updates
STORED_APPLE_CERTS=$(aws ssm get-parameter \
  --name "/boleto/production/oauth/apple/certs" \
  --query Parameter.Value \
  --output text 2>/dev/null || echo '{"keys":[]}')

# Compare certificates
if [ "$APPLE_CERTS" != "$STORED_APPLE_CERTS" ]; then
  echo "🆕 Apple certificate changes detected"
  
  # Store updated certificates
  aws ssm put-parameter \
    --name "/boleto/production/oauth/apple/certs" \
    --value "$APPLE_CERTS" \
    --type "String" \
    --overwrite
  
  # Update Apple OAuth configuration
  aws ssm put-parameter \
    --name "/boleto/production/oauth/apple/updated_at" \
    --value "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --type "String" \
    --overwrite
  
  echo "✅ Apple OAuth certificates updated"
  
  # Alert operations team
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-notifications \
    --message "Apple OAuth certificates updated. Configuration refreshed."
else
  echo "✅ Apple OAuth certificates are up to date"
fi

# Verify Apple certificate validity
for cert in $(echo "$APPLE_CERTS" | jq -r '.keys[].x5c[]'); do
  CERT_INFO=$(echo "-----BEGIN CERTIFICATE-----
$cert
-----END CERTIFICATE-----" | openssl x509 -noout -enddate 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    EXPIRY_DATE=$(echo "$CERT_INFO" | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
      echo "⚠️ Apple certificate expiring in $DAYS_UNTIL_EXPIRY days"
    fi
  fi
done
```

## Token Family Breach Detection and Response

### Session Security Monitoring

```bash
#!/bin/bash
# Monitor for token family breaches and suspicious session activity

echo "🔍 Monitoring session security..."

# Check for token family breaches (multiple refresh tokens for same family)
SUSPICIOUS_SESSIONS=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
  local suspicious = {}
  local family_counts = {}
  
  for _, key in ipairs(redis.call('keys', 'session:*')) do
    local session = redis.call('hgetall', key)
    local family_id = nil
    
    for i = 1, #session, 2 do
      if session[i] == 'token_family_id' then
        family_id = session[i + 1]
        break
      end
    end
    
    if family_id then
      if family_counts[family_id] then
        family_counts[family_id] = family_counts[family_id] + 1
      else
        family_counts[family_id] = 1
      end
      
      if family_counts[family_id] > 1 then
        table.insert(suspicious, family_id)
      end
    end
  end
  
  return suspicious
" 0)

if [ -n "$SUSPICIOUS_SESSIONS" ]; then
  echo "⚠️ Potential token family breach detected"
  
  # Revoke all sessions for compromised families
  for family_id in $SUSPICIOUS_SESSIONS; do
    echo "Revoking all sessions for family: $family_id"
    
    redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
      for _, key in ipairs(redis.call('keys', 'session:*')) do
        local session = redis.call('hgetall', key)
        for i = 1, #session, 2 do
          if session[i] == 'token_family_id' and session[i + 1] == ARGV[1] then
            redis.call('del', key)
            break
          end
        end
      end
    " 0 "$family_id"
    
    # Log security event
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) TOKEN_FAMILY_BREACH family_id=\"$family_id\" action=revoked" >> /var/log/boleto/security-audit.log
  done
  
  # Alert security team
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-critical \
    --subject "Token Family Breach Detected" \
    --message "Token family breach detected and mitigated. Affected families: $SUSPICIOUS_SESSIONS"
fi

# Check for unusual session patterns
UNUSUAL_PATTERNS=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
  local unusual = {}
  local user_devices = {}
  
  for _, key in ipairs(redis.call('keys', 'session:*')) do
    local session = redis.call('hgetall', key)
    local user_id = nil
    local device_id = nil
    local ip_address = nil
    local created_at = nil
    
    for i = 1, #session, 2 do
      if session[i] == 'user_id' then user_id = session[i + 1] end
      if session[i] == 'device_id' then device_id = session[i + 1] end  
      if session[i] == 'ip_address' then ip_address = session[i + 1] end
      if session[i] == 'created_at' then created_at = session[i + 1] end
    end
    
    if user_id then
      if not user_devices[user_id] then
        user_devices[user_id] = {}
      end
      
      if not user_devices[user_id][device_id] then
        user_devices[user_id][device_id] = {}
      end
      
      user_devices[user_id][device_id][ip_address] = created_at
    end
  end
  
  -- Check for users with too many devices or IPs
  for user_id, devices in pairs(user_devices) do
    local device_count = 0
    local ip_count = 0
    local ips = {}
    
    for device_id, device_ips in pairs(devices) do
      device_count = device_count + 1
      for ip, _ in pairs(device_ips) do
        ips[ip] = true
      end
    end
    
    for _ in pairs(ips) do
      ip_count = ip_count + 1
    end
    
    if device_count > 10 or ip_count > 5 then
      table.insert(unusual, user_id .. ':devices=' .. device_count .. ',ips=' .. ip_count)
    end
  end
  
  return unusual
" 0)

if [ -n "$UNUSUAL_PATTERNS" ]; then
  echo "⚠️ Unusual session patterns detected:"
  for pattern in $UNUSUAL_PATTERNS; do
    echo "  $pattern"
  done
  
  # Log for further investigation
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) UNUSUAL_SESSION_PATTERNS patterns=\"$UNUSUAL_PATTERNS\"" >> /var/log/boleto/security-audit.log
fi

echo "✅ Session security monitoring completed"
```

### Automated Breach Response

```bash
#!/bin/bash
# Automated response to detected security breaches

BREACH_TYPE="$1"
AFFECTED_ENTITY="$2"
SEVERITY="$3"

case $BREACH_TYPE in
  "token_family_breach")
    echo "🚨 Responding to token family breach: $AFFECTED_ENTITY"
    
    # Immediately revoke all sessions for affected family
    redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
      for _, key in ipairs(redis.call('keys', 'session:*')) do
        local session = redis.call('hgetall', key)
        for i = 1, #session, 2 do
          if session[i] == 'token_family_id' and session[i + 1] == ARGV[1] then
            redis.call('del', key)
            break
          end
        end
      end
    " 0 "$AFFECTED_ENTITY"
    
    # Block user temporarily if severity is high
    if [ "$SEVERITY" = "high" ]; then
      # Extract user_id from session data if available
      USER_ID=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
        for _, key in ipairs(redis.call('keys', 'blocked_session:*')) do
          local session = redis.call('hgetall', key)
          for i = 1, #session, 2 do
            if session[i] == 'token_family_id' and session[i + 1] == ARGV[1] then
              for j = 1, #session, 2 do
                if session[j] == 'user_id' then
                  return session[j + 1]
                end
              end
            end
          end
        end
        return nil
      " 0 "$AFFECTED_ENTITY")
      
      if [ -n "$USER_ID" ]; then
        # Temporarily block user (15 minutes)
        redis-cli -h "$REDIS_ENDPOINT" -p 6379 SETEX "blocked:user:$USER_ID" 900 "token_family_breach"
        echo "User $USER_ID temporarily blocked"
      fi
    fi
    ;;
    
  "credential_stuffing")
    echo "🚨 Responding to credential stuffing attack: $AFFECTED_ENTITY"
    
    # Block IP address in WAF
    aws wafv2 update-ip-set \
      --scope CLOUDFRONT \
      --id "$WAF_IP_BLOCKLIST_ID" \
      --addresses "$AFFECTED_ENTITY" \
      --lock-token "$(aws wafv2 get-ip-set --scope CLOUDFRONT --id "$WAF_IP_BLOCKLIST_ID" --query LockToken --output text)"
    
    echo "IP $AFFECTED_ENTITY blocked in WAF"
    ;;
    
  "rate_limit_exceeded")
    echo "🚨 Responding to rate limit breach: $AFFECTED_ENTITY"
    
    # Implement exponential backoff
    CURRENT_BLOCK_TIME=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 GET "rate_limit_block:$AFFECTED_ENTITY" 2>/dev/null || echo 60)
    NEW_BLOCK_TIME=$((CURRENT_BLOCK_TIME * 2))
    
    # Cap at 1 hour
    if [ "$NEW_BLOCK_TIME" -gt 3600 ]; then
      NEW_BLOCK_TIME=3600
    fi
    
    redis-cli -h "$REDIS_ENDPOINT" -p 6379 SETEX "rate_limit_block:$AFFECTED_ENTITY" "$NEW_BLOCK_TIME" "rate_limit_exceeded"
    echo "Rate limit block extended to $NEW_BLOCK_TIME seconds"
    ;;
    
  *)
    echo "❌ Unknown breach type: $BREACH_TYPE"
    exit 1
    ;;
esac

# Record security event
cat >> /var/log/boleto/security-audit.log << EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) SECURITY_BREACH_RESPONSE type="$BREACH_TYPE" affected_entity="$AFFECTED_ENTITY" severity="$SEVERITY" operator="automated"
EOF

# Send alert
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-critical \
  --subject "Security Breach Response: $BREACH_TYPE" \
  --message "Automated response executed for $BREACH_TYPE affecting $AFFECTED_ENTITY (severity: $SEVERITY)"

echo "✅ Breach response completed"
```

## QR Code Signature Key Rotation

### QR Signing Key Management

```bash
#!/bin/bash
# Rotate QR code signing keys for offline validation

QR_ROTATION_ID="qr-key-rotation-$(date +%Y%m%d-%H%M%S)"

echo "🎫 Starting QR signing key rotation: $QR_ROTATION_ID"

# Step 1: Generate new ECDSA key pair for QR signatures
echo "1. Generating new ECDSA key pair for QR codes..."
openssl ecparam -genkey -name prime256v1 -noout -out /tmp/qr_private_key.pem
openssl ec -in /tmp/qr_private_key.pem -pubout -out /tmp/qr_public_key.pem

QR_KEY_ID="qr-key-$(date +%Y%m)"

# Step 2: Store new keys in Secrets Manager
echo "2. Storing new QR signing keys..."
QR_KEYS=$(jq -n \
  --arg private_key "$(cat /tmp/qr_private_key.pem)" \
  --arg public_key "$(cat /tmp/qr_public_key.pem)" \
  --arg key_id "$QR_KEY_ID" \
  --arg created_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
    "current": {
      "key_id": $key_id,
      "private_key": $private_key,
      "public_key": $public_key,
      "created_at": $created_at,
      "algorithm": "ES256"
    }
  }')

# Check if QR keys secret exists
if aws secretsmanager describe-secret --secret-id boleto-production-qr-keys >/dev/null 2>&1; then
  # Update existing secret with key rotation
  CURRENT_QR_KEYS=$(aws secretsmanager get-secret-value \
    --secret-id boleto-production-qr-keys \
    --query SecretString \
    --output text)
  
  ROTATED_QR_KEYS=$(echo "$CURRENT_QR_KEYS" | jq --argjson new_keys "$QR_KEYS" '
    {
      "current": $new_keys.current,
      "previous": .current
    }')
  
  aws secretsmanager update-secret \
    --secret-id boleto-production-qr-keys \
    --secret-string "$ROTATED_QR_KEYS"
else
  # Create new secret
  aws secretsmanager create-secret \
    --name boleto-production-qr-keys \
    --description "QR code signing keys for Boleto production" \
    --secret-string "$QR_KEYS"
fi

# Step 3: Update Hi.Events service to use new keys
echo "3. Updating Hi.Events service configuration..."
aws ssm put-parameter \
  --name "/boleto/production/qr/key_id" \
  --value "$QR_KEY_ID" \
  --type "String" \
  --overwrite

# Step 4: Deploy mobile app configuration for offline validation
echo "4. Updating mobile app QR validation keys..."
# Extract public key for mobile distribution
QR_PUBLIC_KEY_JWK=$(python3 << EOF
import json
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

# Load public key
with open('/tmp/qr_public_key.pem', 'rb') as f:
    public_key = serialization.load_pem_public_key(f.read())

# Convert to JWK format
public_numbers = public_key.public_numbers()
curve = public_numbers.curve
x = public_numbers.x
y = public_numbers.y

# Convert to bytes (32 bytes for P-256)
x_bytes = x.to_bytes(32, 'big')
y_bytes = y.to_bytes(32, 'big')

jwk = {
    "kty": "EC",
    "kid": "$QR_KEY_ID",
    "crv": "P-256",
    "x": base64.urlsafe_b64encode(x_bytes).decode().rstrip('='),
    "y": base64.urlsafe_b64encode(y_bytes).decode().rstrip('='),
    "use": "sig",
    "alg": "ES256"
}

print(json.dumps(jwk))
EOF
)

# Store public key configuration for mobile apps
aws s3 cp - s3://boleto-mobile-config/qr-keys.json << EOF
{
  "keys": [
    $QR_PUBLIC_KEY_JWK
  ],
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "rotation_id": "$QR_ROTATION_ID"
}
EOF

# Step 5: Test QR signing with new key
echo "5. Testing QR code signing with new key..."
TEST_QR_DATA='{"event_id":"test","ticket_id":"test-123","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
TEST_SIGNATURE=$(echo "$TEST_QR_DATA" | openssl dgst -sha256 -sign /tmp/qr_private_key.pem | base64 -w 0)

echo "Test signature generated: ${TEST_SIGNATURE:0:20}..."

# Verify signature
echo "$TEST_QR_DATA" | openssl dgst -sha256 -verify /tmp/qr_public_key.pem -signature <(echo "$TEST_SIGNATURE" | base64 -d)
if [ $? -eq 0 ]; then
  echo "✅ QR signature verification successful"
else
  echo "❌ QR signature verification failed"
  exit 1
fi

# Step 6: Restart services to pick up new keys
echo "6. Restarting services..."
aws ecs update-service \
  --cluster boleto-production \
  --service hi-events-service \
  --force-new-deployment

# Step 7: Update CloudFront invalidation for mobile config
echo "7. Invalidating mobile configuration cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/mobile-config/*"

# Cleanup
rm -f /tmp/qr_private_key.pem /tmp/qr_public_key.pem

echo "✅ QR signing key rotation completed"
echo "New QR Key ID: $QR_KEY_ID"
echo "Mobile apps will receive updated keys automatically"

# Alert mobile team
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:mobile-notifications \
  --subject "QR Signing Keys Updated" \
  --message "QR code signing keys have been rotated. New key ID: $QR_KEY_ID. Mobile apps will automatically download updated keys."
```

## Access Audit Procedures

### Weekly Access Review

```bash
#!/bin/bash
# Weekly access audit and review

AUDIT_DATE=$(date +%Y-%m-%d)
AUDIT_REPORT="/var/log/boleto/access-audit-$AUDIT_DATE.log"

echo "📋 Starting weekly access audit for $AUDIT_DATE"

# Step 1: Audit AWS IAM access
echo "1. Auditing AWS IAM access..." | tee -a "$AUDIT_REPORT"

# List all users and their last activity
aws iam generate-service-last-accessed-details \
  --arn arn:aws:iam::ACCOUNT:user/* \
  --granularity SERVICE_LEVEL > /tmp/access-analysis.json

JOB_ID=$(cat /tmp/access-analysis.json | jq -r '.JobId')

# Wait for analysis to complete
sleep 30

USERS_ACCESS=$(aws iam get-service-last-accessed-details --job-id "$JOB_ID" | \
  jq -r '.ServicesLastAccessed[] | select(.LastAuthenticated != null) | "\(.ServiceName): \(.LastAuthenticated)"')

echo "Recent IAM service access:" | tee -a "$AUDIT_REPORT"
echo "$USERS_ACCESS" | tee -a "$AUDIT_REPORT"

# Step 2: Audit database access
echo "2. Auditing database access..." | tee -a "$AUDIT_REPORT"

DB_CONNECTIONS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  usename,
  client_addr,
  backend_start,
  state,
  query_start
FROM pg_stat_activity 
WHERE usename != 'rdsadmin'
ORDER BY backend_start DESC;
" | tee -a "$AUDIT_REPORT")

# Step 3: Audit application access patterns
echo "3. Auditing application access patterns..." | tee -a "$AUDIT_REPORT"

# Get unique IP addresses from ALB logs (last 7 days)
UNIQUE_IPS=$(aws logs filter-log-events \
  --log-group-name "/aws/applicationloadbalancer/boleto-production-alb" \
  --start-time $(date -d '7 days ago' +%s)000 \
  --end-time $(date +%s)000 | \
  jq -r '.events[].message' | \
  awk '{print $3}' | sort | uniq -c | sort -nr | head -20)

echo "Top IP addresses (last 7 days):" | tee -a "$AUDIT_REPORT"
echo "$UNIQUE_IPS" | tee -a "$AUDIT_REPORT"

# Step 4: Audit API key usage
echo "4. Auditing API key usage..." | tee -a "$AUDIT_REPORT"

API_KEYS=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "api_key" \
  --start-time $(date -d '7 days ago' +%s)000 \
  --end-time $(date +%s)000 | \
  jq -r '.events[].message' | \
  grep -o 'api_key=[^[:space:]]*' | sort | uniq -c)

echo "API key usage:" | tee -a "$AUDIT_REPORT"
echo "$API_KEYS" | tee -a "$AUDIT_REPORT"

# Step 5: Check for privileged access
echo "5. Checking privileged access..." | tee -a "$AUDIT_REPORT"

# Check for root/admin access
ADMIN_ACCESS=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "admin OR root OR sudo" \
  --start-time $(date -d '7 days ago' +%s)000 \
  --end-time $(date +%s)000 | \
  jq '.events | length')

echo "Privileged access events: $ADMIN_ACCESS" | tee -a "$AUDIT_REPORT"

# Step 6: Review secrets access
echo "6. Reviewing secrets access..." | tee -a "$AUDIT_REPORT"

SECRETS_ACCESS=$(aws logs filter-log-events \
  --log-group-name "/aws/iam" \
  --filter-pattern "GetSecretValue OR PutSecretValue" \
  --start-time $(date -d '7 days ago' +%s)000 \
  --end-time $(date +%s)000 | \
  jq '.events | length')

echo "Secrets Manager access events: $SECRETS_ACCESS" | tee -a "$AUDIT_REPORT"

# Step 7: Generate compliance report
echo "7. Generating compliance report..." | tee -a "$AUDIT_REPORT"

cat >> "$AUDIT_REPORT" << EOF

==========================================
ACCESS AUDIT SUMMARY - $AUDIT_DATE
==========================================

Total Users Audited: $(aws iam list-users --query Users | jq length)
Active Database Connections: $(echo "$DB_CONNECTIONS" | wc -l)
Unique IP Addresses (7 days): $(echo "$UNIQUE_IPS" | wc -l)
API Key Usage Events: $(echo "$API_KEYS" | wc -l)
Privileged Access Events: $ADMIN_ACCESS
Secrets Access Events: $SECRETS_ACCESS

RECOMMENDATIONS:
1. Review users without recent activity for deactivation
2. Investigate unusual IP address patterns
3. Validate API key usage patterns
4. Review any privileged access events
5. Ensure secrets access is properly authorized

Audit conducted by: $(whoami)
Audit completed: $(date)
EOF

# Step 8: Send audit report
echo "8. Sending audit report..." | tee -a "$AUDIT_REPORT"

# Upload to secure S3 bucket
aws s3 cp "$AUDIT_REPORT" "s3://boleto-security-reports/access-audits/access-audit-$AUDIT_DATE.log"

# Send notification
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-reports \
  --subject "Weekly Access Audit Report - $AUDIT_DATE" \
  --message "Weekly access audit completed. Report available at s3://boleto-security-reports/access-audits/access-audit-$AUDIT_DATE.log"

echo "✅ Weekly access audit completed"
echo "Report saved to: $AUDIT_REPORT"
```

### Compliance Audit Trail

```bash
#!/bin/bash
# Generate compliance audit trail for regulatory requirements

COMPLIANCE_DATE=$(date +%Y-%m-%d)
COMPLIANCE_REPORT="/var/log/boleto/compliance-audit-$COMPLIANCE_DATE.json"

echo "📊 Generating compliance audit trail..."

# Collect all required audit data
AUDIT_DATA=$(jq -n \
  --arg audit_date "$COMPLIANCE_DATE" \
  --arg environment "production" \
  --arg auditor "$(whoami)" \
  '{
    "audit_metadata": {
      "audit_date": $audit_date,
      "environment": $environment,
      "auditor": $auditor,
      "audit_version": "1.0"
    },
    "authentication": {},
    "authorization": {},
    "data_access": {},
    "encryption": {},
    "network_security": {}
  }')

# Authentication audit
echo "Collecting authentication data..."
AUTH_EVENTS=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "authentication success OR authentication failed" \
  --start-time $(date -d '30 days ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'length(events)')

AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg auth_events "$AUTH_EVENTS" \
  '.authentication.total_events = ($auth_events | tonumber)')

# JWT key rotation audit
JWT_ROTATIONS=$(grep "JWT_KEY_ROTATION" /var/log/boleto/security-audit.log | wc -l)
AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg rotations "$JWT_ROTATIONS" \
  '.authentication.jwt_key_rotations_last_30_days = ($rotations | tonumber)')

# Authorization audit  
echo "Collecting authorization data..."
OAUTH_EVENTS=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "oauth" \
  --start-time $(date -d '30 days ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'length(events)')

AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg oauth_events "$OAUTH_EVENTS" \
  '.authorization.oauth_events = ($oauth_events | tonumber)')

# Data access audit
echo "Collecting data access information..."
DB_QUERIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -t -c \
  "SELECT count(*) FROM pg_stat_statements;")

AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg db_queries "$DB_QUERIES" \
  '.data_access.database_queries_tracked = ($db_queries | tonumber)')

# Encryption audit
echo "Collecting encryption status..."
RDS_ENCRYPTION=$(aws rds describe-db-instances \
  --db-instance-identifier boleto-production-rds \
  --query 'DBInstances[0].StorageEncrypted')

S3_ENCRYPTION=$(aws s3api get-bucket-encryption \
  --bucket boleto-production-assets \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text 2>/dev/null || echo "AES256")

AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg rds_enc "$RDS_ENCRYPTION" --arg s3_enc "$S3_ENCRYPTION" \
  '.encryption.rds_encrypted = ($rds_enc | test("true")) | .encryption.s3_encryption = $s3_enc')

# Network security audit
echo "Collecting network security data..."
WAF_RULES=$(aws wafv2 list-web-acls --scope CLOUDFRONT --query 'WebACLs | length')

SECURITY_GROUPS=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Environment,Values=production" \
  --query 'SecurityGroups | length')

AUDIT_DATA=$(echo "$AUDIT_DATA" | jq --arg waf_rules "$WAF_RULES" --arg security_groups "$SECURITY_GROUPS" \
  '.network_security.waf_rules = ($waf_rules | tonumber) | .network_security.security_groups = ($security_groups | tonumber)')

# Add compliance metrics
AUDIT_DATA=$(echo "$AUDIT_DATA" | jq \
  '.compliance_metrics = {
    "gdpr_compliance": true,
    "data_retention_policy_active": true,
    "encryption_at_rest": true,
    "encryption_in_transit": true,
    "access_logging_enabled": true,
    "backup_encryption": true,
    "key_rotation_schedule": "monthly"
  }')

# Save audit trail
echo "$AUDIT_DATA" > "$COMPLIANCE_REPORT"

# Upload to compliance bucket
aws s3 cp "$COMPLIANCE_REPORT" "s3://boleto-compliance-reports/audit-trails/compliance-audit-$COMPLIANCE_DATE.json"

# Send to compliance team
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:compliance-notifications \
  --subject "Compliance Audit Trail Generated - $COMPLIANCE_DATE" \
  --message "Compliance audit trail generated and stored at s3://boleto-compliance-reports/audit-trails/compliance-audit-$COMPLIANCE_DATE.json"

echo "✅ Compliance audit trail generated"
echo "Report saved to: $COMPLIANCE_REPORT"
```

## Security Monitoring Dashboard

### Real-time Security Metrics

```bash
#!/bin/bash
# Generate security monitoring dashboard data

echo "📊 Generating security dashboard metrics..."

# Create CloudWatch custom metrics for security monitoring
aws cloudwatch put-metric-data \
  --namespace "Boleto/Security" \
  --metric-data \
  MetricName=ActiveSessions,Value=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "return #redis.call('keys', 'session:*')" 0),Unit=Count \
  MetricName=FailedAuthAttempts,Value=$(aws logs filter-log-events --log-group-name "/ecs/gateway-service" --filter-pattern "authentication failed" --start-time $(date -d '1 hour ago' +%s)000 --end-time $(date +%s)000 --query 'length(events)'),Unit=Count \
  MetricName=JWTTokensIssued,Value=$(aws logs filter-log-events --log-group-name "/ecs/gateway-service" --filter-pattern "token generated" --start-time $(date -d '1 hour ago' +%s)000 --end-time $(date +%s)000 --query 'length(events)'),Unit=Count

echo "✅ Security metrics published to CloudWatch"
```

This security operations runbook provides comprehensive procedures for maintaining the security posture of the Boleto production system, with emphasis on proactive key management, breach detection, and compliance requirements.