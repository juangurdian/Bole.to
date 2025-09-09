# Production Deployment Checklist for Bole.to Live Stripe Integration

## Pre-Deployment Checklist

### Environment Preparation

- [ ] **AWS Infrastructure Ready**
  - [ ] ECS Fargate cluster configured
  - [ ] RDS PostgreSQL Multi-AZ deployed
  - [ ] ElastiCache Redis cluster active
  - [ ] Application Load Balancer configured
  - [ ] CloudFront distribution setup
  - [ ] Route 53 DNS configured for api.bole.to

- [ ] **Security Configuration**
  - [ ] AWS Secrets Manager configured with live Stripe keys
  - [ ] Systems Manager Parameter Store populated
  - [ ] IAM roles and policies configured with least privilege
  - [ ] VPC Security Groups configured
  - [ ] AWS WAF rules activated

- [ ] **Monitoring Setup**
  - [ ] CloudWatch dashboards configured
  - [ ] Datadog APM integration tested
  - [ ] Sentry error tracking configured
  - [ ] PagerDuty integration tested
  - [ ] Slack alerting channels configured

### Code Deployment

- [ ] **Live Stripe Configuration**
  - [ ] Live Stripe API keys deployed to Secrets Manager
  - [ ] Webhook endpoints configured in Stripe Dashboard
  - [ ] Connect application settings verified
  - [ ] Test payment flow with live keys (small amount)

- [ ] **Database Migrations**
  - [ ] Payment monitoring tables created
  - [ ] Fraud detection tables created
  - [ ] Audit logging tables created
  - [ ] Chargeback handling tables created
  - [ ] Indexes created for performance

- [ ] **Service Deployment**
  - [ ] Gateway service deployed with live configuration
  - [ ] Hi.Events backend deployed with live Stripe integration
  - [ ] Mobile app updated with production endpoints
  - [ ] Health check endpoints responding correctly

### Testing and Validation

- [ ] **Payment Flow Testing**
  - [ ] End-to-end payment flow with live Stripe
  - [ ] Webhook processing validation
  - [ ] Fraud detection system testing
  - [ ] Refund and dispute handling testing
  - [ ] Multi-currency payment testing

- [ ] **Security Testing**
  - [ ] Webhook signature verification working
  - [ ] API authentication and authorization
  - [ ] Rate limiting and DDoS protection
  - [ ] SSL/TLS configuration validation
  - [ ] Penetration testing completed

## Deployment Steps

### Phase 1: Infrastructure Deployment (2 hours)

```bash
# 1. Deploy Terraform infrastructure
cd /infra/terraform
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"

# 2. Configure secrets
aws secretsmanager create-secret \
  --name "bole-to/production/stripe" \
  --secret-string file://stripe-production-secrets.json

# 3. Deploy monitoring stack
kubectl apply -f monitoring/datadog-agent.yaml
kubectl apply -f monitoring/prometheus-config.yaml
```

### Phase 2: Database Setup (1 hour)

```sql
-- Run production database setup
\i /infra/database/init-production.sql
\i /infra/payments/payment-monitoring-schema.sql
\i /infra/security/audit-logging-schema.sql

-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Phase 3: Service Deployment (1 hour)

```bash
# 1. Build and push container images
docker build -t bole-to-gateway:production ./services/gateway
docker tag bole-to-gateway:production 123456789.dkr.ecr.us-east-1.amazonaws.com/bole-to-gateway:production
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/bole-to-gateway:production

docker build -t bole-to-hievents:production ./services/hi-events
docker tag bole-to-hievents:production 123456789.dkr.ecr.us-east-1.amazonaws.com/bole-to-hievents:production
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/bole-to-hievents:production

# 2. Deploy ECS services
aws ecs update-service \
  --cluster bole-to-production \
  --service bole-to-gateway \
  --task-definition bole-to-gateway:production

aws ecs update-service \
  --cluster bole-to-production \
  --service bole-to-hievents \
  --task-definition bole-to-hievents:production

# 3. Wait for deployment completion
aws ecs wait services-stable \
  --cluster bole-to-production \
  --services bole-to-gateway bole-to-hievents
```

### Phase 4: Stripe Configuration (30 minutes)

1. **Configure Webhook Endpoints in Stripe Dashboard:**
   - URL: `https://api.bole.to/api/webhooks/stripe`
   - Events: payment_intent.succeeded, payment_intent.payment_failed, charge.dispute.created, etc.
   - Test webhook delivery

2. **Verify Connect Application:**
   - Application name: Bole.to Event Platform
   - Redirect URI: `https://api.bole.to/auth/stripe/callback`
   - Test Connect flow

### Phase 5: Testing and Validation (1 hour)

```bash
# 1. Health check validation
curl -f https://api.bole.to/healthz
curl -f https://api.bole.to/api/health

# 2. Authentication flow test
curl -X POST https://api.bole.to/auth/google \
  -H "Content-Type: application/json" \
  -d '{"redirect_uri": "boleto://auth/callback"}'

# 3. Payment intent creation test
curl -X POST https://api.bole.to/api/orders/payment-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-event",
    "tickets": [{"id": 1, "quantity": 1}]
  }'

# 4. Webhook endpoint test
curl -X POST https://api.bole.to/api/webhooks/stripe/health
```

## Post-Deployment Validation

### Monitoring Verification

- [ ] **Payment Metrics Dashboard**
  - [ ] Payment volume tracking active
  - [ ] Success rate monitoring functional
  - [ ] Revenue tracking accurate
  - [ ] Error rate alerts configured

- [ ] **Security Monitoring**
  - [ ] Fraud detection alerts working
  - [ ] Audit logging capturing events
  - [ ] Security incident alerts configured
  - [ ] Chargeback monitoring active

- [ ] **Performance Monitoring**
  - [ ] APM traces visible in Datadog
  - [ ] Error tracking in Sentry
  - [ ] Database performance metrics
  - [ ] API response time monitoring

### Load Testing

```bash
# Run load test with k6
k6 run --vus 50 --duration 5m /misc/k6/payment-load-test.js

# Monitor during load test
watch -n 5 "aws ecs describe-services \
  --cluster bole-to-production \
  --services bole-to-gateway bole-to-hievents \
  --query 'services[].{Name:serviceName,Running:runningCount,Desired:desiredCount}' \
  --output table"
```

### Security Validation

```bash
# 1. SSL/TLS configuration check
testssl.sh https://api.bole.to

# 2. Security headers validation
curl -I https://api.bole.to

# 3. Webhook signature verification test
python3 /infra/security/test-webhook-signature.py

# 4. Rate limiting test
for i in {1..100}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://api.bole.to/api/health
done
```

## Go-Live Procedures

### Final Pre-Launch Steps

1. **Team Notification**
   ```bash
   # Notify team of go-live
   slack-cli send-message "#general" \
     "🚀 Bole.to production deployment initiated. Live Stripe integration active."
   ```

2. **DNS Cutover**
   ```bash
   # Update DNS to point to production environment
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789 \
     --change-batch file://dns-cutover.json
   ```

3. **Monitor Initial Traffic**
   - Watch CloudWatch dashboards for first hour
   - Monitor error rates and response times
   - Verify payment processing working correctly

### Launch Communication

- [ ] **Status Page Update**
  - Update status.bole.to with launch announcement
  - Set up maintenance window if needed

- [ ] **Customer Communication**
  - Email notification about enhanced payment security
  - In-app notification about new features

- [ ] **Support Team Briefing**
  - Brief support team on new features
  - Provide troubleshooting guides
  - Set up escalation procedures

## Rollback Procedures

### Automated Rollback Triggers

- Payment success rate drops below 90%
- Error rate exceeds 10%
- P0 security incident detected
- Database connection failures

### Manual Rollback Steps

```bash
# 1. Revert ECS services to previous version
aws ecs update-service \
  --cluster bole-to-production \
  --service bole-to-gateway \
  --task-definition bole-to-gateway:previous

# 2. Revert DNS if needed
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://dns-rollback.json

# 3. Switch Stripe to test mode temporarily
aws secretsmanager update-secret \
  --secret-id "bole-to/production/stripe" \
  --secret-string file://stripe-test-secrets.json

# 4. Notify team of rollback
slack-cli send-message "#incidents" \
  "⚠️ Production rollback initiated. Investigating issues."
```

## Success Metrics

### Technical Metrics
- [ ] Payment success rate >98%
- [ ] API response time <2 seconds (95th percentile)
- [ ] Error rate <1%
- [ ] Zero security incidents in first 24 hours

### Business Metrics
- [ ] Payment processing volume as expected
- [ ] Customer satisfaction scores maintained
- [ ] No increase in support tickets
- [ ] Fraud detection working effectively

## Post-Launch Activities

### Week 1
- [ ] Daily monitoring and optimization
- [ ] Customer feedback collection
- [ ] Performance tuning based on real traffic
- [ ] Documentation updates

### Week 2-4
- [ ] Capacity planning adjustments
- [ ] Cost optimization review
- [ ] Security posture assessment
- [ ] Compliance audit preparation

### Month 1
- [ ] Full performance review
- [ ] Lessons learned documentation
- [ ] Process improvement recommendations
- [ ] Next phase planning

This comprehensive deployment checklist ensures a smooth transition to live Stripe payment processing with all monitoring, security, and operational procedures in place.