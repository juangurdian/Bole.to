# ECS Module Variables

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ECS cluster will be created"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for ECS services"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS services"
  type        = string
}

variable "target_group_gateway_arn" {
  description = "Target group ARN for Gateway service"
  type        = string
}

variable "target_group_hievents_arn" {
  description = "Target group ARN for Hi.Events service"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN"
  type        = string
}

variable "secrets_manager_arn" {
  description = "Secrets Manager ARN for application secrets"
  type        = string
}

variable "database_endpoint" {
  description = "RDS database endpoint"
  type        = string
}

variable "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for ECS exec encryption"
  type        = string
  default     = ""
}

# Container Configuration
variable "gateway_image" {
  description = "Docker image for Gateway service"
  type        = string
  default     = "latest"
}

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

variable "hievents_image" {
  description = "Docker image for Hi.Events service"
  type        = string
  default     = "latest"
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

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}