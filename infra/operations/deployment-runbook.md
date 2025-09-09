# Production Deployment Runbook for Boleto System

## Overview

This runbook provides step-by-step procedures for deploying the Boleto event ticketing system to production, including blue-green deployment strategies, rollback procedures, and post-deployment verification.

## System Architecture Context

The Boleto system consists of:
- **Gateway Service**: OAuth JWT issuer with RS256 signatures
- **Hi.Events Backend**: Core event management functionality  
- **PostgreSQL Database**: Primary data store with Multi-AZ setup
- **ElastiCache Redis**: Session storage and caching
- **AWS Infrastructure**: ECS Fargate, ALB, CloudFront, S3

## Deployment Process

### Pre-Deployment Checklist

**Infrastructure Readiness**
- [ ] ECS cluster health verified
- [ ] Database connectivity confirmed
- [ ] Redis cluster operational
- [ ] Load balancer targets healthy
- [ ] SSL certificates valid (>30 days remaining)
- [ ] Secrets Manager accessible
- [ ] CloudWatch monitoring active

**Code Readiness**
- [ ] All tests passing in staging
- [ ] Security scans completed
- [ ] Database migrations tested
- [ ] Performance benchmarks met
- [ ] Code review approval obtained
- [ ] Rollback strategy documented

**Team Readiness**
- [ ] Deployment lead assigned
- [ ] On-call engineer available
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled
- [ ] Communication channels ready

### Phase 1: Pre-Deployment Preparation

#### 1.1 Environment Setup

```bash
#!/bin/bash
# Set deployment environment variables

export AWS_REGION="us-east-1"
export CLUSTER_NAME="boleto-production"
export DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
export BACKUP_ENABLED="true"

# Verify AWS credentials
aws sts get-caller-identity

# Load production configuration
source /etc/boleto/production.env
```

#### 1.2 Pre-Deployment Database Backup

```bash
#!/bin/bash
# Create pre-deployment database snapshot

SNAPSHOT_ID="boleto-pre-deploy-$(date +%Y%m%d-%H%M%S)"

echo "Creating pre-deployment database snapshot..."
aws rds create-db-snapshot \
  --db-instance-identifier boleto-production-rds \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region us-east-1

# Wait for snapshot completion
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region us-east-1

echo "✅ Database snapshot created: $SNAPSHOT_ID"
```

#### 1.3 Current State Documentation

```bash
#!/bin/bash
# Document current system state

echo "Documenting current deployment state..."

# Get current task definitions
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services gateway-service hi-events-service \
  --query 'services[].taskDefinition' > current-task-definitions.json

# Get current container images
aws ecs describe-task-definition \
  --task-definition gateway-service \
  --query 'taskDefinition.containerDefinitions[].image' > current-images.json

echo "✅ Current state documented"
```

### Phase 2: Database Migration

#### 2.1 Run Database Migrations

```bash
#!/bin/bash
# Execute database migrations

DB_HOST=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.host')

DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.password')

# Test database connectivity
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -U boleto_admin \
  -d boleto_production \
  -c "SELECT version();"

# Run migrations
cd /opt/boleto/hi-events
php artisan migrate --env=production --force

# Verify migration status
php artisan migrate:status --env=production
```

#### 2.2 Migration Verification

```sql
-- Verify critical tables and data integrity
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  typname as data_type
FROM pg_attribute 
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
JOIN pg_type ON pg_attribute.atttypid = pg_type.oid
WHERE pg_namespace.nspname = 'public' 
  AND pg_attribute.attnum > 0
  AND tablename IN ('users', 'events', 'sessions', 'orders')
ORDER BY tablename, attname;

-- Check row counts for critical tables
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
  'events' as table_name, COUNT(*) as row_count FROM events
UNION ALL
SELECT 
  'sessions' as table_name, COUNT(*) as row_count FROM sessions;
```

### Phase 3: Container Image Deployment

#### 3.1 Build and Push Images

```bash
#!/bin/bash
# Build and push production container images

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"

# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Build Gateway Service
cd services/gateway
docker build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  -t "$ECR_REGISTRY/boleto/gateway:$DEPLOYMENT_ID" \
  -t "$ECR_REGISTRY/boleto/gateway:latest" .

docker push "$ECR_REGISTRY/boleto/gateway:$DEPLOYMENT_ID"
docker push "$ECR_REGISTRY/boleto/gateway:latest"

# Build Hi.Events Service
cd ../hi-events
docker build \
  --platform linux/amd64 \
  --build-arg ENV=production \
  -t "$ECR_REGISTRY/boleto/hi-events:$DEPLOYMENT_ID" \
  -t "$ECR_REGISTRY/boleto/hi-events:latest" .

docker push "$ECR_REGISTRY/boleto/hi-events:$DEPLOYMENT_ID"
docker push "$ECR_REGISTRY/boleto/hi-events:latest"

echo "✅ Container images built and pushed"
```

#### 3.2 Update Task Definitions

```bash
#!/bin/bash
# Update ECS task definitions with new images

# Update Gateway Service task definition
GATEWAY_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition gateway-service \
  --query 'taskDefinition')

echo "$GATEWAY_TASK_DEF" | jq \
  --arg image "$ECR_REGISTRY/boleto/gateway:$DEPLOYMENT_ID" \
  '.containerDefinitions[0].image = $image | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' > gateway-task-def.json

aws ecs register-task-definition \
  --cli-input-json file://gateway-task-def.json

# Update Hi.Events Service task definition
HIEVENTS_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition hi-events-service \
  --query 'taskDefinition')

echo "$HIEVENTS_TASK_DEF" | jq \
  --arg image "$ECR_REGISTRY/boleto/hi-events:$DEPLOYMENT_ID" \
  '.containerDefinitions[0].image = $image | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' > hievents-task-def.json

aws ecs register-task-definition \
  --cli-input-json file://hievents-task-def.json

echo "✅ Task definitions updated"
```

### Phase 4: Blue-Green Deployment

#### 4.1 Deploy to Green Environment

```bash
#!/bin/bash
# Deploy new version to green environment

# Scale up green services
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service gateway-service-green \
  --desired-count 2 \
  --task-definition gateway-service:LATEST

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service hi-events-service-green \
  --desired-count 3 \
  --task-definition hi-events-service:LATEST

# Wait for services to become stable
echo "Waiting for green services to become stable..."
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services gateway-service-green hi-events-service-green

echo "✅ Green environment deployed"
```

#### 4.2 Health Check Validation

```bash
#!/bin/bash
# Validate green environment health

GREEN_ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names boleto-green-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test Gateway Service health
echo "Testing Gateway Service health..."
GATEWAY_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://$GREEN_ALB_DNS/healthz")

if [ "$GATEWAY_HEALTH" = "200" ]; then
  echo "✅ Gateway Service health check passed"
else
  echo "❌ Gateway Service health check failed: $GATEWAY_HEALTH"
  exit 1
fi

# Test Hi.Events API health
echo "Testing Hi.Events API health..."
HIEVENTS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://$GREEN_ALB_DNS/api/health")

if [ "$HIEVENTS_HEALTH" = "200" ]; then
  echo "✅ Hi.Events API health check passed"
else
  echo "❌ Hi.Events API health check failed: $HIEVENTS_HEALTH"
  exit 1
fi

# Test authentication flow
echo "Testing OAuth authentication..."
AUTH_TEST=$(curl -s -X POST \
  "https://$GREEN_ALB_DNS/auth/oauth/google" \
  -H "Content-Type: application/json" \
  -d '{"redirect_uri":"https://app.boleto.com/callback"}' \
  -w "%{http_code}")

if [[ "$AUTH_TEST" =~ 200|302 ]]; then
  echo "✅ Authentication endpoint responsive"
else
  echo "❌ Authentication endpoint failed"
  exit 1
fi

# Test database connectivity
echo "Testing database connectivity..."
DB_TEST=$(curl -s -X GET \
  "https://$GREEN_ALB_DNS/healthz/db" \
  -w "%{http_code}")

if [ "$DB_TEST" = "200" ]; then
  echo "✅ Database connectivity verified"
else
  echo "❌ Database connectivity failed"
  exit 1
fi

echo "✅ All green environment health checks passed"
```

#### 4.3 Performance Validation

```bash
#!/bin/bash
# Run performance tests against green environment

echo "Running performance validation..."

# JWT Token Generation Performance Test
echo "Testing JWT token generation performance..."
for i in {1..100}; do
  curl -s -X POST "https://$GREEN_ALB_DNS/auth/test/generate-token" \
    -H "Content-Type: application/json" \
    -d '{"user_id":"test-user-'$i'"}' > /dev/null
done

# Session Management Performance Test
echo "Testing session management performance..."
for i in {1..50}; do
  curl -s -X POST "https://$GREEN_ALB_DNS/me/sessions" \
    -H "Authorization: Bearer test-token-$i" > /dev/null
done

# API Response Time Test
echo "Testing API response times..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null \
  "https://$GREEN_ALB_DNS/api/events")

if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
  echo "✅ API response time acceptable: ${RESPONSE_TIME}s"
else
  echo "⚠️ API response time high: ${RESPONSE_TIME}s"
fi

echo "✅ Performance validation completed"
```

### Phase 5: Traffic Switching

#### 5.1 Switch Load Balancer Target Groups

```bash
#!/bin/bash
# Switch traffic from blue to green environment

PRODUCTION_ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names boleto-production-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

GREEN_TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
  --names boleto-green-gateway boleto-green-hievents \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Get current listener rules
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn "$PRODUCTION_ALB_ARN" \
  --query 'Listeners[?Port==`443`].ListenerArn' \
  --output text)

# Create weighted routing for gradual traffic shift
echo "Starting gradual traffic shift to green environment..."

# 10% traffic to green
aws elbv2 modify-rule \
  --rule-arn "$GATEWAY_RULE_ARN" \
  --actions Type=forward,ForwardConfig='{
    "TargetGroups": [
      {"TargetGroupArn": "'$BLUE_GATEWAY_TG'", "Weight": 90},
      {"TargetGroupArn": "'$GREEN_GATEWAY_TG'", "Weight": 10}
    ]
  }'

echo "10% traffic shifted to green environment"
sleep 300  # Monitor for 5 minutes

# 50% traffic to green
aws elbv2 modify-rule \
  --rule-arn "$GATEWAY_RULE_ARN" \
  --actions Type=forward,ForwardConfig='{
    "TargetGroups": [
      {"TargetGroupArn": "'$BLUE_GATEWAY_TG'", "Weight": 50},
      {"TargetGroupArn": "'$GREEN_GATEWAY_TG'", "Weight": 50}
    ]
  }'

echo "50% traffic shifted to green environment"
sleep 300  # Monitor for 5 minutes

# 100% traffic to green
aws elbv2 modify-rule \
  --rule-arn "$GATEWAY_RULE_ARN" \
  --actions Type=forward,TargetGroupArn="$GREEN_GATEWAY_TG"

aws elbv2 modify-rule \
  --rule-arn "$HIEVENTS_RULE_ARN" \
  --actions Type=forward,TargetGroupArn="$GREEN_HIEVENTS_TG"

echo "✅ 100% traffic shifted to green environment"
```

#### 5.2 Monitor Traffic Shift

```bash
#!/bin/bash
# Monitor key metrics during traffic shift

echo "Monitoring traffic shift metrics..."

# Monitor error rates
ERROR_RATE=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_ELB_5XX_Count \
  --dimensions Name=LoadBalancer,Value="$PRODUCTION_ALB_NAME" \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

# Monitor response times
RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value="$PRODUCTION_ALB_NAME" \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

# Check if metrics are within acceptable limits
if [ "$ERROR_RATE" = "None" ] || [ "$ERROR_RATE" -le 5 ]; then
  echo "✅ Error rate acceptable: $ERROR_RATE"
else
  echo "❌ High error rate detected: $ERROR_RATE"
  echo "Initiating rollback..."
  ./rollback-deployment.sh
  exit 1
fi

if [ "$RESPONSE_TIME" = "None" ] || (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
  echo "✅ Response time acceptable: ${RESPONSE_TIME}s"
else
  echo "⚠️ High response time: ${RESPONSE_TIME}s"
fi

echo "✅ Traffic shift monitoring completed successfully"
```

### Phase 6: Blue Environment Cleanup

#### 6.1 Scale Down Blue Environment

```bash
#!/bin/bash
# Scale down blue environment after successful deployment

echo "Scaling down blue environment..."

# Scale down blue services
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service gateway-service-blue \
  --desired-count 0

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service hi-events-service-blue \
  --desired-count 0

# Wait for services to scale down
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services gateway-service-blue hi-events-service-blue

echo "✅ Blue environment scaled down"
```

#### 6.2 Promote Green to Blue

```bash
#!/bin/bash
# Promote green environment to blue for next deployment

# Update service names for next deployment cycle
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service gateway-service-green \
  --service-name gateway-service-blue

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service hi-events-service-green \
  --service-name hi-events-service-blue

echo "✅ Green environment promoted to blue"
```

### Phase 7: Post-Deployment Verification

#### 7.1 Comprehensive Health Checks

```bash
#!/bin/bash
# Run comprehensive post-deployment health checks

echo "Running post-deployment verification..."

# Test OAuth Flow
echo "Testing complete OAuth flow..."
OAUTH_STATE=$(openssl rand -hex 32)
OAUTH_NONCE=$(openssl rand -hex 16)

# Test OAuth authorization endpoint
OAUTH_URL=$(curl -s -X POST "https://api.bole.to/auth/oauth/google" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "boleto-mobile",
    "redirect_uri": "com.boleto.app://oauth/callback",
    "state": "'$OAUTH_STATE'",
    "nonce": "'$OAUTH_NONCE'",
    "code_challenge": "test-challenge",
    "code_challenge_method": "S256"
  }' | jq -r '.authorization_url')

if [[ "$OAUTH_URL" =~ ^https://accounts.google.com/oauth/v2/auth ]]; then
  echo "✅ OAuth authorization URL generation successful"
else
  echo "❌ OAuth authorization URL generation failed"
  exit 1
fi

# Test JWT token generation and validation
echo "Testing JWT token generation..."
TEST_TOKEN=$(curl -s -X POST "https://api.bole.to/auth/test/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "account_id": "test-account"}' \
  | jq -r '.access_token')

if [ "$TEST_TOKEN" != "null" ] && [ -n "$TEST_TOKEN" ]; then
  echo "✅ JWT token generation successful"
  
  # Verify token
  TOKEN_VALID=$(curl -s -X GET "https://api.bole.to/me" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -w "%{http_code}" -o /dev/null)
  
  if [ "$TOKEN_VALID" = "200" ]; then
    echo "✅ JWT token validation successful"
  else
    echo "❌ JWT token validation failed"
    exit 1
  fi
else
  echo "❌ JWT token generation failed"
  exit 1
fi

# Test JWKS endpoint
echo "Testing JWKS endpoint..."
JWKS_RESPONSE=$(curl -s "https://api.bole.to/.well-known/jwks.json")
JWKS_KEYS_COUNT=$(echo "$JWKS_RESPONSE" | jq '.keys | length')

if [ "$JWKS_KEYS_COUNT" -gt 0 ]; then
  echo "✅ JWKS endpoint functional with $JWKS_KEYS_COUNT keys"
else
  echo "❌ JWKS endpoint not functional"
  exit 1
fi

# Test session management
echo "Testing session management..."
SESSION_CREATE=$(curl -s -X POST "https://api.bole.to/me/sessions" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "device_name": "Test Device",
    "device_type": "mobile"
  }' \
  -w "%{http_code}" -o /dev/null)

if [ "$SESSION_CREATE" = "201" ]; then
  echo "✅ Session creation successful"
else
  echo "❌ Session creation failed"
  exit 1
fi

# Test Hi.Events API integration
echo "Testing Hi.Events API integration..."
EVENTS_API=$(curl -s -X GET "https://api.bole.to/api/events" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -w "%{http_code}" -o /dev/null)

if [ "$EVENTS_API" = "200" ]; then
  echo "✅ Hi.Events API integration successful"
else
  echo "❌ Hi.Events API integration failed"
  exit 1
fi

echo "✅ All post-deployment verification checks passed"
```

#### 7.2 Performance Metrics Validation

```bash
#!/bin/bash
# Validate performance metrics meet SLA requirements

echo "Validating performance metrics..."

# Check average response time over last 10 minutes
AVG_RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value="boleto-production-alb" \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

if [ "$AVG_RESPONSE_TIME" != "None" ] && (( $(echo "$AVG_RESPONSE_TIME < 1.0" | bc -l) )); then
  echo "✅ Average response time: ${AVG_RESPONSE_TIME}s (SLA: <1.0s)"
else
  echo "⚠️ Average response time: ${AVG_RESPONSE_TIME}s exceeds SLA"
fi

# Check error rate
ERROR_RATE=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_ELB_4XX_Count \
  --dimensions Name=LoadBalancer,Value="boleto-production-alb" \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$ERROR_RATE" = "None" ] || [ "$ERROR_RATE" -le 2 ]; then
  echo "✅ Error rate: $ERROR_RATE (SLA: <2%)"
else
  echo "❌ Error rate: $ERROR_RATE exceeds SLA"
fi

echo "✅ Performance metrics validation completed"
```

## Rollback Procedures

### Emergency Rollback

```bash
#!/bin/bash
# Emergency rollback to previous stable version

echo "⚠️ INITIATING EMERGENCY ROLLBACK"

# Get previous task definitions
PREVIOUS_GATEWAY_TASK=$(aws ecs list-task-definitions \
  --family-prefix gateway-service \
  --status ACTIVE \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

PREVIOUS_HIEVENTS_TASK=$(aws ecs list-task-definitions \
  --family-prefix hi-events-service \
  --status ACTIVE \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

# Rollback services to previous task definitions
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service gateway-service \
  --task-definition "$PREVIOUS_GATEWAY_TASK" \
  --force-new-deployment

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service hi-events-service \
  --task-definition "$PREVIOUS_HIEVENTS_TASK" \
  --force-new-deployment

# Wait for rollback to complete
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services gateway-service hi-events-service

echo "✅ Emergency rollback completed"

# Verify rollback
./verify-deployment.sh --quick
```

### Database Rollback

```bash
#!/bin/bash
# Rollback database if needed (use with extreme caution)

if [ "$1" = "--confirm-database-rollback" ]; then
  echo "⚠️ INITIATING DATABASE ROLLBACK"
  
  SNAPSHOT_ID="$2"
  if [ -z "$SNAPSHOT_ID" ]; then
    echo "❌ Snapshot ID required for database rollback"
    exit 1
  fi
  
  # Create new RDS instance from snapshot
  aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier "boleto-production-rollback-$(date +%s)" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --db-instance-class db.r5.large \
    --multi-az \
    --storage-encrypted
  
  echo "✅ Database rollback initiated. Manual DNS update required."
else
  echo "❌ Database rollback requires explicit confirmation"
  echo "Usage: $0 --confirm-database-rollback SNAPSHOT_ID"
  exit 1
fi
```

## Monitoring and Alerting

### Deployment Monitoring Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "RunningTaskCount", "ServiceName", "gateway-service", "ClusterName", "boleto-production"],
          ["AWS/ECS", "RunningTaskCount", "ServiceName", "hi-events-service", "ClusterName", "boleto-production"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Running Tasks"
      }
    },
    {
      "type": "metric", 
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "boleto-production-alb"],
          ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", "boleto-production-alb"],
          ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "boleto-production-alb"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Application Performance"
      }
    }
  ]
}
```

### Deployment Alerts

```bash
#!/bin/bash
# Set up deployment-specific CloudWatch alarms

aws cloudwatch put-metric-alarm \
  --alarm-name "Deployment-High-Error-Rate" \
  --alarm-description "High error rate during deployment" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:deployment-alerts

aws cloudwatch put-metric-alarm \
  --alarm-name "Deployment-High-Response-Time" \
  --alarm-description "High response time during deployment" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 2.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --evaluation-periods 3 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:deployment-alerts
```

## Post-Deployment Tasks

### Documentation Updates

```bash
#!/bin/bash
# Update deployment documentation

echo "Updating deployment documentation..."

# Record deployment details
cat > deployment-record.md << EOF
# Deployment Record: $DEPLOYMENT_ID

**Date**: $(date)
**Deployed By**: $(git config user.name)
**Git Commit**: $(git rev-parse HEAD)
**Duration**: $(($(date +%s) - $DEPLOYMENT_START_TIME)) seconds

## Changes Deployed
$(git log --oneline --since="1 day ago")

## Deployment Metrics
- Response Time: $AVG_RESPONSE_TIME seconds
- Error Rate: $ERROR_RATE
- Database Migrations: $(php artisan migrate:status --env=production | grep -c "Ran")

## Rollback Information
- Previous Gateway Task: $PREVIOUS_GATEWAY_TASK
- Previous Hi.Events Task: $PREVIOUS_HIEVENTS_TASK  
- Database Snapshot: $SNAPSHOT_ID
EOF

# Update runbook with lessons learned
if [ -f "deployment-lessons.md" ]; then
  echo "## Deployment $DEPLOYMENT_ID" >> deployment-lessons.md
  echo "- Successful deployment completed in $(($(date +%s) - $DEPLOYMENT_START_TIME)) seconds" >> deployment-lessons.md
  echo "- All health checks passed" >> deployment-lessons.md
fi
```

### Team Communication

```bash
#!/bin/bash
# Send deployment completion notification

SLACK_WEBHOOK_URL="$SLACK_DEPLOYMENT_WEBHOOK"

curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-type: application/json' \
  --data '{
    "channel": "#deployments",
    "text": "✅ Production Deployment Completed Successfully",
    "attachments": [
      {
        "color": "good",
        "fields": [
          {
            "title": "Deployment ID",
            "value": "'$DEPLOYMENT_ID'",
            "short": true
          },
          {
            "title": "Duration", 
            "value": "'$(($(date +%s) - $DEPLOYMENT_START_TIME))' seconds",
            "short": true
          },
          {
            "title": "Git Commit",
            "value": "'$(git rev-parse --short HEAD)'",
            "short": true
          },
          {
            "title": "Deployed By",
            "value": "'$(git config user.name)'",
            "short": true
          }
        ]
      }
    ]
  }'

echo "✅ Deployment notification sent"
```

## Troubleshooting

### Common Deployment Issues

#### Service Won't Start

```bash
# Check service events
aws ecs describe-services \
  --cluster boleto-production \
  --services gateway-service \
  --query 'services[0].events[0:5]'

# Check task logs
TASK_ARN=$(aws ecs list-tasks \
  --cluster boleto-production \
  --service-name gateway-service \
  --query 'taskArns[0]' \
  --output text)

aws logs get-log-events \
  --log-group-name "/ecs/gateway-service" \
  --log-stream-name "ecs/gateway/$(echo $TASK_ARN | cut -d'/' -f3)"
```

#### Database Connection Issues

```bash
# Test database connectivity
DB_HOST=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.host')

# Check security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*" \
  --query 'SecurityGroups[].IpPermissions'

# Test from ECS task
aws ecs run-task \
  --cluster boleto-production \
  --task-definition debug-task \
  --overrides '{
    "containerOverrides": [{
      "name": "debug",
      "command": ["nc", "-zv", "'$DB_HOST'", "5432"]
    }]
  }'
```

#### Load Balancer Issues

```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names boleto-gateway-targets \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Check ALB logs
aws logs filter-log-events \
  --log-group-name "/aws/applicationloadbalancer/boleto-production-alb" \
  --start-time $(date -d '1 hour ago' +%s)000
```

This runbook provides comprehensive deployment procedures for the Boleto system with emphasis on safety, monitoring, and rapid rollback capabilities. All procedures are designed to maintain system availability and ensure successful deployments.