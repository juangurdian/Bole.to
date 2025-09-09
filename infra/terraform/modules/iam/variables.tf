# IAM Module Variables

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  type        = string
}

variable "s3_static_assets_bucket_arn" {
  description = "ARN of the S3 static assets bucket"
  type        = string
}

variable "s3_backups_bucket_arn" {
  description = "ARN of the S3 backups bucket"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}