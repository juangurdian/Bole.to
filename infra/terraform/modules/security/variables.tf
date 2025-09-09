# Security Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks for admin access to bastion"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Should be restricted to your actual admin networks
}

variable "enable_waf_security_group" {
  description = "Enable security group for WAF instances"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}