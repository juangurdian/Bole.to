# Daily Operations Runbook for Boleto Production System

## Overview

This runbook covers daily operational procedures, health monitoring, performance optimization, and troubleshooting for the Boleto event ticketing platform in production.

## System Architecture Overview

**Core Services:**
- **Gateway Service**: OAuth JWT issuer with RS256, session management
- **Hi.Events Backend**: Event management, payments, QR validation
- **PostgreSQL**: Primary database with Multi-AZ setup
- **ElastiCache Redis**: Session storage and caching layer
- **AWS Infrastructure**: ECS Fargate, ALB, CloudFront, RDS

## Daily Operations Checklist

### Morning Health Check (8:00 AM)

```bash
#!/bin/bash
# Daily morning health check script

echo "🌅 Starting daily health check - $(date)"

# Check overall system health
echo "1. Checking ECS services..."
aws ecs describe-services \
  --cluster boleto-production \
  --services gateway-service hi-events-service \
  --query 'services[].{Service:serviceName,Running:runningCount,Desired:desiredCount,Status:status}' \
  --output table

# Check database health
echo "2. Checking database health..."
DB_HOST=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.host')

DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id boleto-production-db \
  --query 'SecretString' --output text | jq -r '.password')

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  'Active Connections' as metric,
  count(*) as value
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size('boleto_production')) as value;
"

# Check Redis health
echo "3. Checking Redis health..."
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id boleto-production-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

redis-cli -h "$REDIS_ENDPOINT" -p 6379 ping

# Check SSL certificates
echo "4. Checking SSL certificate expiration..."
echo | openssl s_client -servername api.bole.to -connect api.bole.to:443 2>/dev/null | \
  openssl x509 -noout -dates

# Check load balancer health
echo "5. Checking load balancer target health..."
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names boleto-gateway-targets \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text) \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,Health:TargetHealth.State}' \
  --output table

echo "✅ Morning health check completed"
```

### Application Health Monitoring

#### JWT Service Health Check

```bash
#!/bin/bash
# Monitor JWT service health and performance

echo "🔐 Checking JWT service health..."

# Test JWT token generation
JWT_TEST=$(curl -s -X POST "https://api.bole.to/auth/test/generate-token" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"health-check","account_id":"system"}' \
  -w "%{http_code}")

if [[ "$JWT_TEST" =~ 200 ]]; then
  echo "✅ JWT token generation functional"
else
  echo "❌ JWT token generation failed: $JWT_TEST"
  # Alert operations team
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:operations-alerts \
    --message "JWT service health check failed"
fi

# Test JWKS endpoint
JWKS_RESPONSE=$(curl -s "https://api.bole.to/.well-known/jwks.json")
JWKS_KEYS=$(echo "$JWKS_RESPONSE" | jq '.keys | length')

if [ "$JWKS_KEYS" -gt 0 ]; then
  echo "✅ JWKS endpoint serving $JWKS_KEYS keys"
else
  echo "❌ JWKS endpoint not functional"
fi

# Check key rotation status
KEY_AGE=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 GET "jwt:key:created" 2>/dev/null)
if [ -n "$KEY_AGE" ]; then
  DAYS_OLD=$(( ($(date +%s) - $KEY_AGE) / 86400 ))
  if [ "$DAYS_OLD" -gt 30 ]; then
    echo "⚠️ JWT keys are $DAYS_OLD days old - rotation recommended"
  else
    echo "✅ JWT keys are $DAYS_OLD days old"
  fi
fi
```

#### Session Management Health

```bash
#!/bin/bash
# Monitor session management and Redis health

echo "🔄 Checking session management..."

# Check Redis connectivity and performance
REDIS_PING=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 ping)
if [ "$REDIS_PING" = "PONG" ]; then
  echo "✅ Redis connectivity OK"
else
  echo "❌ Redis connectivity failed"
fi

# Check Redis memory usage
REDIS_MEMORY=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
echo "Redis memory usage: $REDIS_MEMORY"

# Check active sessions count
ACTIVE_SESSIONS=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
  local count = 0
  for _, key in ipairs(redis.call('keys', 'session:*')) do
    count = count + 1
  end
  return count
" 0)

echo "Active sessions: $ACTIVE_SESSIONS"

# Check session cleanup
OLD_SESSIONS=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
  local count = 0
  local cutoff = ARGV[1]
  for _, key in ipairs(redis.call('keys', 'session:*')) do
    local ttl = redis.call('ttl', key)
    if ttl > 0 and ttl < cutoff then
      count = count + 1
    end
  end
  return count
" 0 3600)  # Sessions expiring in next hour

echo "Sessions expiring soon: $OLD_SESSIONS"
```

#### Payment System Monitoring

```bash
#!/bin/bash
# Monitor payment processing health

echo "💳 Checking payment system health..."

# Check Stripe API connectivity
STRIPE_STATUS=$(curl -s "https://status.stripe.com/api/v2/status.json" | jq -r '.status.indicator')
echo "Stripe API status: $STRIPE_STATUS"

# Check recent payment success rate from database
PAYMENT_STATS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -t -c "
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate
FROM payment_intents 
WHERE created_at >= NOW() - INTERVAL '1 hour';
")

echo "Last hour payment statistics: $PAYMENT_STATS"

# Check webhook endpoint health
WEBHOOK_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://api.bole.to/api/webhooks/stripe/health")
if [ "$WEBHOOK_HEALTH" = "200" ]; then
  echo "✅ Stripe webhook endpoint healthy"
else
  echo "❌ Stripe webhook endpoint unhealthy: $WEBHOOK_HEALTH"
fi
```

### Performance Monitoring

#### Response Time Monitoring

```bash
#!/bin/bash
# Monitor API response times and performance metrics

echo "📊 Checking performance metrics..."

# Check average response time over last hour
AVG_RESPONSE_TIME=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

if [ "$AVG_RESPONSE_TIME" != "None" ]; then
  echo "Average response time (1h): ${AVG_RESPONSE_TIME}s"
  
  # Alert if response time exceeds SLA
  if (( $(echo "$AVG_RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "⚠️ Response time exceeds SLA (2.0s)"
    aws sns publish \
      --topic-arn arn:aws:sns:us-east-1:ACCOUNT:performance-alerts \
      --message "High response time: ${AVG_RESPONSE_TIME}s"
  fi
else
  echo "No response time data available"
fi

# Check throughput
REQUEST_COUNT=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$REQUEST_COUNT" != "None" ]; then
  echo "Requests per hour: $REQUEST_COUNT"
fi

# Check error rates
ERROR_4XX=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_4XX_Count \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

ERROR_5XX=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

if [ "$ERROR_4XX" != "None" ]; then
  echo "4XX errors (1h): $ERROR_4XX"
fi

if [ "$ERROR_5XX" != "None" ]; then
  echo "5XX errors (1h): $ERROR_5XX"
  
  # Alert on 5XX errors
  if [ "$ERROR_5XX" -gt 10 ]; then
    echo "⚠️ High 5XX error count: $ERROR_5XX"
    aws sns publish \
      --topic-arn arn:aws:sns:us-east-1:ACCOUNT:error-alerts \
      --message "High 5XX error count: $ERROR_5XX in last hour"
  fi
fi
```

#### Resource Utilization Monitoring

```bash
#!/bin/bash
# Monitor resource utilization across services

echo "🖥️ Checking resource utilization..."

# Check ECS service CPU and Memory utilization
for SERVICE in gateway-service hi-events-service; do
  echo "Checking $SERVICE resources..."
  
  CPU_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value="$SERVICE" Name=ClusterName,Value=boleto-production \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)
  
  MEMORY_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name MemoryUtilization \
    --dimensions Name=ServiceName,Value="$SERVICE" Name=ClusterName,Value=boleto-production \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)
  
  if [ "$CPU_UTIL" != "None" ]; then
    echo "$SERVICE CPU: ${CPU_UTIL}%"
    if (( $(echo "$CPU_UTIL > 80" | bc -l) )); then
      echo "⚠️ High CPU usage: ${CPU_UTIL}%"
    fi
  fi
  
  if [ "$MEMORY_UTIL" != "None" ]; then
    echo "$SERVICE Memory: ${MEMORY_UTIL}%"
    if (( $(echo "$MEMORY_UTIL > 80" | bc -l) )); then
      echo "⚠️ High memory usage: ${MEMORY_UTIL}%"
    fi
  fi
done

# Check RDS CPU and connections
RDS_CPU=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=boleto-production-rds \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

RDS_CONNECTIONS=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=boleto-production-rds \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

if [ "$RDS_CPU" != "None" ]; then
  echo "RDS CPU: ${RDS_CPU}%"
fi

if [ "$RDS_CONNECTIONS" != "None" ]; then
  echo "RDS Connections: ${RDS_CONNECTIONS}"
  if (( $(echo "$RDS_CONNECTIONS > 80" | bc -l) )); then
    echo "⚠️ High database connection count: ${RDS_CONNECTIONS}"
  fi
fi
```

### Log Analysis and Troubleshooting

#### Application Log Analysis

```bash
#!/bin/bash
# Analyze application logs for issues

echo "📋 Analyzing application logs..."

# Check for errors in Gateway service logs
echo "Gateway service errors (last hour):"
aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'events[0:10].[timestamp,message]' \
  --output table

# Check for errors in Hi.Events service logs
echo "Hi.Events service errors (last hour):"
aws logs filter-log-events \
  --log-group-name "/ecs/hi-events-service" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'events[0:10].[timestamp,message]' \
  --output table

# Check for authentication failures
echo "Authentication failures (last hour):"
aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "authentication failed OR invalid token" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'events[0:5].[timestamp,message]' \
  --output table

# Check for payment processing errors
echo "Payment processing errors (last hour):"
aws logs filter-log-events \
  --log-group-name "/ecs/hi-events-service" \
  --filter-pattern "payment failed OR stripe error" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'events[0:5].[timestamp,message]' \
  --output table

# Analyze error patterns
ERROR_PATTERNS=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '24 hours ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'length(events)')

echo "Total error count (24h): $ERROR_PATTERNS"
```

#### Database Performance Analysis

```bash
#!/bin/bash
# Analyze database performance and identify issues

echo "🗄️ Analyzing database performance..."

# Check slow queries
SLOW_QUERIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries over 1 second
ORDER BY mean_time DESC 
LIMIT 5;
")

echo "Slow queries (>1s average):"
echo "$SLOW_QUERIES"

# Check lock waits
LOCK_WAITS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.DATABASE = blocked_locks.DATABASE
  AND blocking_locks.relation = blocked_locks.relation
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED
LIMIT 5;
")

if [ -n "$LOCK_WAITS" ]; then
  echo "Current lock waits:"
  echo "$LOCK_WAITS"
fi

# Check database size growth
DB_SIZE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -t -c "
SELECT pg_size_pretty(pg_database_size('boleto_production'));
")

echo "Database size: $DB_SIZE"

# Check table sizes
TABLE_SIZES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
")

echo "Largest tables:"
echo "$TABLE_SIZES"
```

### Automated Maintenance Tasks

#### Daily Cleanup Operations

```bash
#!/bin/bash
# Daily automated cleanup tasks

echo "🧹 Running daily cleanup tasks..."

# Clean expired sessions from Redis
EXPIRED_SESSIONS=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 eval "
  local expired = {}
  for _, key in ipairs(redis.call('keys', 'session:*')) do
    local ttl = redis.call('ttl', key)
    if ttl == -1 then  -- Keys without expiration
      table.insert(expired, key)
    elseif ttl <= 0 then  -- Expired keys
      table.insert(expired, key)
    end
  end
  
  for _, key in ipairs(expired) do
    redis.call('del', key)
  end
  
  return #expired
" 0)

echo "Cleaned $EXPIRED_SESSIONS expired sessions from Redis"

# Clean old log files from CloudWatch (keep 30 days)
aws logs put-retention-policy \
  --log-group-name "/ecs/gateway-service" \
  --retention-in-days 30

aws logs put-retention-policy \
  --log-group-name "/ecs/hi-events-service" \
  --retention-in-days 30

# Clean database statistics
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
-- Clean old password reset tokens
DELETE FROM password_resets WHERE created_at < NOW() - INTERVAL '24 hours';

-- Clean old sessions (older than 30 days)
DELETE FROM sessions WHERE updated_at < NOW() - INTERVAL '30 days';

-- Update table statistics
ANALYZE;
"

echo "✅ Daily cleanup completed"
```

#### Performance Optimization Tasks

```bash
#!/bin/bash
# Weekly performance optimization tasks

echo "⚡ Running performance optimization tasks..."

# Vacuum and reindex database (run during low traffic)
if [ "$(date +%H)" -lt 6 ]; then  # Run only between midnight and 6 AM
  echo "Running database maintenance..."
  
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
  -- Vacuum critical tables
  VACUUM ANALYZE users;
  VACUUM ANALYZE events;
  VACUUM ANALYZE sessions;
  VACUUM ANALYZE orders;
  VACUUM ANALYZE payment_intents;
  
  -- Reindex if needed
  REINDEX INDEX CONCURRENTLY idx_sessions_user_id;
  REINDEX INDEX CONCURRENTLY idx_events_start_date;
  REINDEX INDEX CONCURRENTLY idx_orders_created_at;
  "
  
  echo "✅ Database maintenance completed"
else
  echo "Skipping database maintenance (not in maintenance window)"
fi

# Optimize Redis memory usage
redis-cli -h "$REDIS_ENDPOINT" -p 6379 MEMORY PURGE
echo "✅ Redis memory optimized"

# Clear CloudFront cache for updated static assets
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/static/css/*" "/static/js/*"
  
  echo "✅ CloudFront cache cleared for static assets"
fi
```

### Scaling Operations

#### Auto Scaling Monitoring

```bash
#!/bin/bash
# Monitor and manage auto scaling

echo "📈 Checking auto scaling status..."

# Check ECS service scaling events
for SERVICE in gateway-service hi-events-service; do
  echo "Scaling events for $SERVICE:"
  
  aws ecs describe-services \
    --cluster boleto-production \
    --services "$SERVICE" \
    --query 'services[0].events[0:3]' \
    --output table
  
  # Check if scaling is needed based on metrics
  CURRENT_TASKS=$(aws ecs describe-services \
    --cluster boleto-production \
    --services "$SERVICE" \
    --query 'services[0].runningCount' \
    --output text)
  
  CPU_UTIL=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value="$SERVICE" Name=ClusterName,Value=boleto-production \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 600 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)
  
  echo "$SERVICE: $CURRENT_TASKS tasks, CPU: ${CPU_UTIL}%"
  
  # Manual scaling recommendations
  if [ "$CPU_UTIL" != "None" ] && (( $(echo "$CPU_UTIL > 70" | bc -l) )); then
    echo "⚠️ Consider scaling up $SERVICE (CPU: ${CPU_UTIL}%)"
  elif [ "$CPU_UTIL" != "None" ] && (( $(echo "$CPU_UTIL < 20" | bc -l) )) && [ "$CURRENT_TASKS" -gt 2 ]; then
    echo "💡 Consider scaling down $SERVICE (CPU: ${CPU_UTIL}%)"
  fi
done

# Check RDS scaling recommendations
RDS_CPU=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=boleto-production-rds \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --query 'Datapoints[0].Average' \
  --output text)

if [ "$RDS_CPU" != "None" ] && (( $(echo "$RDS_CPU > 80" | bc -l) )); then
  echo "⚠️ Consider scaling RDS instance (CPU: ${RDS_CPU}%)"
fi
```

#### Manual Scaling Procedures

```bash
#!/bin/bash
# Manual scaling procedures

OPERATION="$1"
SERVICE="$2"
DESIRED_COUNT="$3"

case $OPERATION in
  "scale-up")
    if [ -z "$SERVICE" ] || [ -z "$DESIRED_COUNT" ]; then
      echo "Usage: $0 scale-up <service-name> <desired-count>"
      exit 1
    fi
    
    echo "Scaling up $SERVICE to $DESIRED_COUNT tasks..."
    aws ecs update-service \
      --cluster boleto-production \
      --service "$SERVICE" \
      --desired-count "$DESIRED_COUNT"
    
    # Wait for scaling to complete
    aws ecs wait services-stable \
      --cluster boleto-production \
      --services "$SERVICE"
    
    echo "✅ $SERVICE scaled to $DESIRED_COUNT tasks"
    ;;
    
  "scale-down")
    if [ -z "$SERVICE" ] || [ -z "$DESIRED_COUNT" ]; then
      echo "Usage: $0 scale-down <service-name> <desired-count>"
      exit 1
    fi
    
    echo "Scaling down $SERVICE to $DESIRED_COUNT tasks..."
    aws ecs update-service \
      --cluster boleto-production \
      --service "$SERVICE" \
      --desired-count "$DESIRED_COUNT"
    
    echo "✅ $SERVICE scaled to $DESIRED_COUNT tasks"
    ;;
    
  "auto-scale-enable")
    echo "Enabling auto scaling for ECS services..."
    
    # Register scalable targets
    aws application-autoscaling register-scalable-target \
      --service-namespace ecs \
      --scalable-dimension ecs:service:DesiredCount \
      --resource-id service/boleto-production/gateway-service \
      --min-capacity 2 \
      --max-capacity 10
    
    # Create scaling policies
    aws application-autoscaling put-scaling-policy \
      --service-namespace ecs \
      --scalable-dimension ecs:service:DesiredCount \
      --resource-id service/boleto-production/gateway-service \
      --policy-name gateway-scale-up-policy \
      --policy-type TargetTrackingScaling \
      --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleOutCooldown": 300,
        "ScaleInCooldown": 600
      }'
    
    echo "✅ Auto scaling enabled"
    ;;
    
  *)
    echo "Usage: $0 {scale-up|scale-down|auto-scale-enable} [service] [count]"
    exit 1
    ;;
esac
```

### Security Monitoring

#### Daily Security Checks

```bash
#!/bin/bash
# Daily security monitoring checks

echo "🔒 Running security checks..."

# Check for failed authentication attempts
AUTH_FAILURES=$(aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "authentication failed OR invalid credentials" \
  --start-time $(date -d '24 hours ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'length(events)')

echo "Authentication failures (24h): $AUTH_FAILURES"

if [ "$AUTH_FAILURES" -gt 100 ]; then
  echo "⚠️ High number of authentication failures"
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-alerts \
    --message "High authentication failure count: $AUTH_FAILURES in last 24 hours"
fi

# Check for suspicious IP patterns
SUSPICIOUS_IPS=$(aws logs filter-log-events \
  --log-group-name "/aws/applicationloadbalancer/boleto-production-alb" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --end-time $(date +%s)000 | \
  jq -r '.events[].message' | \
  awk '{print $3}' | \
  sort | uniq -c | sort -nr | head -10)

echo "Top IP addresses (1h):"
echo "$SUSPICIOUS_IPS"

# Check SSL certificate expiration
CERT_EXPIRY=$(echo | openssl s_client -servername api.bole.to -connect api.bole.to:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)

CERT_EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($CERT_EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

echo "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"

if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
  echo "⚠️ SSL certificate expiring soon"
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:security-alerts \
    --message "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

# Check for security group changes
RECENT_SG_CHANGES=$(aws ec2 describe-security-groups \
  --filters "Name=tag:Environment,Values=production" \
  --query 'SecurityGroups[?length(IpPermissions[?contains(IpRanges[].CidrIp, `0.0.0.0/0`)]) > `0`]' \
  --output table)

if [ -n "$RECENT_SG_CHANGES" ]; then
  echo "⚠️ Security groups with 0.0.0.0/0 access found:"
  echo "$RECENT_SG_CHANGES"
fi

echo "✅ Security checks completed"
```

### Backup Monitoring

#### Daily Backup Verification

```bash
#!/bin/bash
# Verify daily backups are successful

echo "💾 Verifying backup health..."

# Check RDS automated backups
LATEST_BACKUP=$(aws rds describe-db-snapshots \
  --db-instance-identifier boleto-production-rds \
  --snapshot-type automated \
  --query 'DBSnapshots[0].{SnapshotId:DBSnapshotIdentifier,Status:Status,Created:SnapshotCreateTime}' \
  --output table)

echo "Latest RDS backup:"
echo "$LATEST_BACKUP"

# Check backup age
BACKUP_TIME=$(aws rds describe-db-snapshots \
  --db-instance-identifier boleto-production-rds \
  --snapshot-type automated \
  --query 'DBSnapshots[0].SnapshotCreateTime' \
  --output text)

BACKUP_TIMESTAMP=$(date -d "$BACKUP_TIME" +%s)
CURRENT_TIMESTAMP=$(date +%s)
BACKUP_AGE_HOURS=$(( ($CURRENT_TIMESTAMP - $BACKUP_TIMESTAMP) / 3600 ))

echo "Latest backup age: $BACKUP_AGE_HOURS hours"

if [ "$BACKUP_AGE_HOURS" -gt 26 ]; then
  echo "⚠️ Backup is older than 26 hours"
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT:backup-alerts \
    --message "RDS backup is $BACKUP_AGE_HOURS hours old"
fi

# Check ElastiCache snapshots
REDIS_SNAPSHOTS=$(aws elasticache describe-snapshots \
  --cache-cluster-id boleto-production-redis \
  --query 'Snapshots[0].{SnapshotName:SnapshotName,Status:SnapshotStatus,Created:NodeSnapshots[0].SnapshotCreateTime}' \
  --output table)

echo "Latest Redis snapshot:"
echo "$REDIS_SNAPSHOTS"

# Test backup restoration capability (monthly)
if [ "$(date +%d)" = "01" ]; then
  echo "Running monthly backup restoration test..."
  ./test-backup-restoration.sh
fi

echo "✅ Backup verification completed"
```

## Troubleshooting Guide

### Common Issues and Resolutions

#### High Response Times

```bash
#!/bin/bash
# Troubleshoot high response times

echo "🐌 Investigating high response times..."

# Check load balancer metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=boleto-production-alb \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --output table

# Check database query performance
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"

# Check for long-running queries
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c "
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';
"

# Recommendations
echo "Troubleshooting recommendations:"
echo "1. Scale up ECS services if CPU/memory high"
echo "2. Optimize slow database queries"
echo "3. Check for database locks"
echo "4. Verify Redis cache hit rate"
echo "5. Consider CloudFront cache optimization"
```

#### Authentication Issues

```bash
#!/bin/bash
# Troubleshoot authentication problems

echo "🔐 Investigating authentication issues..."

# Check JWT key health
JWT_HEALTH=$(curl -s "https://api.bole.to/.well-known/jwks.json" | jq '.keys | length')
echo "JWKS endpoint serving $JWT_HEALTH keys"

# Check Redis connectivity for sessions
REDIS_HEALTH=$(redis-cli -h "$REDIS_ENDPOINT" -p 6379 ping)
echo "Redis health: $REDIS_HEALTH"

# Check recent authentication errors
aws logs filter-log-events \
  --log-group-name "/ecs/gateway-service" \
  --filter-pattern "authentication failed OR token expired OR invalid token" \
  --start-time $(date -d '30 minutes ago' +%s)000 \
  --end-time $(date +%s)000 \
  --query 'events[0:5].[timestamp,message]' \
  --output table

# Test OAuth providers
echo "Testing OAuth providers..."
for PROVIDER in google apple; do
  OAUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://api.bole.to/auth/oauth/$PROVIDER" \
    -H "Content-Type: application/json" \
    -d '{"redirect_uri":"com.boleto.app://oauth/callback"}')
  
  echo "$PROVIDER OAuth endpoint: HTTP $OAUTH_TEST"
done

echo "Authentication troubleshooting completed"
```

### Emergency Contact Information

```bash
# Emergency contact script
cat << EOF
🚨 EMERGENCY CONTACTS

Critical Issues (P0):
- On-call Engineer: +1-XXX-XXX-XXXX
- Engineering Manager: +1-XXX-XXX-XXXX
- CTO: +1-XXX-XXX-XXXX

Services:
- AWS Support: 1-206-266-4064 (Premium Support)
- Stripe Support: https://support.stripe.com
- PagerDuty: Automatic escalation configured

Communication Channels:
- Slack: #incidents
- Email: devops@bole.to
- Status Page: https://status.bole.to

AWS Account ID: $(aws sts get-caller-identity --query Account --output text)
Region: us-east-1
Environment: Production
EOF
```

This operations runbook provides comprehensive daily operational procedures and monitoring for the Boleto production system, with emphasis on proactive monitoring, performance optimization, and rapid issue resolution.