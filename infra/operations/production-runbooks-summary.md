# Boleto Production Runbooks - Executive Summary

## Overview

This document provides a comprehensive overview of all production runbooks for the Boleto event ticketing platform, serving as a master reference for operations teams, incident responders, and leadership during critical situations.

## System Architecture Quick Reference

**Core Services:**
- **Gateway Service**: OAuth JWT issuer (RS256), session management, authentication
- **Hi.Events Backend**: Event management, payments (Stripe), QR validation
- **PostgreSQL**: Primary database with Multi-AZ, point-in-time recovery
- **ElastiCache Redis**: Session storage, caching layer
- **AWS Infrastructure**: ECS Fargate, ALB, CloudFront, Route 53, WAF

**Domain**: api.bole.to  
**Environment**: Production (us-east-1)  
**Monitoring**: CloudWatch, PagerDuty, Status Page  

## Runbook Index

### 1. [Deployment Runbook](deployment-runbook.md)
**Purpose**: Safe production deployments with rollback capabilities  
**Key Procedures**:
- Blue-green deployment strategy
- Database migration procedures  
- Container image deployment
- Traffic shifting and monitoring
- Emergency rollback procedures

**Critical Commands**:
```bash
# Emergency rollback
./rollback-deployment.sh
# Health check verification
./verify-deployment.sh --environment production
# Manual scaling
./scale-services.sh scale-up gateway-service 4
```

### 2. [Operations Runbook](operations-runbook.md)
**Purpose**: Daily operations, monitoring, and maintenance  
**Key Procedures**:
- Daily health checks (8:00 AM)
- Performance monitoring and alerting
- Log analysis and troubleshooting
- Auto scaling monitoring
- Security checks and maintenance

**Critical Commands**:
```bash
# Daily health check
./daily-health-check.sh
# Performance analysis
./analyze-performance.sh
# Security audit
./security-daily-check.sh
```

### 3. [Security Operations Runbook](security-operations-runbook.md)
**Purpose**: Security maintenance, key rotation, breach response  
**Key Procedures**:
- Monthly JWT key rotation
- OAuth provider certificate updates
- Token family breach detection and response
- QR signing key rotation
- Access auditing and compliance

**Critical Commands**:
```bash
# JWT key rotation
./rotate-jwt-keys.sh
# Emergency key rotation (breach response)
./emergency-jwt-rotation.sh "security-breach"
# Token family breach response
./automated-breach-response.sh token_family_breach
```

### 4. [Disaster Recovery Runbook](disaster-recovery-runbook.md)
**Purpose**: Business continuity during disasters  
**Key Procedures**:
- Single AZ failure response (RTO: 15 min)
- Regional disaster recovery (RTO: 2 hours)
- Point-in-time database recovery (RTO: 1 hour)
- Data integrity verification
- Business continuity procedures

**Critical Commands**:
```bash
# Regional failover
./cross-region-failover.sh us-west-2
# Point-in-time recovery
./point-in-time-recovery.sh "2024-01-15T10:30:00.000Z"
# Data integrity verification
./validate-data-integrity.sh
```

## Emergency Contact Matrix

### Critical Incidents (P0)
**Response Time**: Immediate  
**Contacts**:
- Primary On-Call: PagerDuty Auto-Escalation
- Engineering Manager: +1-XXX-XXX-XXXX
- CTO: +1-XXX-XXX-XXXX (for prolonged P0)

### Communication Channels
- **Slack**: #incidents (all incidents), #security-alerts (security)
- **Email**: devops@bole.to, security@bole.to
- **Status Page**: https://status.bole.to
- **PagerDuty**: Automatic escalation configured

## Quick Reference - Common Scenarios

### Scenario: High Error Rate (5XX > 10/hour)

**Immediate Actions**:
```bash
# Check service health
aws ecs describe-services --cluster boleto-production --services gateway-service hi-events-service

# Check database connections
aws rds describe-db-instances --db-instance-identifier boleto-production-rds

# Scale up services if needed
aws ecs update-service --cluster boleto-production --service gateway-service --desired-count 4

# Check recent deployments for rollback
aws ecs list-task-definitions --family-prefix gateway-service --status ACTIVE
```

**Investigation**:
- Review CloudWatch logs: `/ecs/gateway-service`, `/ecs/hi-events-service`
- Check database performance: CPU, connections, slow queries
- Verify external services: Stripe API status
- Analyze traffic patterns in ALB logs

### Scenario: Authentication Failures Spike

**Immediate Actions**:
```bash
# Check JWT service health
curl -s "https://api.bole.to/.well-known/jwks.json" | jq '.keys | length'

# Check Redis connectivity
redis-cli -h $REDIS_ENDPOINT -p 6379 ping

# Review recent auth errors
aws logs filter-log-events --log-group-name "/ecs/gateway-service" \
  --filter-pattern "authentication failed" --start-time $(date -d '1 hour ago' +%s)000
```

**Investigation**:
- Verify OAuth provider status (Google, Apple)
- Check for token family breaches
- Review session cleanup and expiration
- Analyze IP patterns for potential attacks

### Scenario: Payment Processing Issues

**Immediate Actions**:
```bash
# Check Stripe API status
curl -s "https://status.stripe.com/api/v2/status.json" | jq '.status.indicator'

# Review payment error patterns
aws logs filter-log-events --log-group-name "/ecs/hi-events-service" \
  --filter-pattern "payment failed OR stripe error"

# Check payment success rate
# Query database for recent payment statistics
```

**Investigation**:
- Verify Stripe webhook endpoint health
- Check for database connection issues
- Review fraud detection patterns
- Validate payment flow integrity

### Scenario: Database Performance Degradation

**Immediate Actions**:
```bash
# Check database CPU and connections
aws cloudwatch get-metric-statistics --namespace AWS/RDS \
  --metric-name CPUUtilization --dimensions Name=DBInstanceIdentifier,Value=boleto-production-rds

# Check for long-running queries
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U boleto_admin -d boleto_production -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'"

# Check for blocking queries
# Review pg_stat_statements for slow queries
```

**Investigation**:
- Analyze slow query patterns
- Check for database locks and deadlocks
- Review connection pool utilization
- Consider read replica scaling

## Monitoring and Alerting Overview

### Critical Metrics and Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API Response Time | >1.5s | >3.0s | Scale services |
| Error Rate (5XX) | >2% | >5% | Investigate/rollback |
| Database CPU | >70% | >90% | Scale RDS |
| Database Connections | >80 | >95 | Check connection leaks |
| JWT Key Age | >25 days | >35 days | Rotate keys |
| SSL Cert Expiry | <30 days | <7 days | Renew certificate |
| Failed Auth Rate | >5% | >10% | Security investigation |

### CloudWatch Dashboards

**Primary Dashboard**: Boleto Production Overview
- Service health and performance metrics
- Database and cache performance  
- Error rates and response times
- Security and authentication metrics

**Security Dashboard**: Boleto Security Monitoring
- Authentication failure patterns
- JWT token issuance and validation
- Session management metrics
- Security breach indicators

## Maintenance Windows

### Scheduled Maintenance
- **Database Maintenance**: Sundays 2:00-4:00 AM EST
- **Application Updates**: Tuesdays 10:00 PM EST
- **Security Updates**: As needed (emergency), Monthly (routine)
- **Infrastructure Updates**: Monthly during low traffic

### Maintenance Procedures
```bash
# Enable maintenance mode
aws ssm put-parameter --name "/boleto/production/maintenance_mode" --value "true" --overwrite

# Perform maintenance tasks
# ...

# Disable maintenance mode  
aws ssm put-parameter --name "/boleto/production/maintenance_mode" --value "false" --overwrite
```

## Security Compliance Quick Reference

### Key Rotation Schedule
- **JWT Keys**: Monthly (automated)
- **Database Passwords**: Quarterly
- **API Keys**: As needed
- **SSL Certificates**: Automatic renewal (90 days)
- **QR Signing Keys**: Quarterly

### Compliance Requirements
- **GDPR**: Data retention policies, right to erasure
- **PCI DSS**: Secure payment processing (via Stripe)
- **SOC 2 Type II**: Security controls documentation
- **Security Audits**: Annual penetration testing

### Access Audit Requirements
- Weekly access pattern review
- Monthly privilege audit
- Quarterly compliance reporting
- Annual access control review

## Disaster Recovery Summary

### Recovery Objectives

| Scenario | RTO | RPO | Automatic | Manual |
|----------|-----|-----|-----------|--------|
| Single AZ Failure | 15 min | 5 min | ✅ Multi-AZ | Service redistribution |
| Regional Disaster | 2 hours | 15 min | ❌ | Full DR procedures |
| Database Corruption | 1 hour | 1 min | ❌ | Point-in-time recovery |
| Security Breach | 30 min | 5 min | ⚠️ Partial | Key rotation, session cleanup |

### DR Testing Schedule
- **Monthly**: Database failover testing
- **Quarterly**: Cross-region deployment testing  
- **Semi-annually**: Full DR simulation
- **Annually**: Complete disaster recovery drill

## Performance Benchmarks

### Service Level Agreements
- **API Response Time**: <1 second (95th percentile)
- **System Uptime**: 99.9% monthly availability
- **Error Rate**: <1% of total requests
- **Payment Processing**: 99.5% success rate
- **Authentication**: 99.9% success rate

### Capacity Planning
- **Gateway Service**: 2-6 tasks (auto-scaling)
- **Hi.Events Service**: 3-8 tasks (auto-scaling)
- **Database**: db.r5.large (scalable to xlarge)
- **Redis**: 2-4 nodes (cluster mode)

## Cost Optimization

### Monthly Cost Targets
- **Compute (ECS)**: $200-400
- **Database (RDS)**: $150-250
- **Cache (Redis)**: $40-80
- **Network (ALB/CF)**: $50-100
- **Storage (S3)**: $20-50
- **Total**: $460-880/month

### Cost Monitoring
- Weekly cost reviews
- Monthly optimization opportunities
- Quarterly reserved instance evaluation
- Annual architecture cost review

## Troubleshooting Quick Reference

### Common Issues and Solutions

| Issue | Quick Check | Solution |
|-------|-------------|----------|
| High response times | Check CPU/memory, database performance | Scale services, optimize queries |
| Authentication failures | JWT service, Redis connectivity | Restart services, check keys |
| Payment failures | Stripe API, webhook health | Verify integration, check logs |
| Database locks | pg_stat_activity, blocking queries | Kill long queries, optimize |
| Memory issues | ECS metrics, container logs | Scale up, check for leaks |
| SSL errors | Certificate expiry, validation | Renew certificates, check config |

### Log Locations
- **Gateway Service**: `/ecs/gateway-service`
- **Hi.Events Service**: `/ecs/hi-events-service`
- **Load Balancer**: `/aws/applicationloadbalancer/boleto-production-alb`
- **Database**: RDS logs via CloudWatch
- **Security Audit**: `/var/log/boleto/security-audit.log`

## Update and Maintenance

This runbook collection should be reviewed and updated:
- **Weekly**: After significant incidents or changes
- **Monthly**: During security key rotations
- **Quarterly**: During DR testing cycles  
- **Annually**: Complete operational review

### Version Control
All runbooks are maintained in the `/infra/operations/` directory of the main repository. Changes should be:
1. Tested in staging environment
2. Reviewed by operations team
3. Approved by engineering manager
4. Documented with change rationale

### Training Requirements
- **New team members**: Complete runbook walkthrough within first week
- **Existing team**: Quarterly runbook refresher training
- **On-call rotation**: Monthly incident response simulation
- **Leadership**: Semi-annual executive briefing

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: $(date -d '+1 month')  
**Maintainer**: DevOps Team  
**Approval**: Engineering Manager  

For questions or updates to these runbooks, contact: devops@bole.to