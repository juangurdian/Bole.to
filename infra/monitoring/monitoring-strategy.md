# Monitoring, Logging, and Alerting Strategy for Bole.to Production

## Overview

This document outlines the comprehensive monitoring, logging, and alerting strategy for the Bole.to production environment, ensuring high visibility, proactive issue detection, and rapid incident response.

## Architecture

### Monitoring Stack

1. **AWS CloudWatch**: Metrics, logs, and basic monitoring
2. **AWS X-Ray**: Distributed tracing for performance analysis
3. **AWS Application Insights**: Application performance monitoring
4. **Custom Metrics**: Business and application-specific metrics
5. **External Monitoring**: Third-party uptime and synthetic monitoring

### Logging Strategy

1. **Centralized Logging**: All logs aggregated in CloudWatch Logs
2. **Structured Logging**: JSON format for better parsing and filtering
3. **Log Levels**: DEBUG, INFO, WARN, ERROR with appropriate filtering
4. **Log Retention**: Configurable retention periods by environment
5. **Log Analysis**: CloudWatch Insights for log querying and analysis

### Alerting Framework

1. **Multi-tier Alerting**: Critical, Warning, and Info levels
2. **Multiple Channels**: Email, Slack, PagerDuty integration
3. **Escalation Policies**: Automated escalation for unacknowledged alerts
4. **Alert Correlation**: Reduced noise through intelligent grouping

## Metrics and KPIs

### Infrastructure Metrics

| Metric Category | Metrics | Thresholds | Alert Level |
|-----------------|---------|------------|-------------|
| **CPU Utilization** | ECS Tasks, RDS | >80% for 5 min | Warning |
| | | >90% for 2 min | Critical |
| **Memory Utilization** | ECS Tasks, RDS | >85% for 5 min | Warning |
| | | >95% for 2 min | Critical |
| **Disk Usage** | RDS Storage | >80% used | Warning |
| | | >90% used | Critical |
| **Network** | Data transfer rates | Baseline +200% | Warning |
| **Load Balancer** | Target health, latency | <50% healthy targets | Critical |
| | | >2s average latency | Warning |

### Application Metrics

| Metric Category | Metrics | Thresholds | Alert Level |
|-----------------|---------|------------|-------------|
| **HTTP Requests** | Request rate, status codes | >5% 5xx errors | Warning |
| | | >10% 5xx errors | Critical |
| **Response Times** | P50, P95, P99 latency | P95 >2s | Warning |
| | | P99 >5s | Critical |
| **Database** | Connection pool, query time | >90% pool usage | Warning |
| | | >5s average query time | Warning |
| **Authentication** | Login success/failure rates | >20% failure rate | Warning |
| **API Rate Limiting** | Rate limit hits | >100 hits/min | Warning |

### Business Metrics

| Metric Category | Metrics | Thresholds | Alert Level |
|-----------------|---------|------------|-------------|
| **User Activity** | Active users, session duration | -50% from baseline | Warning |
| **Events** | Event creation rate | -80% from baseline | Critical |
| **Payments** | Transaction success rate | <95% success | Critical |
| **Mobile App** | Crash rates, API errors | >1% crash rate | Warning |

## Logging Configuration

### Log Levels and Content

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "gateway",
  "requestId": "req-12345",
  "userId": "user-67890",
  "method": "POST",
  "path": "/auth/login",
  "statusCode": 200,
  "responseTime": 156,
  "userAgent": "Bole.to-Mobile/1.0.0",
  "ipAddress": "192.168.1.100",
  "message": "User login successful",
  "metadata": {
    "provider": "google",
    "deviceType": "ios"
  }
}
```

### Log Groups Structure

```
/ecs/boleto-production-gateway
/ecs/boleto-production-hievents
/aws/rds/instance/boleto-production-rds/error
/aws/rds/instance/boleto-production-rds/general
/aws/rds/instance/boleto-production-rds/slowquery
/aws/elasticache/boleto-production-redis
/aws/lambda/boleto-production-functions
/aws/apigateway/boleto-production
/aws/vpc/boleto-production-flowlogs
```

### Log Retention Policy

- **Production Logs**: 30 days
- **Error Logs**: 90 days  
- **Audit Logs**: 1 year
- **Debug Logs**: 7 days
- **Performance Logs**: 30 days

## CloudWatch Dashboards

### 1. Executive Dashboard

High-level business and system health metrics:
- Overall system status
- Active users and sessions
- Revenue metrics (if applicable)
- Critical error rates
- System uptime

### 2. Infrastructure Dashboard

Detailed infrastructure monitoring:
- ECS cluster and service health
- RDS performance metrics
- ElastiCache performance
- Load balancer metrics
- CloudFront performance

### 3. Application Dashboard

Application-specific metrics:
- API response times and error rates
- Authentication success/failure rates
- Database query performance
- External service health (Stripe, Hi.Events)

### 4. Security Dashboard

Security monitoring and alerts:
- Failed authentication attempts
- Rate limiting triggers
- Suspicious IP activity
- Certificate expiration warnings

## Alerting Rules

### Critical Alerts (Immediate Response)

```yaml
critical_alerts:
  - name: "Service Unavailable"
    condition: "HTTP 5xx errors > 10% for 2 minutes"
    notification: ["pagerduty", "slack-critical"]
    
  - name: "Database Connection Failure"
    condition: "Database connection errors > 5 in 1 minute"
    notification: ["pagerduty", "slack-critical"]
    
  - name: "Memory Exhaustion"
    condition: "Memory utilization > 95% for 2 minutes"
    notification: ["pagerduty", "slack-critical"]
    
  - name: "Authentication System Down"
    condition: "Authentication failures > 50% for 5 minutes"
    notification: ["pagerduty", "slack-critical"]
```

### Warning Alerts (Investigation Needed)

```yaml
warning_alerts:
  - name: "High Response Times"
    condition: "P95 response time > 2 seconds for 5 minutes"
    notification: ["slack-warnings", "email"]
    
  - name: "Increased Error Rate"
    condition: "HTTP 4xx errors > 15% for 10 minutes"
    notification: ["slack-warnings", "email"]
    
  - name: "High CPU Usage"
    condition: "CPU utilization > 80% for 10 minutes"
    notification: ["slack-warnings", "email"]
    
  - name: "SSL Certificate Expiring"
    condition: "Certificate expires within 30 days"
    notification: ["email", "slack-warnings"]
```

### Info Alerts (Awareness)

```yaml
info_alerts:
  - name: "Deployment Completed"
    condition: "ECS service deployment successful"
    notification: ["slack-deployments"]
    
  - name: "Scaling Event"
    condition: "Auto Scaling triggered"
    notification: ["slack-info"]
    
  - name: "Backup Completed"
    condition: "Database backup successful"
    notification: ["slack-info"]
```

## External Monitoring

### Synthetic Monitoring

1. **Uptime Monitoring**: External service monitoring key endpoints
2. **Performance Testing**: Regular synthetic transactions
3. **Geographic Monitoring**: Multi-region availability checks
4. **Mobile App Monitoring**: Real device testing

### Third-party Tools

1. **Pingdom/StatusCake**: Uptime monitoring
2. **New Relic/Datadog**: APM (optional)
3. **Sentry**: Error tracking and alerting
4. **LogRocket**: Session replay for debugging

## Implementation

### CloudWatch Alarms Configuration

```terraform
# High error rate alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "boleto-production-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors high error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

# High response time alarm
resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "boleto-production-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2.0"
  alarm_description   = "This metric monitors high response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}
```

### Custom Metrics Implementation

```javascript
// Custom metrics in Gateway service
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

class MetricsCollector {
  constructor(namespace = 'Boleto/Gateway') {
    this.namespace = namespace;
  }

  async putMetric(metricName, value, unit = 'Count', dimensions = {}) {
    const params = {
      Namespace: this.namespace,
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions).map(([name, value]) => ({
          Name: name,
          Value: value
        }))
      }]
    };

    try {
      await cloudwatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put metric:', error);
    }
  }

  // Track authentication events
  async trackAuth(event, provider = 'unknown') {
    await this.putMetric('AuthEvent', 1, 'Count', {
      Event: event,
      Provider: provider
    });
  }

  // Track API performance
  async trackAPICall(endpoint, responseTime, statusCode) {
    await Promise.all([
      this.putMetric('APIResponseTime', responseTime, 'Milliseconds', {
        Endpoint: endpoint
      }),
      this.putMetric('APICall', 1, 'Count', {
        Endpoint: endpoint,
        StatusCode: statusCode.toString()
      })
    ]);
  }

  // Track business metrics
  async trackBusinessEvent(event, value = 1) {
    await this.putMetric('BusinessEvent', value, 'Count', {
      Event: event
    });
  }
}

module.exports = MetricsCollector;
```

### Log Aggregation Setup

```javascript
// Structured logging setup
const winston = require('winston');
const { CloudWatchLogs } = require('@aws-sdk/client-cloudwatch-logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'gateway',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  },
  transports: [
    // CloudWatch Logs
    new winston.transports.Console(),
    // Add CloudWatch transport if needed
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      requestId: req.requestId,
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};
```

## Incident Response Integration

### PagerDuty Configuration

```yaml
pagerduty_services:
  - name: "Boleto Production Critical"
    escalation_policy: "P0 - Immediate Response"
    acknowledgment_timeout: 30
    auto_resolve_timeout: 14400
    
  - name: "Boleto Production Warnings" 
    escalation_policy: "P1 - Business Hours"
    acknowledgment_timeout: 300
    auto_resolve_timeout: 3600
```

### Slack Integration

```yaml
slack_channels:
  - name: "#boleto-alerts-critical"
    purpose: "Critical system alerts requiring immediate attention"
    
  - name: "#boleto-alerts-warnings"
    purpose: "Warning alerts and system notifications"
    
  - name: "#boleto-deployments"
    purpose: "Deployment notifications and system changes"
    
  - name: "#boleto-performance"
    purpose: "Performance metrics and optimization insights"
```

## Performance Baselines

### Response Time Baselines

- **Authentication Endpoints**: P95 < 500ms, P99 < 1s
- **Profile Endpoints**: P95 < 200ms, P99 < 500ms
- **Health Checks**: P95 < 100ms, P99 < 200ms
- **Proxy Requests**: P95 < 1s, P99 < 2s

### Throughput Baselines

- **Peak Load**: 1000 requests/minute
- **Average Load**: 100 requests/minute
- **Authentication Rate**: 50 logins/minute
- **Concurrent Users**: 500 active sessions

## Monitoring Automation

### Auto-scaling Triggers

```yaml
scaling_policies:
  cpu_high:
    metric: CPUUtilization
    threshold: 70
    action: scale_up
    cooldown: 300
    
  cpu_low:
    metric: CPUUtilization  
    threshold: 30
    action: scale_down
    cooldown: 600
    
  response_time_high:
    metric: TargetResponseTime
    threshold: 1.5
    action: scale_up
    cooldown: 180
```

### Health Check Automation

```bash
#!/bin/bash
# Health check automation script
# Runs every 5 minutes via CloudWatch Events

HEALTH_ENDPOINT="https://api.bole.to/healthz"
ALERT_SNS_TOPIC="arn:aws:sns:us-east-1:ACCOUNT:boleto-alerts"

# Perform health check
response=$(curl -s -w "%{http_code}" -o /dev/null "$HEALTH_ENDPOINT")

if [[ "$response" != "200" ]]; then
    # Send alert
    aws sns publish \
        --topic-arn "$ALERT_SNS_TOPIC" \
        --message "Health check failed: HTTP $response from $HEALTH_ENDPOINT" \
        --subject "Boleto Health Check Failed"
fi
```

## Monitoring Costs

### Cost Optimization

1. **Log Retention**: Automated cleanup of old logs
2. **Metric Filtering**: Filter noisy metrics to reduce costs
3. **Dashboard Optimization**: Consolidate similar metrics
4. **Alert Optimization**: Reduce false positives

### Estimated Monthly Costs

- **CloudWatch Logs**: $50-100
- **CloudWatch Metrics**: $30-50  
- **CloudWatch Alarms**: $10-20
- **CloudWatch Dashboards**: $3-5
- **External Monitoring**: $50-100
- **Total**: $143-275/month

## Runbooks and Documentation

### Common Scenarios

1. **High Error Rate Investigation**
2. **Performance Degradation Response**
3. **Database Connection Issues**
4. **SSL Certificate Expiration**
5. **Scaling Event Analysis**

Each scenario includes:
- Detection symptoms
- Investigation steps
- Remediation procedures
- Escalation criteria
- Post-incident tasks