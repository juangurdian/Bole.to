# Secrets Management Strategy for Bole.to Production

## Overview

This document outlines the comprehensive secrets management strategy for the Bole.to production environment, ensuring secure storage, access, and rotation of sensitive configuration data.

## Architecture

### AWS Services Used

1. **AWS Secrets Manager**: For highly sensitive secrets (passwords, API keys, certificates)
2. **AWS Systems Manager Parameter Store**: For configuration values and less sensitive data
3. **AWS KMS**: For encryption key management
4. **IAM Roles**: For access control and least-privilege permissions

### Secret Categories

| Category | Storage | Encryption | Rotation |
|----------|---------|------------|----------|
| Database passwords | Secrets Manager | KMS | Automatic |
| API keys (OAuth, Stripe) | Secrets Manager | KMS | Manual |
| JWT keys | Secrets Manager | KMS | Manual |
| Configuration values | Parameter Store | KMS | N/A |
| Feature flags | Parameter Store | No | N/A |

## Secrets Inventory

### AWS Secrets Manager Secrets

```json
{
  "boleto-production-secrets": {
    "DATABASE_PASSWORD": "strong-random-password",
    "JWT_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...",
    "JWT_PUBLIC_KEY": "-----BEGIN PUBLIC KEY-----\n...",
    "GOOGLE_CLIENT_ID": "google-oauth-client-id",
    "GOOGLE_CLIENT_SECRET": "google-oauth-client-secret",
    "APPLE_CLIENT_ID": "com.bole.to",
    "APPLE_KEY_ID": "apple-key-id",
    "APPLE_TEAM_ID": "apple-team-id",
    "APPLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...",
    "STRIPE_SECRET_KEY": "sk_live_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "REDIS_AUTH_TOKEN": "redis-auth-token",
    "SESSION_SECRET": "session-encryption-secret",
    "WEBHOOK_SECRET": "internal-webhook-secret"
  }
}
```

### Systems Manager Parameters

```
/boleto/production/NODE_ENV = production
/boleto/production/LOG_LEVEL = info
/boleto/production/PORT = 3001
/boleto/production/JWT_ISSUER = https://api.bole.to
/boleto/production/JWT_AUDIENCE = boleto-mobile
/boleto/production/JWT_ALGORITHM = RS256
/boleto/production/CORS_ORIGINS = https://app.bole.to,https://www.bole.to,com.bole.to://
/boleto/production/RATE_LIMIT_WINDOW_MS = 900000
/boleto/production/RATE_LIMIT_MAX_REQUESTS = 100
/boleto/production/RATE_LIMIT_AUTH_WINDOW_MS = 300000
/boleto/production/RATE_LIMIT_AUTH_MAX_REQUESTS = 10
/boleto/production/REQUEST_TIMEOUT = 30000
/boleto/production/HIEVENTS_API_URL = http://hi-events-service:8000/api
/boleto/production/DATABASE_HOST = rds-endpoint
/boleto/production/DATABASE_PORT = 5432
/boleto/production/DATABASE_NAME = boleto_production
/boleto/production/DATABASE_USER = boleto_app
/boleto/production/REDIS_HOST = redis-endpoint
/boleto/production/REDIS_PORT = 6379
/boleto/production/REDIS_DB = 0
/boleto/production/BACKUP_ENABLED = true
/boleto/production/METRICS_ENABLED = true
/boleto/production/HEALTH_CHECK_INTERVAL = 30
```

## Implementation

### 1. Terraform Configuration for Secrets

The main Terraform configuration already includes Secrets Manager setup. Here's the detailed implementation:

```hcl
# KMS Keys for encryption
resource "aws_kms_key" "secrets" {
  description = "KMS key for Secrets Manager encryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow ECS tasks to decrypt"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.ecs_task_role.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "boleto-secrets-key"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/boleto-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix = "boleto-production-secrets"
  description = "Application secrets for Bole.to production"
  
  kms_key_id = aws_kms_key.secrets.arn
  
  # Enable automatic rotation for database password
  automatic_rotation {
    enabled                = true
    schedule_expression    = "rate(90 days)"
    rotation_lambda_arn    = aws_lambda_function.rotate_db_password.arn
  }
  
  tags = {
    Environment = "production"
    Application = "boleto"
  }
}
```

### 2. Container Environment Variables

ECS task definitions reference secrets and parameters:

```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "valueFrom": "arn:aws:ssm:us-east-1:ACCOUNT:parameter/boleto/production/NODE_ENV"
    },
    {
      "name": "JWT_ISSUER",
      "valueFrom": "arn:aws:ssm:us-east-1:ACCOUNT:parameter/boleto/production/JWT_ISSUER"
    }
  ],
  "secrets": [
    {
      "name": "DATABASE_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:boleto-production-secrets:DATABASE_PASSWORD::"
    },
    {
      "name": "JWT_PRIVATE_KEY",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:boleto-production-secrets:JWT_PRIVATE_KEY::"
    }
  ]
}
```

### 3. Application Configuration

Update the Gateway service to use environment variables:

```javascript
// src/config/index.js
const config = {
  // Server configuration
  port: parseInt(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD, // From Secrets Manager
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    db: parseInt(process.env.REDIS_DB) || 0,
    password: process.env.REDIS_AUTH_TOKEN, // From Secrets Manager
  },
  
  // JWT configuration
  jwt: {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    algorithm: process.env.JWT_ALGORITHM || 'RS256',
    privateKey: process.env.JWT_PRIVATE_KEY, // From Secrets Manager
    publicKey: process.env.JWT_PUBLIC_KEY,   // From Secrets Manager
  },
  
  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,     // From Secrets Manager
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // From Secrets Manager
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,      // From Secrets Manager
      keyId: process.env.APPLE_KEY_ID,            // From Secrets Manager
      teamId: process.env.APPLE_TEAM_ID,          // From Secrets Manager
      privateKey: process.env.APPLE_PRIVATE_KEY,  // From Secrets Manager
    },
  },
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,        // From Secrets Manager
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, // From Secrets Manager
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 300000,
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 10,
  },
  
  // External services
  hiEvents: {
    apiUrl: process.env.HIEVENTS_API_URL,
  },
};

module.exports = config;
```

## Security Best Practices

### 1. Access Control

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:boleto-production-secrets*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": [
        "arn:aws:ssm:us-east-1:ACCOUNT:parameter/boleto/production/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:us-east-1:ACCOUNT:key/KEY-ID"
      ]
    }
  ]
}
```

### 2. Encryption in Transit and at Rest

- All secrets encrypted with KMS
- TLS 1.2+ for all API communications
- Environment variables loaded at runtime, not build time

### 3. Audit and Monitoring

```yaml
CloudWatchAlarms:
  - SecretAccessFailures
  - UnauthorizedSecretAccess
  - ParameterStoreAccessFailures
  
CloudTrailEvents:
  - secretsmanager:GetSecretValue
  - ssm:GetParameter
  - kms:Decrypt
```

## Secret Rotation

### Automatic Rotation

1. **Database Passwords**: Every 90 days using Lambda function
2. **API Keys**: Manual rotation with advance notification
3. **JWT Keys**: Manual rotation during maintenance windows

### Rotation Process

1. Generate new secret
2. Update Secrets Manager
3. Restart ECS services to pick up new values
4. Verify functionality
5. Remove old secrets

## Deployment Process

### 1. Initial Secret Setup

```bash
# Set up secrets during initial deployment
aws secretsmanager create-secret \
  --name "boleto-production-secrets" \
  --description "Production secrets for Bole.to" \
  --secret-string file://secrets.json \
  --kms-key-id alias/boleto-secrets

# Set up parameters
aws ssm put-parameter \
  --name "/boleto/production/NODE_ENV" \
  --value "production" \
  --type "String"
```

### 2. Secret Updates

```bash
# Update existing secret
aws secretsmanager update-secret \
  --secret-id "boleto-production-secrets" \
  --secret-string file://updated-secrets.json

# Force ECS service restart to pick up new secrets
aws ecs update-service \
  --cluster boleto-production \
  --service gateway-service \
  --force-new-deployment
```

## Disaster Recovery

### Backup Strategy

1. Secrets Manager automatically backs up secrets
2. Parameter Store values included in infrastructure backups
3. KMS keys have automatic backup and cross-region replication

### Recovery Process

1. Restore infrastructure from Terraform state
2. Verify secret accessibility
3. Restart services with secret validation

## Monitoring and Alerting

### CloudWatch Metrics

- Secret retrieval success/failure rates
- Parameter Store access patterns
- KMS key usage metrics

### Alerts

- Failed secret retrievals
- Unauthorized access attempts
- Secret rotation failures
- KMS key usage anomalies

## Compliance

### Security Standards

- SOC 2 Type II compliance
- GDPR data protection requirements
- PCI DSS for payment data (Stripe keys)

### Audit Requirements

- All secret access logged to CloudTrail
- Regular security reviews and audits
- Secret rotation tracking and reporting