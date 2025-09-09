# Bole.to Production Infrastructure
# Terraform configuration for AWS deployment

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Remote state configuration - update with your S3 bucket
  backend "s3" {
    bucket = "boleto-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    
    # DynamoDB table for state locking
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment   = var.environment
      Project       = "bole.to"
      ManagedBy     = "terraform"
      Owner         = var.project_owner
      CostCenter    = "engineering"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix        = local.name_prefix
  cidr_block         = var.vpc_cidr
  availability_zones = local.availability_zones
  
  # Subnets
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_flow_logs   = true
  
  tags = local.common_tags
}

# Security Groups
module "security_groups" {
  source = "./modules/security"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  
  tags = local.common_tags
}

# ACM Certificate
module "acm" {
  source = "./modules/acm"
  
  domain_name = var.domain_name
  zone_id     = var.route53_zone_id
  
  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.public_subnet_ids
  
  certificate_arn = module.acm.certificate_arn
  security_group_id = module.security_groups.alb_security_group_id
  
  tags = local.common_tags
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  
  # Load balancer configuration
  target_group_gateway_arn    = module.alb.gateway_target_group_arn
  target_group_hievents_arn   = module.alb.hievents_target_group_arn
  
  # Security groups
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  
  # Task execution role
  execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn      = module.iam.ecs_task_role_arn
  
  # Database and cache endpoints
  database_endpoint = module.rds.endpoint
  redis_endpoint    = module.elasticache.redis_endpoint
  
  # Environment configuration
  environment = var.environment
  
  tags = local.common_tags
}

# RDS PostgreSQL Database
module "rds" {
  source = "./modules/rds"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.database_subnet_ids
  
  # Database configuration
  engine_version    = var.db_engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_encrypted = true
  
  database_name = var.db_name
  master_username = var.db_username
  
  # Security
  security_group_id = module.security_groups.rds_security_group_id
  kms_key_id       = module.kms.rds_key_arn
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Multi-AZ for production
  multi_az = var.environment == "production" ? true : false
  
  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"
  
  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.database_subnet_ids
  
  # Redis configuration
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_nodes
  parameter_group_name = "default.redis7"
  
  # Security
  security_group_id = module.security_groups.redis_security_group_id
  
  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = local.common_tags
}

# S3 Buckets
module "s3" {
  source = "./modules/s3"
  
  name_prefix = local.name_prefix
  environment = var.environment
  
  # KMS encryption
  kms_key_arn = module.kms.s3_key_arn
  
  tags = local.common_tags
}

# KMS Keys for encryption
module "kms" {
  source = "./modules/kms"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  
  # S3 bucket ARNs for task role permissions
  s3_static_assets_bucket_arn = module.s3.static_assets_bucket_arn
  s3_backups_bucket_arn      = module.s3.backups_bucket_arn
  
  # Secrets Manager ARN
  secrets_manager_arn = aws_secretsmanager_secret.app_secrets.arn
  
  tags = local.common_tags
}

# CloudWatch Monitoring
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  name_prefix = local.name_prefix
  
  # ECS cluster and service names
  ecs_cluster_name       = module.ecs.cluster_name
  gateway_service_name   = module.ecs.gateway_service_name
  hievents_service_name  = module.ecs.hievents_service_name
  
  # Database and cache identifiers
  rds_instance_id = module.rds.instance_id
  redis_cluster_id = module.elasticache.cluster_id
  
  # Load balancer ARN
  alb_arn = module.alb.alb_arn
  
  # SNS topic for alerts
  sns_topic_arn = aws_sns_topic.alerts.arn
  
  tags = local.common_tags
}

# Secrets Manager for application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix = "${local.name_prefix}-secrets"
  description = "Application secrets for ${var.project_name} ${var.environment}"
  
  kms_key_id = module.kms.secrets_key_arn
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-secrets"
  })
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  
  secret_string = jsonencode({
    DATABASE_PASSWORD = var.db_password
    JWT_PRIVATE_KEY   = var.jwt_private_key
    JWT_PUBLIC_KEY    = var.jwt_public_key
    GOOGLE_CLIENT_ID  = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    APPLE_CLIENT_ID   = var.apple_client_id
    APPLE_KEY_ID      = var.apple_key_id
    APPLE_TEAM_ID     = var.apple_team_id
    APPLE_PRIVATE_KEY = var.apple_private_key
    STRIPE_SECRET_KEY = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
  })
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name_prefix = "${local.name_prefix}-alerts"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = length(var.alert_email_addresses)
  
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  
  name_prefix = local.name_prefix
  domain_name = var.domain_name
  
  # ALB origin
  alb_domain_name = module.alb.dns_name
  
  # S3 static assets origin
  s3_bucket_domain_name = module.s3.static_assets_bucket_domain_name
  
  # ACM certificate (must be in us-east-1 for CloudFront)
  certificate_arn = module.acm.certificate_arn
  
  tags = local.common_tags
}

# Route 53 DNS Records
resource "aws_route53_record" "main" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = module.cloudfront.domain_name
    zone_id                = module.cloudfront.hosted_zone_id
    evaluate_target_health = false
  }
}

# Systems Manager Parameter Store for non-sensitive configuration
resource "aws_ssm_parameter" "app_config" {
  for_each = {
    "/boleto/${var.environment}/NODE_ENV"           = var.environment
    "/boleto/${var.environment}/JWT_ISSUER"         = "https://${var.domain_name}"
    "/boleto/${var.environment}/JWT_AUDIENCE"       = "boleto-mobile"
    "/boleto/${var.environment}/CORS_ORIGINS"       = join(",", var.cors_origins)
    "/boleto/${var.environment}/RATE_LIMIT_MAX"     = var.rate_limit_max
    "/boleto/${var.environment}/HIEVENTS_API_URL"   = var.hievents_api_url
    "/boleto/${var.environment}/REDIS_URL"          = "redis://${module.elasticache.redis_endpoint}:6379"
  }
  
  name  = each.key
  type  = "String"
  value = each.value
  
  tags = merge(local.common_tags, {
    Name = each.key
  })
}