# DigitalOcean Configuration
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

# Application Configuration
variable "app_key" {
  description = "Laravel application key (generate with php artisan key:generate)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
}

# Payment Configuration
variable "stripe_public_key" {
  description = "Stripe publishable key"
  type        = string
  default     = ""
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
  default     = ""
}

# Email Configuration
variable "mail_host" {
  description = "SMTP mail server host"
  type        = string
  default     = "smtp.mailgun.org"
}

variable "mail_port" {
  description = "SMTP mail server port"
  type        = string
  default     = "587"
}

variable "mail_username" {
  description = "SMTP username"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mail_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mail_from_address" {
  description = "Default from email address"
  type        = string
  default     = "noreply@bole.to"
}

# GitHub Configuration
variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/your-org/bole-to.git"
}

# Cost Optimization
variable "enable_production_features" {
  description = "Enable production-grade features (increases cost)"
  type        = bool
  default     = false
}

variable "database_size" {
  description = "Database cluster size"
  type        = string
  default     = "db-s-1vcpu-1gb"  # $15/month
  
  validation {
    condition = contains([
      "db-s-1vcpu-1gb",
      "db-s-1vcpu-2gb",
      "db-s-2vcpu-4gb",
      "db-s-4vcpu-8gb"
    ], var.database_size)
    error_message = "Database size must be a valid DigitalOcean database slug."
  }
}

variable "app_instance_size" {
  description = "App Platform instance size"
  type        = string
  default     = "basic-xxs"  # $5/month
  
  validation {
    condition = contains([
      "basic-xxs",
      "basic-xs",
      "basic-s",
      "basic-m",
      "professional-xs",
      "professional-s",
      "professional-m"
    ], var.app_instance_size)
    error_message = "Instance size must be a valid DigitalOcean App Platform slug."
  }
}