# SSL/TLS Certificate and Domain Setup Guide

## Overview

This guide covers the setup of SSL/TLS certificates and domain configuration for the Bole.to production deployment at `api.bole.to`.

## Prerequisites

1. AWS Route 53 hosted zone for `bole.to` domain
2. AWS CLI configured with appropriate permissions
3. Domain ownership verification
4. Certificate Manager permissions

## Domain Configuration Steps

### 1. Route 53 Hosted Zone Setup

```bash
# Create hosted zone (if not already exists)
aws route53 create-hosted-zone \
    --name bole.to \
    --caller-reference "boleto-$(date +%Y%m%d-%H%M%S)" \
    --hosted-zone-config Comment="Bole.to production domain"

# Get the hosted zone ID
aws route53 list-hosted-zones-by-name --dns-name bole.to
```

### 2. Certificate Request and Validation

The Terraform configuration automatically handles certificate creation, but here's the manual process if needed:

```bash
# Request ACM certificate
aws acm request-certificate \
    --domain-name api.bole.to \
    --subject-alternative-names "*.api.bole.to" \
    --validation-method DNS \
    --region us-east-1

# Get certificate ARN
aws acm list-certificates --region us-east-1
```

### 3. DNS Validation Records

When using DNS validation, ACM will provide CNAME records to add to Route 53:

```bash
# Get validation records
aws acm describe-certificate \
    --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
    --region us-east-1
```

## Automated Setup Script

Here's an automated setup script for domain configuration:

```bash
#!/bin/bash

# Domain Setup Script for Bole.to
set -euo pipefail

DOMAIN_NAME="${DOMAIN_NAME:-api.bole.to}"
HOSTED_ZONE_NAME="${HOSTED_ZONE_NAME:-bole.to}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "Setting up SSL certificate for $DOMAIN_NAME"

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name "$HOSTED_ZONE_NAME" \
    --query "HostedZones[0].Id" \
    --output text | sed 's|/hostedzone/||')

if [[ "$HOSTED_ZONE_ID" == "None" ]]; then
    echo "Error: Hosted zone for $HOSTED_ZONE_NAME not found"
    exit 1
fi

echo "Found hosted zone ID: $HOSTED_ZONE_ID"

# Request certificate
CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --validation-method DNS \
    --region "$AWS_REGION" \
    --query "CertificateArn" \
    --output text)

echo "Certificate requested: $CERT_ARN"

# Wait for validation records
echo "Waiting for validation records..."
sleep 10

# Get validation records
VALIDATION_RECORDS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$AWS_REGION" \
    --query "Certificate.DomainValidationOptions[0].ResourceRecord" \
    --output json)

VALIDATION_NAME=$(echo "$VALIDATION_RECORDS" | jq -r '.Name')
VALIDATION_VALUE=$(echo "$VALIDATION_RECORDS" | jq -r '.Value')

echo "Adding DNS validation record..."
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "{
        \"Changes\": [{
            \"Action\": \"CREATE\",
            \"ResourceRecordSet\": {
                \"Name\": \"$VALIDATION_NAME\",
                \"Type\": \"CNAME\",
                \"TTL\": 300,
                \"ResourceRecords\": [{
                    \"Value\": \"$VALIDATION_VALUE\"
                }]
            }
        }]
    }"

echo "DNS validation record added"
echo "Certificate ARN: $CERT_ARN"
echo "Validation may take 5-10 minutes to complete"
```

## Security Headers Configuration

Configure security headers at the CloudFront and ALB level:

### CloudFront Security Headers

```json
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:; object-src 'none'; media-src 'self'; frame-src 'none';",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}
```

### ALB Security Headers

The Gateway service already includes Helmet middleware for security headers, but additional headers can be configured at the ALB level using Lambda@Edge functions.

## TLS Configuration

### Recommended TLS Settings

1. **TLS Version**: Minimum TLS 1.2
2. **Cipher Suites**: Modern cipher suites only
3. **HSTS**: Enabled with long max-age
4. **Certificate Transparency**: Enabled

### CloudFront Distribution Settings

```yaml
ViewerProtocolPolicy: redirect-to-https
MinimumProtocolVersion: TLSv1.2_2021
SSLSupportMethod: sni-only
```

### ALB TLS Settings

```yaml
SecurityPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
```

## Certificate Rotation

### Automatic Renewal

ACM automatically renews certificates before expiration. Monitor certificate status:

```bash
# Check certificate status
aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --query "Certificate.Status"
```

### Manual Certificate Update

If using custom certificates, set up automated renewal:

1. Use Let's Encrypt with automated renewal
2. Set up CloudWatch alarms for certificate expiration
3. Implement automated certificate replacement

## DNS Configuration

### A Records for api.bole.to

The Terraform configuration automatically creates the necessary DNS records pointing to the CloudFront distribution.

### Additional DNS Records

Consider setting up these additional records:

```bash
# CAA record for certificate authority authorization
aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "bole.to",
                "Type": "CAA",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "0 issue \"amazon.com\""},
                    {"Value": "0 issuewild \"amazon.com\""},
                    {"Value": "0 iodef \"mailto:security@bole.to\""}
                ]
            }
        }]
    }'
```

## Monitoring and Alerts

### Certificate Expiration Monitoring

Set up CloudWatch alarms for certificate expiration:

```yaml
CertificateExpirationAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: SSL-Certificate-Expiration
    MetricName: DaysToExpiry
    Namespace: AWS/CertificateManager
    Statistic: Average
    Period: 86400
    EvaluationPeriods: 1
    Threshold: 30
    ComparisonOperator: LessThanThreshold
```

### TLS/SSL Health Checks

Monitor SSL certificate validity and configuration:

1. External SSL monitoring services
2. Custom health checks from multiple regions
3. Certificate transparency log monitoring

## Troubleshooting

### Common Issues

1. **DNS Propagation Delays**: Allow 24-48 hours for full propagation
2. **Certificate Validation Failures**: Verify DNS records are correct
3. **Mixed Content Warnings**: Ensure all resources use HTTPS
4. **CORS Issues**: Configure proper CORS headers for cross-origin requests

### Validation Commands

```bash
# Test SSL certificate
openssl s_client -connect api.bole.to:443 -servername api.bole.to

# Check certificate details
curl -vI https://api.bole.to/healthz

# Test HTTP to HTTPS redirect
curl -I http://api.bole.to/healthz

# Verify security headers
curl -I https://api.bole.to/healthz | grep -i "strict-transport-security\|x-frame-options\|x-content-type-options"
```

## Security Best Practices

1. **Enable HSTS**: Force HTTPS for all connections
2. **Use Strong Ciphers**: Disable weak encryption algorithms
3. **Certificate Pinning**: Consider implementing certificate pinning for mobile apps
4. **Monitor Certificate Transparency**: Watch for unauthorized certificates
5. **Regular Security Audits**: Use SSL Labs, SecurityHeaders.com, etc.

## Post-Deployment Verification

After deployment, verify:

1. ✅ HTTPS redirects work correctly
2. ✅ SSL certificate is valid and trusted
3. ✅ Security headers are present
4. ✅ No mixed content warnings
5. ✅ Certificate chain is complete
6. ✅ HSTS policy is active
7. ✅ DNS records resolve correctly
8. ✅ CDN caching works as expected