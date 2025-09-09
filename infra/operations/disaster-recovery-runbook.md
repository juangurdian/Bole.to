# Disaster Recovery Runbook for Boleto Production System

## Overview

This runbook provides comprehensive disaster recovery procedures for the Boleto event ticketing platform, including RTO/RPO targets, multi-region failover, data integrity verification, and business continuity procedures.

## Recovery Objectives and Targets

### Service Level Objectives

| Component | RTO Target | RPO Target | Business Impact |
|-----------|------------|------------|-----------------|
| **Gateway Service** | 15 minutes | 5 minutes | Complete authentication outage |
| **Hi.Events Backend** | 15 minutes | 5 minutes | Event management unavailable |
| **PostgreSQL Database** | 10 minutes | 1 minute | Data loss, complete service failure |
| **Redis Sessions** | 10 minutes | 15 minutes | Session loss, forced re-authentication |
| **Payment Processing** | 5 minutes | 30 seconds | Revenue loss, customer impact |
| **QR Validation** | 30 minutes | 1 hour | Event check-in disruption |

### Business Impact Classification

**Critical (Tier 1)**: Authentication, payments, database
**High (Tier 2)**: Event management, session management  
**Medium (Tier 3)**: QR validation, static assets
**Low (Tier 4)**: Analytics, reporting

## Disaster Recovery Scenarios

### Scenario 1: Single AZ Failure

**Scope**: One availability zone becomes unavailable
**Expected RTO**: 10 minutes (automatic)
**Expected RPO**: 1 minute

#### Automatic Responses

```bash
#!/bin/bash
# Automatic AZ failure detection and response

echo "🔍 Monitoring AZ health..."

# Check ECS service health across AZs
AZ_HEALTH=$(aws ecs describe-services \
  --cluster boleto-production \
  --services gateway-service hi-events-service \
  --query 'services[].[serviceName,runningCount,pendingCount,desiredCount]' \
  --output table)

echo "ECS Service Health:"
echo "$AZ_HEALTH"

# Check RDS Multi-AZ status
RDS_AZ_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier boleto-production-rds \
  --query 'DBInstances[0].{PrimaryAZ:AvailabilityZone,MultiAZ:MultiAZ,Status:DBInstanceStatus}' \
  --output table)

echo "RDS Multi-AZ Status:"
echo "$RDS_AZ_STATUS"

# Automatic failover verification
if aws rds describe-db-instances --db-instance-identifier boleto-production-rds --query 'DBInstances[0].MultiAZ' --output text | grep -q "true"; then
  echo "✅ RDS Multi-AZ is enabled - automatic failover available"
else
  echo "⚠️ RDS Multi-AZ not enabled - manual recovery required"
fi

# ElastiCache failover status
REDIS_FAILOVER=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id boleto-production-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].{Status:CacheClusterStatus,NumNodes:NumCacheNodes,Engine:Engine}' \
  --output table)

echo "Redis Cluster Status:"
echo "$REDIS_FAILOVER"
```

#### Manual Intervention (if needed)

```bash
#!/bin/bash
# Manual AZ failure response

FAILED_AZ="$1"
if [ -z "$FAILED_AZ" ]; then
  echo "Usage: $0 <failed-az>"
  echo "Example: $0 us-east-1a"
  exit 1
fi

echo "🚨 Responding to AZ failure: $FAILED_AZ"
echo "Timestamp: $(date)"

# Step 1: Verify failure scope
echo "1. Verifying failure scope..."
AFFECTED_INSTANCES=$(aws ec2 describe-instances \
  --filters "Name=availability-zone,Values=$FAILED_AZ" "Name=tag:Environment,Values=production" \
  --query 'Reservations[].Instances[].InstanceId' \
  --output text)

echo "Affected instances: $AFFECTED_INSTANCES"

# Step 2: Force ECS service redistribution
echo "2. Redistributing ECS services..."
for SERVICE in gateway-service hi-events-service; do
  echo "Redistributing $SERVICE..."
  aws ecs update-service \
    --cluster boleto-production \
    --service "$SERVICE" \
    --force-new-deployment
done

# Step 3: Verify database failover
echo "3. Verifying database failover..."
NEW_DB_AZ=$(aws rds describe-db-instances \
  --db-instance-identifier boleto-production-rds \
  --query 'DBInstances[0].AvailabilityZone' \
  --output text)

echo "Database now in AZ: $NEW_DB_AZ"

if [ "$NEW_DB_AZ" = "$FAILED_AZ" ]; then
  echo "⚠️ Database still in failed AZ - initiating manual failover..."
  aws rds reboot-db-instance \
    --db-instance-identifier boleto-production-rds \
    --force-failover
fi

# Step 4: Wait for services to stabilize
echo "4. Waiting for services to stabilize..."
aws ecs wait services-stable \
  --cluster boleto-production \
  --services gateway-service hi-events-service

# Step 5: Verify system health
echo "5. Verifying system health..."
./verify-system-health.sh --post-failover

echo "✅ AZ failure response completed"
```

### Scenario 2: Regional Disaster

**Scope**: Entire us-east-1 region unavailable  
**Expected RTO**: 2 hours (manual)
**Expected RPO**: 15 minutes

#### Cross-Region Failover Procedure

```bash
#!/bin/bash
# Cross-region disaster recovery failover

set -e

DR_REGION="${1:-us-west-2}"
PRIMARY_REGION="us-east-1"
FAILOVER_ID="regional-failover-$(date +%Y%m%d-%H%M%S)"

echo "🌎 INITIATING CROSS-REGION DISASTER RECOVERY"
echo "Primary Region: $PRIMARY_REGION (FAILED)"
echo "DR Region: $DR_REGION"
echo "Failover ID: $FAILOVER_ID"
echo "Timestamp: $(date)"

# Step 1: Verify DR region readiness
echo "1. Verifying DR region infrastructure..."

# Check if DR infrastructure exists
DR_VPC_ID=$(aws ec2 describe-vpcs \
  --region "$DR_REGION" \
  --filters "Name=tag:Name,Values=boleto-dr-vpc" \
  --query 'Vpcs[0].VpcId' \
  --output text 2>/dev/null || echo "None")

if [ "$DR_VPC_ID" = "None" ] || [ "$DR_VPC_ID" = "null" ]; then
  echo "⚠️ DR infrastructure not found. Deploying emergency DR environment..."
  ./deploy-emergency-dr.sh "$DR_REGION" "$FAILOVER_ID"
else
  echo "✅ DR infrastructure found: $DR_VPC_ID"
fi

# Step 2: Restore database from latest backup
echo "2. Restoring database in DR region..."

# Find latest cross-region snapshot
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --region "$DR_REGION" \
  --db-instance-identifier boleto-production-rds \
  --snapshot-type automated \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text 2>/dev/null)

if [ -z "$LATEST_SNAPSHOT" ] || [ "$LATEST_SNAPSHOT" = "None" ]; then
  # Use manual snapshot if automated not available
  LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
    --region "$DR_REGION" \
    --snapshot-type manual \
    --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `boleto-production`)] | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
    --output text)
fi

echo "Using snapshot: $LATEST_SNAPSHOT"

# Create DR database instance
DR_DB_IDENTIFIER="boleto-dr-$(date +%Y%m%d-%H%M%S)"
aws rds restore-db-instance-from-db-snapshot \
  --region "$DR_REGION" \
  --db-instance-identifier "$DR_DB_IDENTIFIER" \
  --db-snapshot-identifier "$LATEST_SNAPSHOT" \
  --db-instance-class db.r5.xlarge \
  --multi-az \
  --storage-encrypted \
  --auto-minor-version-upgrade false

echo "DR database creation initiated: $DR_DB_IDENTIFIER"

# Wait for database to become available
echo "Waiting for DR database to become available..."
aws rds wait db-instance-available \
  --region "$DR_REGION" \
  --db-instance-identifier "$DR_DB_IDENTIFIER"

DR_DB_ENDPOINT=$(aws rds describe-db-instances \
  --region "$DR_REGION" \
  --db-instance-identifier "$DR_DB_IDENTIFIER" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "✅ DR database available at: $DR_DB_ENDPOINT"

# Step 3: Deploy application services in DR region
echo "3. Deploying application services in DR region..."

# Update Terraform configuration for DR
cd infra/terraform
terraform workspace select dr-production || terraform workspace new dr-production

# Deploy with DR-specific variables
cat > dr-terraform.tfvars << EOF
aws_region = "$DR_REGION"
environment = "dr-production"
db_endpoint = "$DR_DB_ENDPOINT"
domain_name = "dr-api.bole.to"
instance_count_gateway = 3
instance_count_hievents = 4
EOF

terraform apply -var-file=dr-terraform.tfvars -auto-approve

# Get DR infrastructure details
DR_CLUSTER_NAME=$(terraform output -json | jq -r '.ecs_cluster_name.value')
DR_ALB_DNS=$(terraform output -json | jq -r '.alb_dns_name.value')

echo "DR ECS Cluster: $DR_CLUSTER_NAME"
echo "DR ALB DNS: $DR_ALB_DNS"

# Step 4: Deploy application containers
echo "4. Deploying application containers..."

# Use latest images from ECR (replicated to DR region)
GATEWAY_IMAGE="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$DR_REGION.amazonaws.com/boleto/gateway:latest"
HIEVENTS_IMAGE="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$DR_REGION.amazonaws.com/boleto/hi-events:latest"

# Update task definitions for DR region
aws ecs register-task-definition \
  --region "$DR_REGION" \
  --family boleto-dr-gateway \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 1024 \
  --memory 2048 \
  --execution-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole" \
  --container-definitions '[{
    "name": "gateway",
    "image": "'$GATEWAY_IMAGE'",
    "portMappings": [{"containerPort": 3001}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "DB_HOST", "value": "'$DR_DB_ENDPOINT'"},
      {"name": "REDIS_HOST", "value": "boleto-dr-redis.cache.amazonaws.com"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/boleto-dr-gateway",
        "awslogs-region": "'$DR_REGION'",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]'

# Create and start services
aws ecs create-service \
  --region "$DR_REGION" \
  --cluster "$DR_CLUSTER_NAME" \
  --service-name boleto-dr-gateway \
  --task-definition boleto-dr-gateway:1 \
  --desired-count 3 \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}' \
  --load-balancers 'targetGroupArn=arn:aws:elasticloadbalancing:'$DR_REGION':ACCOUNT:targetgroup/boleto-dr-gateway/xxx,containerName=gateway,containerPort=3001'

# Wait for services to become stable
aws ecs wait services-stable \
  --region "$DR_REGION" \
  --cluster "$DR_CLUSTER_NAME" \
  --services boleto-dr-gateway

echo "✅ Application services deployed in DR region"

# Step 5: Update DNS to point to DR region
echo "5. Updating DNS to point to DR region..."

# Create DNS change batch
cat > /tmp/dns-change-dr.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.bole.to",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{"Value": "$DR_ALB_DNS"}]
    }
  }]
}
EOF

# Apply DNS change
aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file:///tmp/dns-change-dr.json

echo "✅ DNS updated to point to DR region"

# Step 6: Verify DR system health
echo "6. Verifying DR system health..."
sleep 60  # Wait for DNS propagation

# Test API endpoints
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://api.bole.to/healthz")
if [ "$API_HEALTH" = "200" ]; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed: $API_HEALTH"
fi

# Test authentication
AUTH_TEST=$(curl -s -X POST "https://api.bole.to/auth/test/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"dr-test","account_id":"dr-test"}' \
  -w "%{http_code}")

if [[ "$AUTH_TEST" =~ 200 ]]; then
  echo "✅ Authentication system functional"
else
  echo "❌ Authentication system failed: $AUTH_TEST"
fi

# Step 7: Notify stakeholders
echo "7. Notifying stakeholders..."

# Send emergency notification
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:emergency-notifications \
  --subject "DISASTER RECOVERY ACTIVATED - $FAILOVER_ID" \
  --message "Cross-region disaster recovery has been activated. Primary region: $PRIMARY_REGION (FAILED). DR region: $DR_REGION. Service should be restored. Failover ID: $FAILOVER_ID"

# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/$STATUS_PAGE_ID/incidents" \
  -H "Authorization: OAuth $STATUS_PAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "Regional Disaster Recovery Activated",
      "status": "investigating",
      "message": "We have activated disaster recovery procedures due to a regional outage. Service has been restored in our backup region."
    }
  }'

echo "✅ Cross-region disaster recovery completed"
echo "DR Region: $DR_REGION"
echo "DR Database: $DR_DB_IDENTIFIER"
echo "DR Cluster: $DR_CLUSTER_NAME"
echo "Failover ID: $FAILOVER_ID"
echo "Status: Service restored in DR region"

# Log DR activation
cat >> /var/log/boleto/disaster-recovery.log << EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) DISASTER_RECOVERY_ACTIVATED failover_id="$FAILOVER_ID" primary_region="$PRIMARY_REGION" dr_region="$DR_REGION" rto_achieved="$(date +%s)" operator="$(whoami)"
EOF
```

### Scenario 3: Database Corruption/Security Breach

**Scope**: Database integrity compromised
**Expected RTO**: 1 hour
**Expected RPO**: Point-in-time recovery

#### Point-in-Time Recovery Procedure

```bash
#!/bin/bash
# Point-in-time database recovery

set -e

RECOVERY_TIMESTAMP="$1"
INCIDENT_ID="$2"

if [ -z "$RECOVERY_TIMESTAMP" ]; then
  echo "Usage: $0 <recovery-timestamp> [incident-id]"
  echo "Timestamp format: YYYY-MM-DDTHH:MM:SS.000Z"
  echo "Example: $0 2024-01-15T10:30:00.000Z security-breach-123"
  exit 1
fi

INCIDENT_ID="${INCIDENT_ID:-incident-$(date +%Y%m%d-%H%M%S)}"

echo "🔄 INITIATING POINT-IN-TIME RECOVERY"
echo "Recovery Timestamp: $RECOVERY_TIMESTAMP"
echo "Incident ID: $INCIDENT_ID"
echo "Current Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Step 1: Validate recovery timestamp
echo "1. Validating recovery timestamp..."

# Convert to epoch for validation
RECOVERY_EPOCH=$(date -d "$RECOVERY_TIMESTAMP" +%s)
CURRENT_EPOCH=$(date +%s)

if [ "$RECOVERY_EPOCH" -gt "$CURRENT_EPOCH" ]; then
  echo "❌ Recovery timestamp cannot be in the future"
  exit 1
fi

# Check if timestamp is within backup retention period (7 days)
RETENTION_LIMIT_EPOCH=$((CURRENT_EPOCH - 604800))  # 7 days ago
if [ "$RECOVERY_EPOCH" -lt "$RETENTION_LIMIT_EPOCH" ]; then
  echo "❌ Recovery timestamp is beyond retention period (7 days)"
  exit 1
fi

echo "✅ Recovery timestamp validated"

# Step 2: Create recovery database instance
echo "2. Creating recovery database instance..."

RECOVERY_DB_ID="boleto-recovery-$(date +%Y%m%d-%H%M%S)"

aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier boleto-production-rds \
  --target-db-instance-identifier "$RECOVERY_DB_ID" \
  --restore-time "$RECOVERY_TIMESTAMP" \
  --db-instance-class db.r5.xlarge \
  --multi-az \
  --storage-encrypted \
  --auto-minor-version-upgrade false

echo "Recovery database creation initiated: $RECOVERY_DB_ID"

# Wait for recovery database to become available
echo "Waiting for recovery database to become available..."
aws rds wait db-instance-available \
  --db-instance-identifier "$RECOVERY_DB_ID"

RECOVERY_DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RECOVERY_DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "✅ Recovery database available at: $RECOVERY_DB_ENDPOINT"

# Step 3: Data integrity verification
echo "3. Verifying data integrity of recovered database..."

# Get database credentials
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.password')

# Verify critical tables exist and have expected data
INTEGRITY_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -t -c "
-- Check critical tables
SELECT 
  'users' as table_name, 
  count(*) as row_count,
  max(created_at) as latest_record
FROM users
WHERE created_at <= '$RECOVERY_TIMESTAMP'
UNION ALL
SELECT 
  'events' as table_name, 
  count(*) as row_count,
  max(created_at) as latest_record
FROM events  
WHERE created_at <= '$RECOVERY_TIMESTAMP'
UNION ALL
SELECT 
  'orders' as table_name, 
  count(*) as row_count,
  max(created_at) as latest_record
FROM orders
WHERE created_at <= '$RECOVERY_TIMESTAMP';
")

echo "Data integrity check:"
echo "$INTEGRITY_CHECK"

# Verify no corruption indicators
CORRUPTION_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -t -c "
-- Check for corruption indicators
SELECT 
  count(*) as invalid_orders
FROM orders 
WHERE user_id IS NULL 
  OR event_id IS NULL 
  OR created_at > '$RECOVERY_TIMESTAMP';
")

echo "Corruption indicators: $CORRUPTION_CHECK"

if [ "$CORRUPTION_CHECK" -gt 0 ]; then
  echo "⚠️ Found $CORRUPTION_CHECK potentially corrupt records"
else
  echo "✅ No corruption indicators found"
fi

# Step 4: Create staging environment for testing
echo "4. Creating staging environment for recovery testing..."

# Deploy temporary staging services using recovery database
STAGING_CLUSTER="boleto-recovery-staging"

# Create temporary ECS cluster
aws ecs create-cluster --cluster-name "$STAGING_CLUSTER"

# Register staging task definition
aws ecs register-task-definition \
  --family boleto-recovery-gateway \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole" \
  --container-definitions '[{
    "name": "gateway",
    "image": "'$(aws sts get-caller-identity --query Account --output text)'.dkr.ecr.us-east-1.amazonaws.com/boleto/gateway:latest",
    "portMappings": [{"containerPort": 3001}],
    "environment": [
      {"name": "NODE_ENV", "value": "staging"},
      {"name": "DB_HOST", "value": "'$RECOVERY_DB_ENDPOINT'"},
      {"name": "REDIS_HOST", "value": "boleto-staging-redis"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/boleto-recovery-gateway",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]'

echo "✅ Staging environment prepared"

# Step 5: Application-level testing
echo "5. Testing application functionality with recovered data..."

# Run ECS task for testing
TASK_ARN=$(aws ecs run-task \
  --cluster "$STAGING_CLUSTER" \
  --task-definition boleto-recovery-gateway:1 \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}' \
  --query 'tasks[0].taskArn' \
  --output text)

echo "Testing task started: $TASK_ARN"

# Wait for task to be running
aws ecs wait tasks-running \
  --cluster "$STAGING_CLUSTER" \
  --tasks "$TASK_ARN"

# Get task IP for testing
TASK_IP=$(aws ecs describe-tasks \
  --cluster "$STAGING_CLUSTER" \
  --tasks "$TASK_ARN" \
  --query 'tasks[0].attachments[0].details[?name==`privateIPv4Address`].value' \
  --output text)

echo "Testing service available at: $TASK_IP:3001"

# Basic functionality tests
sleep 30  # Allow service to start

AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://$TASK_IP:3001/healthz")
if [ "$AUTH_TEST" = "200" ]; then
  echo "✅ Recovery service health check passed"
else
  echo "❌ Recovery service health check failed: $AUTH_TEST"
fi

# Step 6: Decision point - Production cutover
echo "6. Recovery verification completed"
echo ""
echo "RECOVERY SUMMARY:"
echo "=================="
echo "Recovery Database: $RECOVERY_DB_ID"
echo "Recovery Endpoint: $RECOVERY_DB_ENDPOINT"
echo "Recovery Timestamp: $RECOVERY_TIMESTAMP"
echo "Data Integrity: $([ "$CORRUPTION_CHECK" -eq 0 ] && echo "PASSED" || echo "FAILED")"
echo "Service Test: $([ "$AUTH_TEST" = "200" ] && echo "PASSED" || echo "FAILED")"
echo ""
echo "NEXT STEPS:"
echo "==========="
echo "1. Review recovery data integrity"
echo "2. Test critical business functions"
echo "3. Coordinate with stakeholders"
echo "4. Execute production cutover if approved"
echo ""
echo "To proceed with production cutover:"
echo "./cutover-to-recovery-db.sh $RECOVERY_DB_ID $INCIDENT_ID"

# Step 7: Cleanup staging resources (optional)
read -p "Cleanup staging resources now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Cleaning up staging resources..."
  aws ecs stop-task --cluster "$STAGING_CLUSTER" --task "$TASK_ARN"
  aws ecs delete-cluster --cluster "$STAGING_CLUSTER"
  echo "✅ Staging cleanup completed"
fi

echo "✅ Point-in-time recovery preparation completed"

# Log recovery operation
cat >> /var/log/boleto/disaster-recovery.log << EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) POINT_IN_TIME_RECOVERY incident_id="$INCIDENT_ID" recovery_timestamp="$RECOVERY_TIMESTAMP" recovery_db="$RECOVERY_DB_ID" status="prepared" operator="$(whoami)"
EOF

# Notify incident response team
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:incident-response \
  --subject "Point-in-Time Recovery Prepared - $INCIDENT_ID" \
  --message "Point-in-time recovery to $RECOVERY_TIMESTAMP completed. Recovery DB: $RECOVERY_DB_ID. Awaiting approval for production cutover."
```

#### Production Database Cutover

```bash
#!/bin/bash
# Cutover production to recovery database

set -e

RECOVERY_DB_ID="$1"
INCIDENT_ID="$2"
CONFIRMATION="$3"

if [ -z "$RECOVERY_DB_ID" ] || [ -z "$INCIDENT_ID" ]; then
  echo "Usage: $0 <recovery-db-id> <incident-id> [CONFIRM]"
  echo "Example: $0 boleto-recovery-20240115-103000 security-breach-123 CONFIRM"
  exit 1
fi

if [ "$CONFIRMATION" != "CONFIRM" ]; then
  echo "⚠️ THIS WILL CUTOVER PRODUCTION TO RECOVERY DATABASE"
  echo "Recovery DB: $RECOVERY_DB_ID"
  echo "Incident: $INCIDENT_ID"
  echo ""
  read -p "Type CONFIRM to proceed: " CONFIRMATION
  
  if [ "$CONFIRMATION" != "CONFIRM" ]; then
    echo "Operation cancelled"
    exit 1
  fi
fi

CUTOVER_ID="cutover-$(date +%Y%m%d-%H%M%S)"

echo "🔄 INITIATING PRODUCTION DATABASE CUTOVER"
echo "Recovery DB: $RECOVERY_DB_ID"
echo "Incident ID: $INCIDENT_ID"
echo "Cutover ID: $CUTOVER_ID"
echo "Timestamp: $(date)"

# Step 1: Maintenance mode activation
echo "1. Activating maintenance mode..."

# Put application in maintenance mode
aws ssm put-parameter \
  --name "/boleto/production/maintenance_mode" \
  --value "true" \
  --type "String" \
  --overwrite

# Update load balancer health check to return maintenance page
aws elbv2 modify-target-group \
  --target-group-arn "$(aws elbv2 describe-target-groups --names boleto-gateway-targets --query 'TargetGroups[0].TargetGroupArn' --output text)" \
  --health-check-path "/maintenance"

echo "✅ Maintenance mode activated"

# Step 2: Stop application services
echo "2. Stopping application services..."

# Scale down services to 0
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --desired-count 0

aws ecs update-service \
  --cluster boleto-production \
  --service hi-events-service \
  --desired-count 0

# Wait for services to stop
aws ecs wait services-stable \
  --cluster boleto-production \
  --services gateway-service hi-events-service

echo "✅ Application services stopped"

# Step 3: Backup current database state
echo "3. Creating final backup of current database..."

FINAL_BACKUP_ID="pre-cutover-backup-$(date +%Y%m%d-%H%M%S)"
aws rds create-db-snapshot \
  --db-instance-identifier boleto-production-rds \
  --db-snapshot-identifier "$FINAL_BACKUP_ID"

echo "Final backup created: $FINAL_BACKUP_ID"

# Step 4: Update DNS/endpoint to recovery database
echo "4. Updating database endpoint configuration..."

# Get recovery database endpoint
RECOVERY_DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RECOVERY_DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Recovery DB endpoint: $RECOVERY_DB_ENDPOINT"

# Update application configuration to use recovery database
aws ssm put-parameter \
  --name "/boleto/production/database/host" \
  --value "$RECOVERY_DB_ENDPOINT" \
  --type "String" \
  --overwrite

# Update Secrets Manager with new endpoint
CURRENT_DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' \
  --output text)

UPDATED_DB_SECRET=$(echo "$CURRENT_DB_SECRET" | jq --arg host "$RECOVERY_DB_ENDPOINT" '.host = $host')

aws secretsmanager update-secret \
  --secret-id boleto-production-db \
  --secret-string "$UPDATED_DB_SECRET"

echo "✅ Database configuration updated"

# Step 5: Restart application services with recovery database
echo "5. Restarting application services..."

# Force new deployment to pick up new database configuration
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --desired-count 2 \
  --force-new-deployment

aws ecs update-service \
  --cluster boleto-production \
  --service hi-events-service \
  --desired-count 3 \
  --force-new-deployment

# Wait for services to stabilize
aws ecs wait services-stable \
  --cluster boleto-production \
  --services gateway-service hi-events-service

echo "✅ Application services restarted"

# Step 6: Verify system health
echo "6. Verifying system health..."

sleep 30  # Allow services to fully start

# Test database connectivity
DB_PASSWORD=$(echo "$UPDATED_DB_SECRET" | jq -r '.password')
DB_TEST=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "SELECT 1;" 2>&1)

if echo "$DB_TEST" | grep -q "1"; then
  echo "✅ Database connectivity verified"
else
  echo "❌ Database connectivity failed: $DB_TEST"
  exit 1
fi

# Test API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://api.bole.to/healthz")
if [ "$API_HEALTH" = "200" ]; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed: $API_HEALTH"
  exit 1
fi

# Step 7: Exit maintenance mode
echo "7. Exiting maintenance mode..."

# Remove maintenance mode
aws ssm put-parameter \
  --name "/boleto/production/maintenance_mode" \
  --value "false" \
  --type "String" \
  --overwrite

# Restore normal health check
aws elbv2 modify-target-group \
  --target-group-arn "$(aws elbv2 describe-target-groups --names boleto-gateway-targets --query 'TargetGroups[0].TargetGroupArn' --output text)" \
  --health-check-path "/healthz"

echo "✅ Maintenance mode deactivated"

# Step 8: Notification and documentation
echo "8. Sending notifications..."

# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/$STATUS_PAGE_ID/incidents" \
  -H "Authorization: OAuth $STATUS_PAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "Database Recovery Completed",
      "status": "resolved",
      "message": "Database recovery has been completed successfully. All services are now operational."
    }
  }'

# Send completion notification
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:incident-response \
  --subject "Production Database Cutover Completed - $CUTOVER_ID" \
  --message "Production database cutover to recovery database completed successfully. Incident: $INCIDENT_ID. Recovery DB: $RECOVERY_DB_ID. All services operational."

echo "✅ PRODUCTION DATABASE CUTOVER COMPLETED SUCCESSFULLY"
echo ""
echo "CUTOVER SUMMARY:"
echo "================"
echo "Cutover ID: $CUTOVER_ID"
echo "Incident ID: $INCIDENT_ID"
echo "Recovery DB: $RECOVERY_DB_ID"
echo "New DB Endpoint: $RECOVERY_DB_ENDPOINT"
echo "Final Backup: $FINAL_BACKUP_ID"
echo "Status: OPERATIONAL"
echo ""
echo "NEXT STEPS:"
echo "==========="
echo "1. Monitor system performance"
echo "2. Verify all critical functions"
echo "3. Plan cleanup of old database resources"
echo "4. Update documentation and runbooks"

# Log cutover completion
cat >> /var/log/boleto/disaster-recovery.log << EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) PRODUCTION_CUTOVER_COMPLETED cutover_id="$CUTOVER_ID" incident_id="$INCIDENT_ID" recovery_db="$RECOVERY_DB_ID" final_backup="$FINAL_BACKUP_ID" operator="$(whoami)"
EOF
```

## Business Continuity Procedures

### Communication Plan

#### Stakeholder Notification Matrix

```bash
#!/bin/bash
# Automated stakeholder notification system

INCIDENT_SEVERITY="$1"  # P0, P1, P2, P3
INCIDENT_TYPE="$2"      # outage, security, performance, maintenance
INCIDENT_MESSAGE="$3"

case $INCIDENT_SEVERITY in
  "P0")
    # Critical - Complete service outage
    NOTIFICATION_TARGETS="cto,engineering-manager,customer-success,all-hands"
    NOTIFICATION_METHODS="phone,email,slack,status-page"
    SLA_NOTIFICATION_TIME="immediate"
    ;;
  "P1")
    # High - Partial service impact
    NOTIFICATION_TARGETS="engineering-manager,on-call,customer-success"
    NOTIFICATION_METHODS="email,slack,status-page"
    SLA_NOTIFICATION_TIME="15-minutes"
    ;;
  "P2")
    # Medium - Performance degradation
    NOTIFICATION_TARGETS="on-call,engineering-team"
    NOTIFICATION_METHODS="slack,email"
    SLA_NOTIFICATION_TIME="1-hour"
    ;;
  "P3")
    # Low - Minor issues
    NOTIFICATION_TARGETS="engineering-team"
    NOTIFICATION_METHODS="slack"
    SLA_NOTIFICATION_TIME="4-hours"
    ;;
esac

echo "📢 Sending $INCIDENT_SEVERITY notifications via $NOTIFICATION_METHODS"

# Phone notifications (P0 only)
if [[ "$INCIDENT_SEVERITY" = "P0" && "$NOTIFICATION_METHODS" =~ "phone" ]]; then
  # PagerDuty escalation
  curl -X POST "https://events.pagerduty.com/v2/enqueue" \
    -H "Content-Type: application/json" \
    -d '{
      "routing_key": "'$PAGERDUTY_ROUTING_KEY'",
      "event_action": "trigger",
      "dedup_key": "'$(date +%s)'",
      "payload": {
        "summary": "'$INCIDENT_MESSAGE'",
        "severity": "critical",
        "source": "boleto-production"
      }
    }'
fi

# Slack notifications
if [[ "$NOTIFICATION_METHODS" =~ "slack" ]]; then
  SLACK_COLOR="danger"
  [ "$INCIDENT_SEVERITY" = "P3" ] && SLACK_COLOR="warning"
  
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data '{
      "channel": "#incidents",
      "text": "🚨 '$INCIDENT_SEVERITY' Incident: '$INCIDENT_TYPE'",
      "attachments": [{
        "color": "'$SLACK_COLOR'",
        "fields": [{
          "title": "Message",
          "value": "'$INCIDENT_MESSAGE'",
          "short": false
        }, {
          "title": "Severity", 
          "value": "'$INCIDENT_SEVERITY'",
          "short": true
        }, {
          "title": "Time",
          "value": "'$(date)'",
          "short": true
        }]
      }]
    }'
fi

# Status page updates
if [[ "$NOTIFICATION_METHODS" =~ "status-page" ]]; then
  STATUS_IMPACT="major_outage"
  [ "$INCIDENT_SEVERITY" = "P1" ] && STATUS_IMPACT="partial_outage"
  [ "$INCIDENT_SEVERITY" = "P2" ] && STATUS_IMPACT="degraded_performance"
  
  curl -X POST "https://api.statuspage.io/v1/pages/$STATUS_PAGE_ID/incidents" \
    -H "Authorization: OAuth $STATUS_PAGE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "incident": {
        "name": "'$INCIDENT_TYPE' - '$INCIDENT_SEVERITY'",
        "status": "investigating",
        "impact_override": "'$STATUS_IMPACT'",
        "message": "'$INCIDENT_MESSAGE'"
      }
    }'
fi

# Email notifications
if [[ "$NOTIFICATION_METHODS" =~ "email" ]]; then
  aws sns publish \
    --topic-arn "arn:aws:sns:us-east-1:ACCOUNT:incident-notifications-$INCIDENT_SEVERITY" \
    --subject "[$INCIDENT_SEVERITY] Boleto Incident: $INCIDENT_TYPE" \
    --message "$INCIDENT_MESSAGE

Time: $(date)
Severity: $INCIDENT_SEVERITY
Type: $INCIDENT_TYPE

This is an automated notification from the Boleto monitoring system."
fi

echo "✅ Notifications sent for $INCIDENT_SEVERITY incident"
```

### Customer Communication Templates

```bash
#!/bin/bash
# Customer communication template generator

COMMUNICATION_TYPE="$1"  # initial, update, resolved
INCIDENT_DETAILS="$2"
EXPECTED_RESOLUTION="$3"

case $COMMUNICATION_TYPE in
  "initial")
    SUBJECT="Service Disruption - We're Working on It"
    MESSAGE="We are currently experiencing technical difficulties that may affect your ability to access our services. Our team has been notified and is actively working to resolve the issue.

What happened: $INCIDENT_DETAILS

Expected resolution: $EXPECTED_RESOLUTION

We sincerely apologize for any inconvenience and will provide updates as we have them.

- The Boleto Team"
    ;;
    
  "update") 
    SUBJECT="Service Update - Progress Report"
    MESSAGE="We wanted to provide you with an update on the service disruption we reported earlier.

Current status: $INCIDENT_DETAILS

Expected resolution: $EXPECTED_RESOLUTION

We continue to work diligently to resolve this issue and appreciate your patience.

- The Boleto Team"
    ;;
    
  "resolved")
    SUBJECT="Service Restored - Issue Resolved" 
    MESSAGE="We're pleased to report that the service disruption has been resolved.

Issue summary: $INCIDENT_DETAILS

Resolution: Services have been fully restored and are operating normally.

We apologize for any inconvenience this may have caused and thank you for your patience while we worked to resolve this issue.

- The Boleto Team"
    ;;
esac

echo "Subject: $SUBJECT"
echo ""
echo "$MESSAGE"

# Save template for use
cat > "/tmp/customer-communication-$COMMUNICATION_TYPE.txt" << EOF
Subject: $SUBJECT

$MESSAGE
EOF

echo ""
echo "Template saved to: /tmp/customer-communication-$COMMUNICATION_TYPE.txt"
```

## Data Integrity Verification

### Post-Recovery Data Validation

```bash
#!/bin/bash
# Comprehensive data integrity validation after recovery

RECOVERY_DB_ENDPOINT="$1"
RECOVERY_TIMESTAMP="$2"

if [ -z "$RECOVERY_DB_ENDPOINT" ] || [ -z "$RECOVERY_TIMESTAMP" ]; then
  echo "Usage: $0 <recovery-db-endpoint> <recovery-timestamp>"
  exit 1
fi

echo "🔍 COMPREHENSIVE DATA INTEGRITY VALIDATION"
echo "Database: $RECOVERY_DB_ENDPOINT"
echo "Recovery Point: $RECOVERY_TIMESTAMP"
echo "Validation Time: $(date)"

# Get database credentials
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.password')

# Step 1: Basic table integrity checks
echo "1. Basic table integrity checks..."

TABLE_INTEGRITY=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "
-- Check critical tables exist and have reasonable row counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'events', 'orders', 'sessions', 'payment_intents')
ORDER BY tablename;
")

echo "Table integrity status:"
echo "$TABLE_INTEGRITY"

# Step 2: Foreign key constraint validation
echo "2. Foreign key constraint validation..."

FK_VIOLATIONS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -t -c "
-- Check for foreign key violations
SELECT 
  'orders_user_fk' as constraint_name,
  count(*) as violations
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.user_id IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
  'orders_event_fk' as constraint_name,
  count(*) as violations  
FROM orders o
LEFT JOIN events e ON o.event_id = e.id
WHERE o.event_id IS NOT NULL AND e.id IS NULL

UNION ALL

SELECT
  'sessions_user_fk' as constraint_name,
  count(*) as violations
FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL AND u.id IS NULL;
")

echo "Foreign key violations:"
echo "$FK_VIOLATIONS"

# Step 3: Data consistency checks
echo "3. Data consistency validation..."

CONSISTENCY_CHECKS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "
-- Check for data inconsistencies
SELECT 
  'negative_amounts' as check_name,
  count(*) as violations
FROM orders
WHERE total_amount < 0

UNION ALL

SELECT
  'future_dates' as check_name,
  count(*) as violations
FROM orders
WHERE created_at > NOW()

UNION ALL

SELECT
  'invalid_email_formats' as check_name,
  count(*) as violations
FROM users
WHERE email IS NOT NULL 
  AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

UNION ALL

SELECT
  'duplicate_sessions' as check_name,
  count(*) - count(DISTINCT (user_id, device_id)) as violations
FROM sessions
WHERE expires_at > NOW();
")

echo "Data consistency violations:"
echo "$CONSISTENCY_CHECKS"

# Step 4: Business rule validation  
echo "4. Business rule validation..."

BUSINESS_RULES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "
-- Validate business rules
SELECT 
  'events_without_organizer' as rule_name,
  count(*) as violations
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
WHERE e.organizer_id IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT
  'orders_exceed_event_capacity' as rule_name,
  count(*) as violations
FROM (
  SELECT 
    e.id,
    e.max_capacity,
    count(o.id) as orders_count
  FROM events e
  LEFT JOIN orders o ON e.id = o.event_id
  WHERE o.status = 'completed'
    AND e.max_capacity IS NOT NULL
  GROUP BY e.id, e.max_capacity
  HAVING count(o.id) > e.max_capacity
) violations

UNION ALL

SELECT
  'payment_intents_without_orders' as rule_name,
  count(*) as violations
FROM payment_intents pi
LEFT JOIN orders o ON pi.order_id = o.id
WHERE pi.order_id IS NOT NULL AND o.id IS NULL;
")

echo "Business rule violations:"
echo "$BUSINESS_RULES"

# Step 5: Temporal consistency checks
echo "5. Temporal consistency validation..."

TEMPORAL_CHECKS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "
-- Check temporal consistency around recovery point
SELECT 
  'records_after_recovery_point' as check_name,
  count(*) as count
FROM (
  SELECT created_at FROM users WHERE created_at > '$RECOVERY_TIMESTAMP'
  UNION ALL
  SELECT created_at FROM events WHERE created_at > '$RECOVERY_TIMESTAMP'
  UNION ALL
  SELECT created_at FROM orders WHERE created_at > '$RECOVERY_TIMESTAMP'
) post_recovery

UNION ALL

SELECT
  'last_record_before_recovery' as check_name,
  extract(epoch from max(created_at)) as timestamp
FROM (
  SELECT created_at FROM users WHERE created_at <= '$RECOVERY_TIMESTAMP'
  UNION ALL
  SELECT created_at FROM events WHERE created_at <= '$RECOVERY_TIMESTAMP'
  UNION ALL
  SELECT created_at FROM orders WHERE created_at <= '$RECOVERY_TIMESTAMP'
) pre_recovery;
")

echo "Temporal consistency:"
echo "$TEMPORAL_CHECKS"

# Step 6: Index and performance validation
echo "6. Index and performance validation..."

INDEX_STATUS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$RECOVERY_DB_ENDPOINT" -U boleto_admin -d boleto_production -c "
-- Check critical indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'events', 'orders', 'sessions')
ORDER BY tablename, indexname;
")

echo "Critical indexes status:"
echo "$INDEX_STATUS"

# Step 7: Generate validation report
echo "7. Generating validation report..."

VALIDATION_SUMMARY=$(cat << EOF
===========================================
DATA INTEGRITY VALIDATION REPORT
===========================================

Database: $RECOVERY_DB_ENDPOINT
Recovery Timestamp: $RECOVERY_TIMESTAMP
Validation Time: $(date)

SUMMARY:
- Table Integrity: $(echo "$TABLE_INTEGRITY" | wc -l) tables validated
- Foreign Key Violations: $(echo "$FK_VIOLATIONS" | grep -v "0$" | wc -l) types found
- Consistency Violations: $(echo "$CONSISTENCY_CHECKS" | grep -v "0$" | wc -l) types found  
- Business Rule Violations: $(echo "$BUSINESS_RULES" | grep -v "0$" | wc -l) types found
- Temporal Issues: $(echo "$TEMPORAL_CHECKS" | grep "records_after_recovery_point" | awk '{print $3}') records after recovery point
- Index Status: $(echo "$INDEX_STATUS" | wc -l) indexes validated

RECOMMENDATION: 
$(if [ "$(echo "$FK_VIOLATIONS $CONSISTENCY_CHECKS $BUSINESS_RULES" | grep -v "0$" | wc -l)" -eq 0 ]; then
  echo "✅ Data integrity validation PASSED - Safe to proceed with cutover"
else
  echo "⚠️ Data integrity issues found - Review violations before proceeding"
fi)

Validated by: $(whoami)
EOF
)

echo "$VALIDATION_SUMMARY"

# Save report
echo "$VALIDATION_SUMMARY" > "/var/log/boleto/data-integrity-$(date +%Y%m%d-%H%M%S).log"

# Return validation result
VIOLATION_COUNT=$(echo "$FK_VIOLATIONS $CONSISTENCY_CHECKS $BUSINESS_RULES" | grep -v "0$" | wc -l)
if [ "$VIOLATION_COUNT" -eq 0 ]; then
  echo "✅ DATA INTEGRITY VALIDATION PASSED"
  exit 0
else
  echo "❌ DATA INTEGRITY VALIDATION FAILED ($VIOLATION_COUNT violation types)"
  exit 1
fi
```

## Testing and Validation

### Disaster Recovery Testing Schedule

```bash
#!/bin/bash
# Automated DR testing orchestration

TEST_TYPE="$1"  # monthly, quarterly, annual
TEST_DATE=$(date +%Y-%m-%d)

case $TEST_TYPE in
  "monthly")
    echo "🗓️ Monthly DR Test - Database Failover"
    
    # Test RDS Multi-AZ failover
    ./test-rds-failover.sh
    
    # Test ECS service redistribution
    ./test-ecs-failover.sh
    
    # Test Redis failover
    ./test-redis-failover.sh
    ;;
    
  "quarterly") 
    echo "🗓️ Quarterly DR Test - Cross-Region"
    
    # Deploy to DR region
    ./test-cross-region-deployment.sh us-west-2
    
    # Test DNS failover
    ./test-dns-failover.sh
    
    # Full application testing in DR
    ./test-dr-application-functionality.sh
    ;;
    
  "annual")
    echo "🗓️ Annual DR Test - Full Disaster Simulation"
    
    # Simulate complete primary region failure
    ./simulate-regional-disaster.sh
    
    # Execute full DR procedures
    ./execute-full-dr-procedures.sh
    
    # Business continuity validation
    ./validate-business-continuity.sh
    ;;
esac

# Record test results
TEST_RESULT_FILE="/var/log/boleto/dr-test-results-$TEST_DATE.log"
echo "DR test completed: $TEST_TYPE on $TEST_DATE" >> "$TEST_RESULT_FILE"

# Generate test report
./generate-dr-test-report.sh "$TEST_TYPE" "$TEST_DATE"
```

This disaster recovery runbook provides comprehensive procedures for handling various disaster scenarios with the Boleto system, ensuring minimal downtime and data loss while maintaining business continuity throughout recovery operations.