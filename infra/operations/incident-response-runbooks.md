# Incident Response and Operational Runbooks for Bole.to Production

## Overview

Comprehensive incident response procedures and operational runbooks for the Bole.to payment processing platform, including automated response systems, escalation procedures, and detailed troubleshooting guides.

## Incident Response Framework

### Incident Classification

**Severity Levels:**

**P0 - Critical (Response: Immediate)**
- Complete payment processing outage
- Data breach or security incident
- Complete service unavailability
- Revenue-impacting issues affecting >50% of users

**P1 - High (Response: <30 minutes)**
- Partial payment processing issues
- High error rates (>5%)
- Performance degradation affecting user experience
- Single region/AZ outage

**P2 - Medium (Response: <2 hours)**
- Non-critical feature outages
- Minor performance issues
- Third-party service degradations with workarounds

**P3 - Low (Response: <24 hours)**
- Cosmetic issues
- Documentation updates
- Non-urgent enhancements

### Automated Incident Response System

```python
# File: /infra/operations/incident-response-automation.py

import boto3
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional

class IncidentResponseAutomation:
    def __init__(self):
        self.sns = boto3.client('sns')
        self.cloudwatch = boto3.client('cloudwatch')
        self.ecs = boto3.client('ecs')
        self.rds = boto3.client('rds')
        
        # Configuration
        self.alert_topic_arn = "arn:aws:sns:us-east-1:ACCOUNT_ID:incident-alerts"
        self.pagerduty_api_key = "YOUR_PAGERDUTY_API_KEY"
        self.slack_webhook_url = "YOUR_SLACK_WEBHOOK_URL"
        
    def handle_payment_failure_spike(self, metric_data: Dict) -> Dict:
        """
        Automated response to payment failure spike
        """
        response = {
            'incident_id': self.generate_incident_id(),
            'severity': 'P1',
            'actions_taken': [],
            'status': 'investigating'
        }
        
        # 1. Increase ECS service capacity
        scaling_result = self.scale_ecs_services({
            'bole-to-gateway': {'desired_count': 6},
            'bole-to-hiEvents': {'desired_count': 8}
        })
        response['actions_taken'].append(f"Scaled ECS services: {scaling_result}")
        
        # 2. Check database performance
        db_metrics = self.check_database_performance()
        if db_metrics['connection_count'] > 80:  # 80% of max connections
            response['actions_taken'].append("Database connection limit approaching - consider scaling RDS")
            
        # 3. Verify Stripe API status
        stripe_status = self.check_stripe_api_health()
        if not stripe_status['healthy']:
            response['actions_taken'].append(f"Stripe API issues detected: {stripe_status['message']}")
            
        # 4. Create incident in PagerDuty
        pagerduty_incident = self.create_pagerduty_incident(
            title="Payment Failure Spike Detected",
            severity="high",
            details=f"Payment failure rate: {metric_data.get('failure_rate', 'unknown')}%"
        )
        response['actions_taken'].append(f"PagerDuty incident created: {pagerduty_incident['id']}")
        
        # 5. Notify team via Slack
        self.send_slack_alert({
            'channel': '#incidents',
            'message': f"🚨 Payment failure spike detected. Incident ID: {response['incident_id']}",
            'details': response['actions_taken']
        })
        
        return response
        
    def handle_high_error_rate(self, service_name: str, error_rate: float) -> Dict:
        """
        Automated response to high error rates
        """
        response = {
            'incident_id': self.generate_incident_id(),
            'severity': 'P1',
            'service': service_name,
            'actions_taken': [],
            'status': 'investigating'
        }
        
        # 1. Restart unhealthy service tasks
        unhealthy_tasks = self.find_unhealthy_tasks(service_name)
        if unhealthy_tasks:
            restart_result = self.restart_ecs_tasks(service_name, unhealthy_tasks)
            response['actions_taken'].append(f"Restarted {len(unhealthy_tasks)} unhealthy tasks")
            
        # 2. Scale up service temporarily
        scale_result = self.temporary_scale_up(service_name, multiplier=1.5)
        response['actions_taken'].append(f"Temporarily scaled up {service_name}")
        
        # 3. Check recent deployments
        recent_deployments = self.check_recent_deployments(service_name, hours=2)
        if recent_deployments:
            response['actions_taken'].append(f"Recent deployment detected: consider rollback")
            response['rollback_candidate'] = recent_deployments[0]
            
        # 4. Analyze error patterns
        error_analysis = self.analyze_error_patterns(service_name)
        response['error_analysis'] = error_analysis
        
        return response
        
    def handle_security_alert(self, alert_data: Dict) -> Dict:
        """
        Automated response to security alerts
        """
        response = {
            'incident_id': self.generate_incident_id(),
            'severity': 'P0',
            'alert_type': alert_data.get('type', 'unknown'),
            'actions_taken': [],
            'status': 'investigating'
        }
        
        # 1. Block suspicious IPs if identified
        if 'suspicious_ips' in alert_data:
            for ip in alert_data['suspicious_ips']:
                block_result = self.block_ip_in_waf(ip)
                response['actions_taken'].append(f"Blocked IP {ip} in WAF")
                
        # 2. Rotate potentially compromised credentials
        if alert_data.get('type') == 'credential_compromise':
            rotation_result = self.rotate_api_keys()
            response['actions_taken'].append("Initiated API key rotation")
            
        # 3. Create high-priority security incident
        security_incident = self.create_pagerduty_incident(
            title=f"Security Alert: {alert_data.get('type', 'Unknown')}",
            severity="critical",
            details=json.dumps(alert_data, indent=2)
        )
        
        # 4. Notify security team immediately
        self.send_security_alert(alert_data, response['incident_id'])
        
        return response
        
    def scale_ecs_services(self, services: Dict[str, Dict]) -> Dict:
        """Scale ECS services based on configuration"""
        results = {}
        for service_name, config in services.items():
            try:
                self.ecs.update_service(
                    cluster='bole-to-production',
                    service=service_name,
                    desiredCount=config['desired_count']
                )
                results[service_name] = f"Scaled to {config['desired_count']} tasks"
            except Exception as e:
                results[service_name] = f"Failed to scale: {str(e)}"
        return results
        
    def check_database_performance(self) -> Dict:
        """Check RDS performance metrics"""
        try:
            metrics = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='DatabaseConnections',
                Dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': 'bole-to-production'}],
                StartTime=datetime.utcnow().replace(minute=0, second=0, microsecond=0),
                EndTime=datetime.utcnow(),
                Period=300,
                Statistics=['Average', 'Maximum']
            )
            
            latest_metric = max(metrics['Datapoints'], key=lambda x: x['Timestamp'])
            return {
                'connection_count': latest_metric['Average'],
                'max_connections': 100,  # Based on RDS instance type
                'healthy': latest_metric['Average'] < 80
            }
        except Exception as e:
            return {'error': str(e), 'healthy': False}
            
    def check_stripe_api_health(self) -> Dict:
        """Check Stripe API status"""
        try:
            response = requests.get('https://status.stripe.com/api/v2/status.json', timeout=10)
            data = response.json()
            return {
                'healthy': data.get('status', {}).get('indicator') == 'none',
                'message': data.get('status', {}).get('description', 'Unknown')
            }
        except Exception as e:
            return {'healthy': False, 'message': f'Failed to check Stripe status: {str(e)}'}
            
    def create_pagerduty_incident(self, title: str, severity: str, details: str) -> Dict:
        """Create incident in PagerDuty"""
        payload = {
            "incident": {
                "type": "incident",
                "title": title,
                "service": {"id": "YOUR_PAGERDUTY_SERVICE_ID", "type": "service_reference"},
                "urgency": "high" if severity in ["critical", "high"] else "low",
                "body": {"type": "incident_body", "details": details}
            }
        }
        
        headers = {
            "Authorization": f"Token token={self.pagerduty_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.pagerduty+json;version=2",
            "From": "automation@bole.to"
        }
        
        try:
            response = requests.post(
                'https://api.pagerduty.com/incidents',
                headers=headers,
                json=payload,
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
            
    def send_slack_alert(self, alert_data: Dict) -> bool:
        """Send alert to Slack"""
        payload = {
            "channel": alert_data['channel'],
            "text": alert_data['message'],
            "attachments": [
                {
                    "color": "danger",
                    "fields": [
                        {
                            "title": "Actions Taken",
                            "value": "\n".join(alert_data.get('details', [])),
                            "short": False
                        }
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(self.slack_webhook_url, json=payload, timeout=10)
            return response.status_code == 200
        except Exception:
            return False
            
    def generate_incident_id(self) -> str:
        """Generate unique incident ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"INC-{timestamp}"
```

## Detailed Runbooks

### Runbook 1: Payment Processing Outage

**Symptoms:**
- Payment success rate drops below 95%
- High number of failed payment intents
- Customer complaints about payment failures

**Investigation Steps:**

1. **Check System Health**
   ```bash
   # Check ECS service health
   aws ecs describe-services --cluster bole-to-production --services bole-to-gateway bole-to-hiEvents
   
   # Check load balancer health
   aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
   
   # Check database connections
   aws rds describe-db-instances --db-instance-identifier bole-to-production
   ```

2. **Verify Stripe Integration**
   ```bash
   # Test Stripe API connectivity
   curl -X GET "https://api.stripe.com/v1/balance" \
     -H "Authorization: Bearer sk_live_..."
   
   # Check webhook endpoint health
   curl -X GET "https://api.bole.to/api/webhooks/stripe/health"
   ```

3. **Analyze Error Patterns**
   ```bash
   # Check CloudWatch logs for payment errors
   aws logs filter-log-events \
     --log-group-name "/ecs/bole-to-hiEvents" \
     --filter-pattern "ERROR payment" \
     --start-time $(date -d '1 hour ago' +%s)000
   ```

**Resolution Steps:**

1. **Immediate Actions**
   - Scale up ECS services to handle increased load
   - Check for recent deployments and consider rollback
   - Verify database connection pool settings

2. **If Stripe API Issues**
   - Implement circuit breaker for Stripe API calls
   - Queue payment requests for retry
   - Communicate service degradation to customers

3. **If Database Issues**
   - Scale RDS instance if CPU/memory high
   - Check for long-running queries
   - Implement read replica failover if needed

### Runbook 2: High Fraud Detection Alerts

**Symptoms:**
- Spike in high-risk payment transactions
- Multiple fraud indicators triggered
- Unusual payment patterns detected

**Investigation Steps:**

1. **Analyze Fraud Patterns**
   ```sql
   -- Check recent high-risk transactions
   SELECT payment_intent_id, risk_score, fraud_indicators, amount_cents
   FROM fraud_detection_log
   WHERE created_at >= NOW() - INTERVAL '1 hour'
     AND risk_level = 'high'
   ORDER BY created_at DESC;
   ```

2. **Check Payment Sources**
   ```sql
   -- Analyze payment method distribution
   SELECT payment_method, COUNT(*), AVG(risk_score)
   FROM payment_monitoring_events
   WHERE processed_at >= NOW() - INTERVAL '1 hour'
   GROUP BY payment_method;
   ```

**Resolution Steps:**

1. **Immediate Protection**
   - Temporarily increase risk thresholds
   - Enable additional verification for high-risk payments
   - Block suspicious IP ranges in WAF

2. **Investigation**
   - Review transaction patterns for common indicators
   - Check for compromised payment methods
   - Coordinate with Stripe on suspicious activity

### Runbook 3: Database Performance Issues

**Symptoms:**
- High database CPU utilization
- Slow query response times
- Connection pool exhaustion

**Investigation Steps:**

1. **Check Database Metrics**
   ```sql
   -- Find slow queries
   SELECT query, mean_time, calls, total_time
   FROM pg_stat_statements
   WHERE mean_time > 1000  -- Queries over 1 second
   ORDER BY mean_time DESC
   LIMIT 10;
   
   -- Check active connections
   SELECT count(*), state
   FROM pg_stat_activity
   GROUP BY state;
   ```

2. **Analyze Query Performance**
   ```sql
   -- Check for blocking queries
   SELECT blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS blocking_statement
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;
   ```

**Resolution Steps:**

1. **Immediate Relief**
   - Kill long-running queries if safe
   - Scale RDS instance vertically
   - Enable connection pooling with PgBouncer

2. **Long-term Fixes**
   - Add missing database indexes
   - Optimize slow queries
   - Implement read replicas for read-heavy operations

### Runbook 4: Security Incident Response

**Symptoms:**
- Unusual login patterns
- Suspicious API access
- Data breach alerts
- Unauthorized access attempts

**Immediate Response (First 15 minutes):**

1. **Containment**
   ```bash
   # Block suspicious IPs in WAF
   aws wafv2 update-ip-set --scope CLOUDFRONT --id IP_SET_ID \
     --addresses "192.168.1.1/32,10.0.0.1/32"
   
   # Rotate API keys
   aws secretsmanager update-secret --secret-id stripe-api-keys \
     --secret-string '{"secret_key":"sk_live_new_key"}'
   ```

2. **Assessment**
   - Review audit logs for breach scope
   - Check for data exfiltration
   - Identify compromised accounts

3. **Communication**
   - Notify security team via PagerDuty
   - Prepare customer communication
   - Document incident timeline

**Investigation Phase (First Hour):**

1. **Forensic Analysis**
   - Preserve logs and evidence
   - Analyze attack vectors
   - Determine data accessed

2. **Impact Assessment**
   - Identify affected customers
   - Calculate potential financial impact
   - Assess regulatory implications

**Recovery Phase:**

1. **System Hardening**
   - Patch identified vulnerabilities
   - Strengthen access controls
   - Update security policies

2. **Customer Communication**
   - Notify affected customers within 72 hours (GDPR)
   - Provide breach details and remediation steps
   - Offer credit monitoring if needed

## Escalation Procedures

### On-Call Rotation

**Primary On-Call:** DevOps Engineer
- Response time: 15 minutes
- Responsible for P0/P1 incidents

**Secondary On-Call:** Senior Developer
- Response time: 30 minutes
- Backup for primary, handles P2 incidents

**Escalation Path:**
1. Primary On-Call (0-15 min)
2. Secondary On-Call (15-30 min)
3. Engineering Manager (30-60 min)
4. CTO (60+ min for P0 incidents)

### Communication Channels

**Internal:**
- Slack: #incidents (all incidents)
- Slack: #security-alerts (security incidents)
- PagerDuty: Critical alerts
- Email: Weekly incident summaries

**External:**
- Status page: status.bole.to
- Customer email notifications
- Social media updates (if widespread)

## Post-Incident Procedures

### Incident Review Process

1. **Immediate Post-Incident (Within 24 hours)**
   - Create incident timeline
   - Document actions taken
   - Assess customer impact

2. **Post-Incident Review Meeting (Within 48 hours)**
   - Review incident response
   - Identify improvement opportunities
   - Assign action items

3. **Post-Incident Report (Within 1 week)**
   - Publish detailed incident report
   - Share learnings with team
   - Update runbooks and procedures

### Continuous Improvement

- Monthly incident review meetings
- Quarterly disaster recovery tests
- Annual incident response training
- Regular runbook updates based on learnings

This comprehensive incident response framework ensures rapid detection, automated response, and effective resolution of issues in your production payment processing environment.