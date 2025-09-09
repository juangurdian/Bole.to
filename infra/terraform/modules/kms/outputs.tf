# KMS Module Outputs

output "rds_key_id" {
  description = "ID of the RDS KMS key"
  value       = aws_kms_key.rds.key_id
}

output "rds_key_arn" {
  description = "ARN of the RDS KMS key"
  value       = aws_kms_key.rds.arn
}

output "s3_key_id" {
  description = "ID of the S3 KMS key"
  value       = aws_kms_key.s3.key_id
}

output "s3_key_arn" {
  description = "ARN of the S3 KMS key"
  value       = aws_kms_key.s3.arn
}

output "secrets_key_id" {
  description = "ID of the Secrets Manager KMS key"
  value       = aws_kms_key.secrets.key_id
}

output "secrets_key_arn" {
  description = "ARN of the Secrets Manager KMS key"
  value       = aws_kms_key.secrets.arn
}

output "cloudwatch_key_id" {
  description = "ID of the CloudWatch Logs KMS key"
  value       = aws_kms_key.cloudwatch.key_id
}

output "cloudwatch_key_arn" {
  description = "ARN of the CloudWatch Logs KMS key"
  value       = aws_kms_key.cloudwatch.arn
}

output "ecs_key_id" {
  description = "ID of the ECS KMS key"
  value       = aws_kms_key.ecs.key_id
}

output "ecs_key_arn" {
  description = "ARN of the ECS KMS key"
  value       = aws_kms_key.ecs.arn
}