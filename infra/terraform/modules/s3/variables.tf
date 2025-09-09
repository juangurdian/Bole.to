# S3 Module Variables

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "kms_key_arn" {
  description = "KMS key ARN for S3 encryption"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN for bucket policy"
  type        = string
  default     = ""
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for S3 notifications"
  type        = string
  default     = ""
}

# Lifecycle Configuration
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

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}