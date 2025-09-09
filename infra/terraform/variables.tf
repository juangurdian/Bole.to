# Terraform Variables for Bole.to Production Infrastructure

# General Configuration
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "boleto"
}

variable "project_owner" {
  description = "Owner of the project for tagging"
  type        = string
  default     = "bole.to-team"
}

# Domain Configuration
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "api.bole.to"
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for the domain"
  type        = string
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.51.0/24", "10.0.52.0/24"]
}

# Database Configuration
variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "boleto_production"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "boleto_admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Cache Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 2
}

# Application Configuration
variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default = [
    "https://app.bole.to",
    "https://www.bole.to",
    "com.bole.to://"
  ]
}

variable "rate_limit_max" {
  description = "Maximum requests per rate limit window"
  type        = string
  default     = "100"
}

variable "hievents_api_url" {
  description = "Hi.Events API URL (internal)"
  type        = string
  default     = "http://localhost:8000/api"
}

# JWT Configuration
variable "jwt_private_key" {
  description = "JWT RS256 private key"
  type        = string
  sensitive   = true
}

variable "jwt_public_key" {
  description = "JWT RS256 public key"
  type        = string
  sensitive   = true
}

# OAuth Configuration
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "apple_client_id" {
  description = "Apple OAuth client ID"
  type        = string
  sensitive   = true
}

variable "apple_key_id" {
  description = "Apple OAuth key ID"
  type        = string
  sensitive   = true
}

variable "apple_team_id" {
  description = "Apple OAuth team ID"
  type        = string
  sensitive   = true
}

variable "apple_private_key" {
  description = "Apple OAuth private key"
  type        = string
  sensitive   = true
}

# Payment Configuration
variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

# Monitoring Configuration
variable "alert_email_addresses" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}

# Auto Scaling Configuration
variable "gateway_min_capacity" {
  description = "Minimum number of Gateway service tasks"
  type        = number
  default     = 2
}

variable "gateway_max_capacity" {
  description = "Maximum number of Gateway service tasks"
  type        = number
  default     = 10
}

variable "gateway_desired_capacity" {
  description = "Desired number of Gateway service tasks"
  type        = number
  default     = 2
}

variable "hievents_min_capacity" {
  description = "Minimum number of Hi.Events service tasks"
  type        = number
  default     = 2
}

variable "hievents_max_capacity" {
  description = "Maximum number of Hi.Events service tasks"
  type        = number
  default     = 10
}

variable "hievents_desired_capacity" {
  description = "Desired number of Hi.Events service tasks"
  type        = number
  default     = 2
}

# Container Configuration
variable "gateway_cpu" {
  description = "CPU units for Gateway service (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "gateway_memory" {
  description = "Memory for Gateway service in MiB"
  type        = number
  default     = 2048
}

variable "hievents_cpu" {
  description = "CPU units for Hi.Events service (1024 = 1 vCPU)"
  type        = number
  default     = 2048
}

variable "hievents_memory" {
  description = "Memory for Hi.Events service in MiB"
  type        = number
  default     = 4096
}

# Container Images
variable "gateway_image" {
  description = "Docker image for Gateway service"
  type        = string
  default     = "boleto/gateway:latest"
}

variable "hievents_image" {
  description = "Docker image for Hi.Events service"
  type        = string
  default     = "boleto/hi-events:latest"
}

# Feature Flags
variable "enable_https_redirect" {
  description = "Enable HTTPS redirect in ALB"
  type        = bool
  default     = true
}

variable "enable_waf" {
  description = "Enable AWS WAF for additional security"
  type        = bool
  default     = true
}

variable "enable_backup_retention" {
  description = "Enable long-term backup retention"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable RDS Enhanced Monitoring"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable Spot instances for non-critical workloads"
  type        = bool
  default     = false
}

variable "s3_lifecycle_transition_days" {
  description = "Days after which to transition S3 objects to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days after which to delete old S3 objects"
  type        = number
  default     = 365
}