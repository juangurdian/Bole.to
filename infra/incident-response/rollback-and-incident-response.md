# Rollback and Incident Response Procedures for Bole.to Production

## Overview

This document provides comprehensive procedures for handling incidents and performing rollbacks in the Bole.to production environment, ensuring rapid response and minimal service disruption.

## Incident Classification and Severity Levels

### Severity Levels

| Level | Description | Response Time | Escalation | Examples |
|-------|-------------|---------------|------------|----------|
| **P0 - Critical** | Complete service outage | Immediate (< 5 min) | CTO, Engineering Manager | API down, database unavailable |
| **P1 - High** | Major functionality impaired | 30 minutes | Engineering Manager | Authentication failing, payment issues |
| **P2 - Medium** | Minor functionality impacted | 2 hours | Team Lead | Performance degradation, non-critical features |
| **P3 - Low** | Cosmetic issues, future impact | Next business day | Individual contributor | UI glitches, documentation errors |

### Incident Types

```yaml
Service Outages:
  - Complete API unavailability
  - Database connection failures
  - Authentication system down
  - Payment processing failures

Performance Issues:
  - High response times (> 5s)
  - Database query timeouts
  - Memory/CPU exhaustion
  - Rate limiting triggered

Security Incidents:
  - Unauthorized access attempts
  - Data breach suspicion
  - Certificate expiration
  - Suspicious traffic patterns

Data Issues:
  - Data corruption detected
  - Backup failures
  - Inconsistent data states
  - Migration problems
```

## Immediate Response Procedures

### Incident Detection

#### Automated Detection

```yaml
Detection Methods:
  CloudWatch Alarms:
    - High error rate (> 5% 5xx responses)
    - Response time degradation (P95 > 2s)
    - Database connection failures
    - Memory/CPU threshold breaches
    
  Health Check Failures:
    - Load balancer health checks
    - External monitoring (Pingdom/StatusCake)
    - Application health endpoints
    
  Log-based Alerts:
    - Error log patterns
    - Authentication failure spikes
    - Database error patterns
    - Application crash logs
```

#### Manual Detection

```yaml
User Reports:
  - Customer support tickets
  - Social media mentions
  - Direct user feedback
  - Mobile app crash reports
  
Internal Discovery:
  - Team member observations
  - Routine system checks
  - Development/testing activities
  - Third-party service notifications
```

### Initial Response (First 5 Minutes)

#### Step 1: Acknowledge and Assess

```bash
#!/bin/bash
# Incident response initial assessment script

INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"
SEVERITY=""
IMPACT=""

echo "=== INCIDENT RESPONSE - INITIAL ASSESSMENT ==="
echo "Incident ID: $INCIDENT_ID"
echo "Started at: $(date)"
echo "Responder: $(whoami)"

# Quick system status check
echo -e "\n=== SYSTEM STATUS ==="
curl -s https://api.bole.to/healthz || echo "Health check FAILED"
aws ecs describe-services \
  --cluster boleto-production \
  --services gateway-service hievents-service \
  --query 'services[*].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'

# Check recent deployments
echo -e "\n=== RECENT DEPLOYMENTS ==="
aws ecs list-tasks \
  --cluster boleto-production \
  --query 'taskArns[0:5]' \
  --output table

# Log to incident tracking
echo "$INCIDENT_ID,$(date),STARTED,$SEVERITY,$IMPACT,$(whoami)" >> /var/log/incidents.csv
```

#### Step 2: Immediate Stabilization

```yaml
Quick Wins:
  1. Scale up services if resource constrained
  2. Restart failing containers
  3. Clear problematic cache entries
  4. Activate maintenance mode if necessary
  5. Implement emergency rate limiting
```

```bash
# Emergency service scaling
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --desired-count 6

# Restart services if unhealthy
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --force-new-deployment
```

## Rollback Procedures

### Application Rollback

#### ECS Service Rollback

```bash
#!/bin/bash
# ECS service rollback script

SERVICE_NAME="${1:-gateway-service}"
CLUSTER_NAME="boleto-production"
ROLLBACK_REVISION="${2:-previous}"

echo "Rolling back $SERVICE_NAME to $ROLLBACK_REVISION revision..."

# Get current task definition
CURRENT_TD=$(aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Current task definition: $CURRENT_TD"

# Get previous task definition
if [[ "$ROLLBACK_REVISION" == "previous" ]]; then
  PREVIOUS_TD=$(aws ecs list-task-definitions \
    --family-prefix "${SERVICE_NAME}" \
    --status ACTIVE \
    --sort DESC \
    --query 'taskDefinitionArns[1]' \
    --output text)
else
  PREVIOUS_TD="$ROLLBACK_REVISION"
fi

echo "Rolling back to: $PREVIOUS_TD"

# Perform rollback
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --task-definition "$PREVIOUS_TD"

# Wait for deployment
echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME"

# Verify rollback
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.bole.to/healthz)
if [[ "$HEALTH_CHECK" == "200" ]]; then
  echo "✅ Rollback successful - health check passed"
else
  echo "❌ Rollback may have issues - health check failed ($HEALTH_CHECK)"
fi

# Log rollback action
echo "ROLLBACK,$SERVICE_NAME,$CURRENT_TD,$PREVIOUS_TD,$(date)" >> /var/log/rollbacks.csv
```

#### Database Rollback

```bash
#!/bin/bash
# Database rollback procedures

ROLLBACK_TYPE="${1:-snapshot}"  # snapshot or point-in-time
RESTORE_POINT="${2:-latest}"

case $ROLLBACK_TYPE in
  "snapshot")
    echo "Rolling back database from snapshot..."
    
    # Get latest snapshot
    if [[ "$RESTORE_POINT" == "latest" ]]; then
      SNAPSHOT_ID=$(aws rds describe-db-snapshots \
        --db-instance-identifier boleto-production-rds \
        --snapshot-type manual \
        --query 'DBSnapshots[0].DBSnapshotIdentifier' \
        --output text)
    else
      SNAPSHOT_ID="$RESTORE_POINT"
    fi
    
    echo "Restoring from snapshot: $SNAPSHOT_ID"
    
    # Create new instance from snapshot
    aws rds restore-db-instance-from-db-snapshot \
      --db-instance-identifier boleto-production-rds-rollback \
      --db-snapshot-identifier "$SNAPSHOT_ID"
    ;;
    
  "point-in-time")
    echo "Rolling back database to point in time: $RESTORE_POINT"
    
    aws rds restore-db-instance-to-point-in-time \
      --source-db-instance-identifier boleto-production-rds \
      --target-db-instance-identifier boleto-production-rds-rollback \
      --restore-time "$RESTORE_POINT"
    ;;
esac

echo "⚠️  Database rollback initiated. Manual DNS update required."
echo "⚠️  Estimated completion time: 10-20 minutes"
```

### Infrastructure Rollback

#### Terraform State Rollback

```bash
#!/bin/bash
# Terraform infrastructure rollback

WORKSPACE="${1:-production}"
ROLLBACK_STATE_VERSION="${2:-previous}"

cd /path/to/terraform

# Backup current state
cp terraform.tfstate "terraform.tfstate.backup.$(date +%s)"

# Download previous state version
if [[ "$ROLLBACK_STATE_VERSION" == "previous" ]]; then
  aws s3api list-object-versions \
    --bucket boleto-terraform-state \
    --prefix "$WORKSPACE/terraform.tfstate" \
    --query 'Versions[1].VersionId' \
    --output text > /tmp/version_id
  VERSION_ID=$(cat /tmp/version_id)
else
  VERSION_ID="$ROLLBACK_STATE_VERSION"
fi

# Download and apply previous state
aws s3api get-object \
  --bucket boleto-terraform-state \
  --key "$WORKSPACE/terraform.tfstate" \
  --version-id "$VERSION_ID" \
  terraform.tfstate.rollback

# Apply the rollback state
terraform apply -state=terraform.tfstate.rollback -auto-approve

echo "Infrastructure rollback completed"
```

## Incident Response Workflows

### P0 - Critical Incident Response

```yaml
Timeline: Immediate Response (0-5 minutes)
Actions:
  1. Page on-call engineer immediately
  2. Open incident war room (Slack/Teams)
  3. Assess impact and scope
  4. Activate emergency response team
  5. Begin immediate mitigation
  
Timeline: Short-term Response (5-30 minutes)
Actions:
  1. Implement emergency fixes or rollback
  2. Update status page
  3. Notify stakeholders
  4. Begin detailed investigation
  5. Escalate if not resolved
  
Timeline: Resolution (30-120 minutes)
Actions:
  1. Implement permanent fix
  2. Verify system stability
  3. Communicate resolution
  4. Begin post-incident review
```

### P1 - High Priority Incident Response

```yaml
Timeline: Initial Response (0-30 minutes)
Actions:
  1. Notify on-call engineer
  2. Create incident ticket
  3. Begin impact assessment
  4. Start investigation
  
Timeline: Investigation (30-120 minutes)
Actions:
  1. Identify root cause
  2. Develop remediation plan
  3. Implement fix or workaround
  4. Monitor for stability
  
Timeline: Resolution (2-8 hours)
Actions:
  1. Deploy permanent solution
  2. Verify complete resolution
  3. Update stakeholders
  4. Document lessons learned
```

## Communication Procedures

### Internal Communication

#### Slack Integration

```bash
# Automated incident notification
curl -X POST -H 'Content-type: application/json' \
  --data '{
    "text": "🚨 P0 INCIDENT DETECTED",
    "attachments": [
      {
        "color": "danger",
        "fields": [
          {"title": "Incident ID", "value": "'$INCIDENT_ID'", "short": true},
          {"title": "Severity", "value": "P0 - Critical", "short": true},
          {"title": "Impact", "value": "Complete service outage", "short": false},
          {"title": "Status", "value": "Investigating", "short": true}
        ]
      }
    ]
  }' \
  "$SLACK_WEBHOOK_URL"
```

#### Escalation Matrix

```yaml
P0 Critical:
  Immediate: On-call engineer
  +5 minutes: Engineering Manager
  +10 minutes: CTO
  +15 minutes: CEO, Customer Success
  +30 minutes: All hands notification

P1 High:
  Immediate: On-call engineer
  +30 minutes: Engineering Manager
  +60 minutes: CTO
  +2 hours: Customer Success

P2/P3:
  Standard business hours escalation
  Engineering Manager notification within 4 hours
```

### External Communication

#### Status Page Updates

```bash
# Automated status page update
curl -X POST "https://api.statuspage.io/v1/pages/$PAGE_ID/incidents" \
  -H "Authorization: OAuth $STATUS_PAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "API Response Time Degradation",
      "status": "investigating",
      "impact_override": "minor",
      "message": "We are investigating reports of slow API response times. Users may experience delays when loading events."
    }
  }'
```

#### Customer Communication Templates

```yaml
Initial Notification:
  Subject: "[Bole.to] Service Issue - Investigating"
  Message: |
    We are currently investigating an issue affecting [specific functionality].
    We will provide updates every 30 minutes until resolved.
    
    Estimated Impact: [description]
    Affected Users: [percentage/scope]
    ETA for Resolution: [timeframe]

Resolution Notification:
  Subject: "[Bole.to] Service Issue - Resolved"
  Message: |
    The service issue affecting [functionality] has been resolved.
    
    Root Cause: [brief explanation]
    Resolution Time: [duration]
    Prevention Measures: [what we're doing to prevent recurrence]
```

## Monitoring and Alerting During Incidents

### Enhanced Monitoring

```bash
#!/bin/bash
# Incident monitoring dashboard

echo "=== REAL-TIME INCIDENT MONITORING ==="
echo "Timestamp: $(date)"

# API Health
echo -e "\n📡 API HEALTH:"
for endpoint in "/healthz" "/auth/oauth/google/start" "/.well-known/jwks.json"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://api.bole.to$endpoint")
  echo "$endpoint: $status"
done

# Service Status
echo -e "\n🔧 SERVICE STATUS:"
aws ecs describe-services \
  --cluster boleto-production \
  --services gateway-service hievents-service \
  --query 'services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount,Status:status}' \
  --output table

# Database Status
echo -e "\n🗄️  DATABASE STATUS:"
aws rds describe-db-instances \
  --db-instance-identifier boleto-production-rds \
  --query 'DBInstances[0].{Status:DBInstanceStatus,MultiAZ:MultiAZ,Connections:DbInstanceStatus}' \
  --output table

# Recent Errors
echo -e "\n❌ RECENT ERRORS (last 10 minutes):"
aws logs filter-log-events \
  --log-group-name /ecs/boleto-production-gateway \
  --start-time $(date -d '10 minutes ago' +%s)000 \
  --filter-pattern "ERROR" \
  --query 'events[*].message' \
  --output text | head -5
```

### Incident-Specific Dashboards

```json
{
  "incident_dashboard": {
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count"],
            ["AWS/ApplicationELB", "TargetResponseTime"],
            ["AWS/ECS", "CPUUtilization"],
            ["AWS/ECS", "MemoryUtilization"]
          ],
          "period": 60,
          "stat": "Average",
          "region": "us-east-1",
          "title": "Real-time Incident Metrics"
        }
      }
    ]
  }
}
```

## Post-Incident Procedures

### Immediate Post-Resolution

```bash
#!/bin/bash
# Post-incident immediate actions

INCIDENT_ID="$1"
RESOLUTION_TIME="$(date)"

echo "=== POST-INCIDENT IMMEDIATE ACTIONS ==="
echo "Incident ID: $INCIDENT_ID"
echo "Resolution Time: $RESOLUTION_TIME"

# Verify complete resolution
echo -e "\n🔍 VERIFICATION CHECKS:"
./verify-deployment.sh --quick-check

# Update incident status
echo -e "\n📝 UPDATING INCIDENT STATUS:"
curl -X PATCH "https://api.statuspage.io/v1/pages/$PAGE_ID/incidents/$INCIDENT_ID" \
  -H "Authorization: OAuth $STATUS_PAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"incident": {"status": "resolved"}}'

# Send resolution notification
echo -e "\n📧 SENDING RESOLUTION NOTIFICATION:"
# Send internal Slack notification
# Send customer email notification
# Update status page

# Schedule post-incident review
echo -e "\n📅 SCHEDULING POST-INCIDENT REVIEW:"
echo "Post-incident review scheduled for: $(date -d '+1 day')"
```

### Post-Incident Review (PIR)

#### PIR Template

```yaml
Incident Information:
  ID: INC-YYYYMMDD-HHMMSS
  Severity: P0/P1/P2/P3
  Start Time: YYYY-MM-DD HH:MM:SS UTC
  End Time: YYYY-MM-DD HH:MM:SS UTC
  Duration: X hours Y minutes
  Impact: Description of user/business impact

Timeline:
  Detection: How and when was the incident first detected?
  Response: What were the immediate response actions?
  Investigation: Key investigation steps and findings
  Resolution: What fixed the issue?
  Recovery: How was service fully restored?

Root Cause Analysis:
  Primary Cause: The fundamental reason the incident occurred
  Contributing Factors: Other factors that made the incident worse
  Prevention Gaps: What could have prevented this incident?

Impact Assessment:
  Users Affected: Number/percentage of users impacted
  Business Impact: Revenue, reputation, or operational impact
  SLA Impact: Did this breach our SLA commitments?

Action Items:
  Immediate (< 1 week):
    - [ ] Fix immediate technical gaps
    - [ ] Update runbooks/documentation
    - [ ] Improve monitoring/alerting
  
  Short-term (< 1 month):
    - [ ] Implement preventive measures
    - [ ] Process improvements
    - [ ] Tool/infrastructure updates
  
  Long-term (< 3 months):
    - [ ] Architectural improvements
    - [ ] Team training/capability building
    - [ ] Strategic technology decisions
```

### Lessons Learned Integration

```bash
#!/bin/bash
# Lessons learned automation

INCIDENT_ID="$1"
PIR_FILE="pir-$INCIDENT_ID.md"

# Extract action items from PIR
grep -A 10 "Action Items:" "$PIR_FILE" | \
grep -E "^\s*- \[ \]" | \
while read -r item; do
  # Create GitHub issues for action items
  gh issue create \
    --title "PIR Action Item: $(echo $item | sed 's/- \[ \]//')" \
    --body "From incident $INCIDENT_ID post-incident review" \
    --label "incident-response,improvement"
done

# Update runbooks based on learnings
echo "Incident $INCIDENT_ID resolved at $(date)" >> incident-log.txt

# Update monitoring based on detection gaps
if grep -q "monitoring gap" "$PIR_FILE"; then
  echo "⚠️  Monitoring gaps identified - review monitoring configuration"
fi
```

## Continuous Improvement

### Incident Response Metrics

```yaml
Key Metrics:
  Mean Time to Detection (MTTD): < 5 minutes
  Mean Time to Response (MTTR): < 15 minutes
  Mean Time to Resolution (MTTO): < 2 hours for P0
  Incident Recurrence Rate: < 10%
  False Positive Rate: < 5%
  
Monthly Reviews:
  - Incident trends and patterns
  - Response time analysis
  - Process effectiveness
  - Tool performance
  - Team capability assessment
```

### Process Evolution

```yaml
Quarterly Improvements:
  1. Review and update incident procedures
  2. Conduct tabletop exercises
  3. Update escalation procedures
  4. Refresh team training
  5. Evaluate new tools and technologies

Annual Reviews:
  1. Complete incident response process audit
  2. Update business continuity plans
  3. Review insurance and legal requirements
  4. Conduct comprehensive disaster recovery test
  5. Strategic incident response planning
```

### Tools and Automation Enhancement

```bash
#!/bin/bash
# Incident response automation improvements

# Auto-create incident response channels
create_incident_channel() {
  local incident_id="$1"
  local severity="$2"
  
  curl -X POST -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"incident-${incident_id}\",
      \"purpose\": \"Response channel for incident ${incident_id} (${severity})\"
    }" \
    "https://slack.com/api/channels.create"
}

# Auto-invite response team
invite_response_team() {
  local channel="$1"
  local team_members="eng-manager,on-call-engineer,sre-lead"
  
  for member in $(echo $team_members | tr ',' ' '); do
    curl -X POST -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
      -d "channel=${channel}&user=${member}" \
      "https://slack.com/api/channels.invite"
  done
}

# Create automated incident timeline
track_incident_timeline() {
  local incident_id="$1"
  local event="$2"
  
  echo "$(date -Iseconds): $event" >> "incidents/${incident_id}-timeline.txt"
}
```

This comprehensive incident response and rollback documentation provides the Bole.to team with detailed procedures to handle any production issues effectively, minimizing downtime and ensuring rapid recovery.