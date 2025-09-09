# Production Deployment Guide for Bole.to

## Overview

This comprehensive guide covers the complete production deployment process for the Bole.to event ticketing platform, including infrastructure provisioning, application deployment, and post-deployment verification.

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.x) with appropriate permissions
2. **Terraform** (v1.5+) for infrastructure provisioning
3. **Docker** for container image building
4. **kubectl** for Kubernetes management (if using EKS)
5. **jq** for JSON processing
6. **git** for version control

### AWS Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "rds:*",
        "elasticache:*",
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "acm:*",
        "iam:*",
        "kms:*",
        "secretsmanager:*",
        "ssm:*",
        "logs:*",
        "cloudwatch:*",
        "sns:*",
        "lambda:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Environment Variables

Create a `.env.production` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=production

# Domain Configuration
DOMAIN_NAME=api.bole.to
HOSTED_ZONE_ID=Z1234567890ABC

# Database Configuration
DB_PASSWORD=SECURE_RANDOM_PASSWORD

# JWT Keys (RSA key pair)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtB..."

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=com.bole.to
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
NOTIFICATION_EMAIL=devops@bole.to
```

## Deployment Process

### Phase 1: Infrastructure Provisioning

#### 1.1 Initialize Terraform Backend

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket boleto-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket boleto-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

#### 1.2 Deploy Infrastructure

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Plan deployment
terraform plan -out=production.tfplan

# Apply infrastructure
terraform apply production.tfplan

# Save outputs
terraform output -json > outputs.json
```

### Phase 2: SSL Certificate Setup

```bash
cd ../ssl-setup

# Automated certificate setup
./certificate-automation.sh \
  --domain api.bole.to \
  --zone bole.to \
  --region us-east-1 \
  --email devops@bole.to

# Verify certificate
aws acm list-certificates --region us-east-1
```

### Phase 3: Secrets Management Setup

```bash
cd ../secrets

# Load environment variables
source ../../.env.production

# Set up secrets
./setup-secrets.sh \
  --environment production \
  --region us-east-1

# Verify secrets
aws secretsmanager list-secrets --region us-east-1
```

### Phase 4: Database Migration

```bash
cd ../database

# Set database connection details from Terraform outputs
export DB_HOST=$(jq -r '.rds_endpoint.value' ../terraform/outputs.json)
export DB_NAME=boleto_production
export DB_USER=boleto_admin
export DB_PASSWORD=${DATABASE_PASSWORD}
export DB_APP_PASSWORD=${DB_APP_PASSWORD:-$(openssl rand -base64 32)}

# Run database migration
./migration-script.sh

# Verify database setup
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\l"
```

### Phase 5: Container Images

#### 5.1 Set up ECR Repositories

```bash
# Create ECR repositories
aws ecr create-repository --repository-name boleto/gateway --region us-east-1
aws ecr create-repository --repository-name boleto/hi-events --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

#### 5.2 Build and Push Gateway Image

```bash
cd ../../services/gateway

# Build production image
docker build \
  --platform linux/amd64 \
  -t boleto/gateway:latest \
  -f Dockerfile .

# Tag for ECR
docker tag boleto/gateway:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/boleto/gateway:latest

# Push to ECR
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/boleto/gateway:latest
```

#### 5.3 Build and Push Hi.Events Image

```bash
cd ../hi-events

# Build production image
docker build \
  --platform linux/amd64 \
  -t boleto/hi-events:latest \
  -f Dockerfile .

# Tag for ECR
docker tag boleto/hi-events:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/boleto/hi-events:latest

# Push to ECR
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/boleto/hi-events:latest
```

### Phase 6: Deploy Applications

#### 6.1 Update ECS Services

```bash
# Get ECS cluster and service names from Terraform outputs
CLUSTER_NAME=$(jq -r '.ecs_cluster_name.value' infra/terraform/outputs.json)
GATEWAY_SERVICE=$(jq -r '.gateway_service_name.value' infra/terraform/outputs.json)
HIEVENTS_SERVICE=$(jq -r '.hievents_service_name.value' infra/terraform/outputs.json)

# Update Gateway service
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$GATEWAY_SERVICE" \
  --force-new-deployment

# Update Hi.Events service  
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$HIEVENTS_SERVICE" \
  --force-new-deployment

# Monitor deployment
aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services "$GATEWAY_SERVICE" "$HIEVENTS_SERVICE"
```

### Phase 7: DNS Configuration

```bash
# Verify CloudFront distribution is ready
DISTRIBUTION_ID=$(jq -r '.cloudfront_distribution_id.value' infra/terraform/outputs.json)
aws cloudfront get-distribution --id "$DISTRIBUTION_ID"

# DNS should already be configured by Terraform
# Verify DNS resolution
dig api.bole.to
```

### Phase 8: Post-Deployment Verification

```bash
cd infra/deployment

# Run comprehensive verification
./verify-deployment.sh --environment production
```

## Deployment Verification Checklist

### Infrastructure Verification

- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] Load balancer healthy
- [ ] ECS services running
- [ ] RDS database accessible
- [ ] ElastiCache Redis accessible
- [ ] S3 buckets created
- [ ] CloudFront distribution deployed

### Application Verification

- [ ] Health checks returning 200
- [ ] SSL certificate valid
- [ ] HTTPS redirects working
- [ ] Authentication endpoints functional
- [ ] Database connections working
- [ ] Redis sessions working
- [ ] Hi.Events proxy working

### Security Verification

- [ ] Secrets Manager accessible
- [ ] Parameter Store accessible
- [ ] IAM roles correctly assigned
- [ ] Security groups restrictive
- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled

### Monitoring Verification

- [ ] CloudWatch logs flowing
- [ ] Metrics being collected
- [ ] Alarms configured
- [ ] SNS notifications working
- [ ] Dashboard accessible

## Rollback Procedures

### Quick Rollback (Service Level)

```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$GATEWAY_SERVICE" \
  --task-definition "boleto-gateway:previous-revision"

# Rollback Hi.Events service
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$HIEVENTS_SERVICE" \
  --task-definition "boleto-hievents:previous-revision"
```

### Full Rollback (Infrastructure)

```bash
# Restore from previous Terraform state
cd infra/terraform

# List state versions
aws s3api list-object-versions \
  --bucket boleto-terraform-state \
  --prefix production/terraform.tfstate

# Download previous state
aws s3api get-object \
  --bucket boleto-terraform-state \
  --key production/terraform.tfstate \
  --version-id "VERSION_ID" \
  terraform.tfstate.backup

# Apply previous configuration
terraform apply -state=terraform.tfstate.backup
```

## Troubleshooting

### Common Issues

#### ECS Service Won't Start

```bash
# Check service events
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$GATEWAY_SERVICE" \
  --query "services[0].events"

# Check task logs
aws logs describe-log-groups --log-group-name-prefix "/ecs/boleto"
aws logs get-log-events \
  --log-group-name "/ecs/boleto-production-gateway" \
  --log-stream-name "STREAM_NAME"
```

#### Database Connection Issues

```bash
# Test database connectivity
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT 1;"

# Check security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*rds*"
```

#### SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1

# Test SSL connectivity
openssl s_client -connect api.bole.to:443 -servername api.bole.to
```

### Performance Issues

#### High Response Times

```bash
# Check ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value="$GATEWAY_SERVICE" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Check database performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value="$DB_INSTANCE_ID" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Maintenance Windows

### Scheduled Maintenance

1. **Database Maintenance**: Sundays 2-4 AM EST
2. **Application Updates**: Tuesdays 10 PM EST
3. **Infrastructure Updates**: Monthly, during low traffic

### Maintenance Procedures

```bash
# Enable maintenance mode
aws ssm put-parameter \
  --name "/boleto/production/maintenance_mode" \
  --value "true" \
  --type "String" \
  --overwrite

# Perform maintenance tasks
# ...

# Disable maintenance mode
aws ssm put-parameter \
  --name "/boleto/production/maintenance_mode" \
  --value "false" \
  --type "String" \
  --overwrite
```

## Security Considerations

### Post-Deployment Security Checks

1. **Vulnerability Scanning**: Run security scans on deployed images
2. **Penetration Testing**: Schedule third-party security assessment
3. **Access Review**: Audit IAM permissions and access logs
4. **Certificate Monitoring**: Set up certificate expiration alerts

### Ongoing Security Maintenance

1. **Regular Updates**: Keep base images and dependencies updated
2. **Secret Rotation**: Rotate secrets according to security policy
3. **Access Logs**: Monitor and analyze access patterns
4. **Incident Response**: Maintain updated incident response procedures

## Cost Optimization

### Cost Monitoring Setup

```bash
# Set up cost alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget-alert.json
```

### Regular Cost Reviews

1. **Monthly**: Review cost and usage reports
2. **Quarterly**: Optimize resource allocation
3. **Annually**: Evaluate Reserved Instance opportunities

## Next Steps

After successful deployment:

1. **Load Testing**: Perform comprehensive load testing
2. **Monitoring Setup**: Configure custom dashboards and alerts
3. **Backup Testing**: Verify backup and restore procedures
4. **Documentation**: Update operational runbooks
5. **Team Training**: Train team on new production environment

## Support and Escalation

### 24/7 Support Contacts

- **Critical Issues**: PagerDuty escalation
- **Infrastructure**: AWS Support (Business/Enterprise)
- **Application**: Development team on-call
- **Security**: Security team hotline