# Bole.to Production Infrastructure Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Bole.to production infrastructure to AWS with the `https://api.bole.to` domain. The infrastructure is designed with high availability, security, and cost optimization in mind.

## Architecture Summary

The production infrastructure includes:

- **Multi-AZ VPC** with public, private, and database subnets
- **Application Load Balancer** with SSL termination and WAF protection
- **ECS Fargate** services for Gateway and Hi.Events containers
- **RDS PostgreSQL** Multi-AZ with automated backups
- **ElastiCache Redis** cluster for session storage
- **CloudFront CDN** with custom domain and security headers
- **S3 buckets** for static assets, backups, and logs
- **CloudWatch** monitoring with custom dashboards and alarms
- **KMS encryption** for data at rest
- **ECR repositories** for container images

## Prerequisites

### 1. Development Environment
```bash
# Install required tools
brew install terraform aws-cli jq
# or
apt-get update && apt-get install -y terraform awscli jq

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2. AWS Account Setup
```bash
# Configure AWS CLI
aws configure
# Set region to us-east-1 for ACM certificate compatibility with CloudFront
aws configure set region us-east-1

# Create S3 bucket for Terraform state
aws s3 mb s3://boleto-terraform-state-$(date +%s)

# Create DynamoDB table for state locking
aws dynamodb create-table \
    --table-name terraform-state-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 3. Domain Setup
```bash
# Create Route 53 hosted zone for bole.to (if not already exists)
aws route53 create-hosted-zone \
    --name bole.to \
    --caller-reference $(date +%s)

# Note the hosted zone ID from the output
```

### 4. Generate JWT Keys
```bash
# Generate RS256 key pair for JWT signing
openssl genrsa -out jwt_private_key.pem 2048
openssl rsa -in jwt_private_key.pem -pubout -out jwt_public_key.pem

# Store securely - these will be used in Terraform variables
```

## Deployment Steps

### Phase 1: Infrastructure Deployment (45-60 minutes)

#### 1.1. Configure Terraform Backend
Edit `/infra/terraform/main.tf` and update the backend configuration with your S3 bucket name:

```hcl
backend "s3" {
  bucket = "your-boleto-terraform-state-bucket"
  key    = "production/terraform.tfstate"
  region = "us-east-1"
  
  dynamodb_table = "terraform-state-lock"
  encrypt        = true
}
```

#### 1.2. Configure Production Variables
```bash
cd infra/terraform

# Copy the example variables file
cp production.tfvars.example production.tfvars

# Edit production.tfvars with your actual values
vim production.tfvars
```

**Critical variables to update:**
- `route53_zone_id` - Your Route 53 hosted zone ID
- `alert_email_addresses` - Email addresses for alerts
- `gateway_image` and `hievents_image` - Will be updated after container build

#### 1.3. Set Sensitive Environment Variables
```bash
# Database password
export TF_VAR_db_password="$(openssl rand -base64 32)"

# JWT keys
export TF_VAR_jwt_private_key="$(cat jwt_private_key.pem)"
export TF_VAR_jwt_public_key="$(cat jwt_public_key.pem)"

# OAuth credentials (get these from Google/Apple developer consoles)
export TF_VAR_google_client_id="your-google-client-id"
export TF_VAR_google_client_secret="your-google-client-secret"
export TF_VAR_apple_client_id="your-apple-client-id"
export TF_VAR_apple_key_id="your-apple-key-id"
export TF_VAR_apple_team_id="your-apple-team-id"
export TF_VAR_apple_private_key="$(cat apple_private_key.p8)"

# Stripe credentials (LIVE keys for production)
export TF_VAR_stripe_secret_key="sk_live_your-stripe-secret-key"
export TF_VAR_stripe_webhook_secret="whsec_your-webhook-secret"
```

#### 1.4. Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars" -out=production.plan

# Review the plan carefully, then apply
terraform apply production.plan
```

**Expected deployment time:** 30-45 minutes

### Phase 2: Container Build and Deployment (15-30 minutes)

#### 2.1. Build and Push Container Images
```bash
# Navigate to project root
cd ../..

# Build and push containers to ECR
./infra/scripts/build-and-push.sh production
```

This script will:
- Build Docker images for Gateway and Hi.Events services
- Push images to ECR repositories
- Run security scans
- Generate deployment variables

#### 2.2. Deploy ECS Services
```bash
# Deploy services with new container images
./infra/scripts/deploy-services.sh production
```

This script will:
- Update ECS task definitions with new images
- Deploy services with rolling updates
- Monitor deployment progress
- Run health checks
- Automatically rollback on failure

### Phase 3: DNS and SSL Configuration (5-10 minutes)

#### 3.1. Verify SSL Certificate
```bash
# Check ACM certificate status
aws acm describe-certificate \
    --certificate-arn $(terraform output -raw certificate_arn)
```

#### 3.2. Update Domain DNS
```bash
# Get CloudFront distribution domain name
terraform output cloudfront_domain_name

# The Terraform configuration automatically creates Route 53 records
# Verify DNS propagation
dig api.bole.to
```

### Phase 4: Verification and Monitoring (10-15 minutes)

#### 4.1. Run Deployment Verification
```bash
# Comprehensive deployment verification
./infra/scripts/verify-deployment.sh production api.bole.to
```

This will test:
- HTTP/HTTPS endpoints
- SSL/TLS configuration
- Security headers
- Authentication endpoints
- Performance metrics
- AWS services health

#### 4.2. Configure Monitoring
```bash
# View CloudWatch dashboard URL
terraform output cloudwatch_dashboard_url

# Set up CloudWatch alarms (already configured via Terraform)
# Configure Slack/PagerDuty integrations if needed
```

## Post-Deployment Configuration

### 1. Stripe Webhook Configuration
1. Log into Stripe Dashboard
2. Go to Developers → Webhooks
3. Add endpoint: `https://api.bole.to/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. OAuth Application Configuration

#### Google OAuth:
1. Go to Google Cloud Console → APIs & Credentials
2. Update authorized redirect URIs:
   - `https://api.bole.to/auth/google/callback`
3. Update authorized JavaScript origins:
   - `https://api.bole.to`

#### Apple Sign-In:
1. Go to Apple Developer Portal → Certificates, Identifiers & Profiles
2. Update service ID configuration:
   - Return URLs: `https://api.bole.to/auth/apple/callback`
   - Domains: `api.bole.to`

### 3. Mobile App Configuration
Update your mobile app configuration:

```javascript
// Update API base URL
const API_BASE_URL = 'https://api.bole.to';

// Update OAuth redirect URIs
const OAUTH_REDIRECT_URI = 'com.bole.to://auth/callback';
```

## Monitoring and Alerting

### CloudWatch Dashboards
- **Main Dashboard**: Overview of all services
- **Performance Dashboard**: Response times and throughput
- **Error Dashboard**: Error rates and failed requests

### Key Metrics to Monitor
- Application Load Balancer response time (< 2s)
- ECS service CPU/memory utilization (< 80%)
- RDS connections and performance
- CloudFront cache hit ratio
- Payment success rate (> 98%)

### Alerting Channels
- **Critical**: PagerDuty for immediate response
- **Warning**: Email notifications
- **Info**: Slack channel updates

## Backup and Disaster Recovery

### Automated Backups
- **RDS**: 7-day automated backups with point-in-time recovery
- **S3**: Versioning enabled with lifecycle policies
- **ECS**: Container images stored in ECR with retention policies

### Disaster Recovery Procedures
1. **Database Failover**: RDS Multi-AZ automatic failover (< 1 minute)
2. **Application Recovery**: ECS auto-scaling and health checks
3. **DNS Failover**: Route 53 health checks and failover routing

### Backup Testing
```bash
# Test database backup restoration (staging)
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier boleto-test-restore \
    --db-snapshot-identifier rds:boleto-production-postgres-snapshot

# Test container image deployment
./infra/scripts/deploy-services.sh staging
```

## Security Considerations

### Network Security
- All services in private subnets
- WAF protection with managed rules
- VPC Flow Logs enabled
- NACLs for additional layer security

### Data Protection
- All data encrypted at rest (RDS, S3, ElastiCache)
- TLS 1.3 for data in transit
- Secrets Manager for sensitive configuration
- KMS customer-managed keys

### Access Control
- IAM roles with least-privilege principle
- No long-term access keys
- CloudTrail for audit logging
- VPC endpoints for AWS service access

## Cost Optimization

### Monthly Cost Estimates (USD)
- **Compute (ECS Fargate)**: $150-230
- **Database (RDS Multi-AZ)**: $120-150
- **Load Balancer**: $22
- **CloudFront CDN**: $10-20
- **NAT Gateways**: $90
- **ElastiCache**: $30-40
- **Storage & Other**: $35-50
- **Total**: $457-602/month

### Cost Optimization Strategies
1. **Reserved Instances**: 40% savings for predictable workloads
2. **Spot Instances**: For non-critical batch processing
3. **S3 Intelligent Tiering**: Automatic storage class transitions
4. **CloudWatch Insights**: Monitor and optimize resource usage
5. **Regular Reviews**: Monthly cost analysis and right-sizing

## Maintenance and Updates

### Regular Maintenance Tasks
- **Weekly**: Review CloudWatch dashboards and alerts
- **Monthly**: Security patches and dependency updates
- **Quarterly**: Cost optimization review
- **Annually**: Disaster recovery testing

### Update Procedures
1. **Container Updates**: Use blue/green deployments
2. **Database Updates**: Schedule during maintenance windows
3. **Infrastructure Updates**: Use Terraform plan/apply workflow
4. **Security Updates**: Automated via ECS service updates

## Troubleshooting

### Common Issues

#### 1. 502 Bad Gateway Errors
```bash
# Check ECS service health
aws ecs describe-services \
    --cluster boleto-production-cluster \
    --services boleto-production-gateway

# Check CloudWatch logs
aws logs tail /aws/ecs/boleto-production/gateway --follow
```

#### 2. Database Connection Issues
```bash
# Check RDS instance status
aws rds describe-db-instances \
    --db-instance-identifier boleto-production-postgres

# Check security group rules
aws ec2 describe-security-groups \
    --group-ids sg-xxxxxxxxx
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate \
    --certificate-arn $(terraform output -raw certificate_arn)

# Verify DNS validation
dig _acme-challenge.api.bole.to TXT
```

### Support Escalation
1. **Level 1**: CloudWatch logs and basic troubleshooting
2. **Level 2**: AWS Support for infrastructure issues
3. **Level 3**: Application team for code-related problems

## Success Criteria

### Technical Metrics
- **Availability**: > 99.9% uptime
- **Performance**: < 2s average response time
- **Security**: Zero critical vulnerabilities
- **Reliability**: Payment success rate > 98%

### Business Metrics
- **User Experience**: Mobile app loads in < 3s
- **Payment Processing**: Zero payment processing downtime
- **Scalability**: Handle 10x traffic spikes
- **Cost**: Stay within $600/month budget

## Next Steps After Deployment

1. **Load Testing**: Run comprehensive load tests
2. **Security Audit**: Conduct penetration testing
3. **Performance Optimization**: Fine-tune based on real traffic
4. **Documentation**: Update operational runbooks
5. **Team Training**: Ensure team familiarity with production environment

## Contact and Support

- **Infrastructure Team**: devops@bole.to
- **Security Team**: security@bole.to  
- **AWS Support**: Business Support Plan
- **Emergency Contact**: +1-XXX-XXX-XXXX

---

**Last Updated**: $(date -u +%Y-%m-%d)  
**Version**: 1.0  
**Environment**: Production