# Terraform Outputs for Bole.to Production Infrastructure

# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnet_ids
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "alb_hosted_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = module.alb.hosted_zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

# CloudFront Outputs
output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "gateway_service_name" {
  description = "Name of the Gateway ECS service"
  value       = module.ecs.gateway_service_name
}

output "hievents_service_name" {
  description = "Name of the Hi.Events ECS service"
  value       = module.ecs.hievents_service_name
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.port
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.instance_id
}

output "database_name" {
  description = "Name of the database"
  value       = var.db_name
}

# Cache Outputs
output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.redis_endpoint
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.elasticache.redis_port
}

# S3 Outputs
output "s3_static_assets_bucket" {
  description = "Name of the S3 bucket for static assets"
  value       = module.s3.static_assets_bucket_name
}

output "s3_backups_bucket" {
  description = "Name of the S3 bucket for backups"
  value       = module.s3.backups_bucket_name
}

output "s3_static_assets_cloudfront_oai" {
  description = "CloudFront Origin Access Identity for static assets"
  value       = module.s3.static_assets_cloudfront_oai
}

# Security Outputs
output "security_group_alb" {
  description = "ID of the ALB security group"
  value       = module.security_groups.alb_security_group_id
}

output "security_group_ecs" {
  description = "ID of the ECS security group"
  value       = module.security_groups.ecs_security_group_id
}

output "security_group_rds" {
  description = "ID of the RDS security group"
  value       = module.security_groups.rds_security_group_id
}

output "security_group_redis" {
  description = "ID of the Redis security group"
  value       = module.security_groups.redis_security_group_id
}

# IAM Outputs
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = module.iam.ecs_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = module.iam.ecs_task_role_arn
}

# KMS Outputs
output "kms_rds_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = module.kms.rds_key_arn
}

output "kms_s3_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = module.kms.s3_key_arn
}

output "kms_secrets_key_arn" {
  description = "ARN of the KMS key for Secrets Manager encryption"
  value       = module.kms.secrets_key_arn
}

# Secrets Manager Outputs
output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

# SNS Outputs
output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# Domain & SSL Outputs
output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = module.acm.certificate_arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.route53_zone_id
}

# Connection Information
output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${var.db_username}:****@${module.rds.endpoint}:${module.rds.port}/${var.db_name}"
  sensitive   = false
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "redis://${module.elasticache.redis_endpoint}:${module.elasticache.redis_port}"
}

# Environment Configuration
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# Application URLs
output "api_url" {
  description = "API URL for the application"
  value       = "https://${var.domain_name}"
}

output "health_check_url" {
  description = "Health check URL"
  value       = "https://${var.domain_name}/healthz"
}

output "jwks_url" {
  description = "JWKS URL for JWT verification"
  value       = "https://${var.domain_name}/.well-known/jwks.json"
}

# Cost Optimization Information
output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD (approximate)"
  value = {
    ecs_fargate      = "$150-230"
    rds_postgresql   = "$120-150"
    elasticache     = "$30-40"
    load_balancer   = "$22"
    nat_gateways    = "$90"
    cloudfront      = "$10-20"
    s3_storage      = "$10-20"
    data_transfer   = "$20-50"
    monitoring      = "$20-30"
    other_services  = "$10-20"
    total_estimate  = "$482-672"
  }
}

# Deployment Information
output "deployment_info" {
  description = "Information needed for deployments"
  value = {
    cluster_name         = module.ecs.cluster_name
    gateway_service_name = module.ecs.gateway_service_name
    hievents_service_name = module.ecs.hievents_service_name
    task_execution_role  = module.iam.ecs_execution_role_arn
    task_role           = module.iam.ecs_task_role_arn
    subnets             = module.vpc.private_subnet_ids
    security_groups     = [module.security_groups.ecs_security_group_id]
  }
}

# Monitoring Information
output "monitoring_info" {
  description = "Information for monitoring setup"
  value = {
    cloudwatch_log_groups = {
      gateway  = "/ecs/${local.name_prefix}-gateway"
      hievents = "/ecs/${local.name_prefix}-hievents"
    }
    sns_topic_arn = aws_sns_topic.alerts.arn
  }
}