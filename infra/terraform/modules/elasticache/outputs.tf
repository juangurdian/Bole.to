# ElastiCache Module Outputs

output "cluster_id" {
  description = "ElastiCache cluster ID"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "primary_endpoint" {
  description = "Primary endpoint for the ElastiCache cluster"
  value       = aws_elasticache_replication_group.main.primary_endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint for the ElastiCache cluster"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "redis_endpoint" {
  description = "Redis endpoint (primary)"
  value       = aws_elasticache_replication_group.main.primary_endpoint
}

output "port" {
  description = "Port number for the ElastiCache cluster"
  value       = aws_elasticache_replication_group.main.port
}

output "auth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the Redis auth token"
  value       = var.transit_encryption_enabled ? aws_secretsmanager_secret.redis_auth[0].arn : null
}

output "parameter_group_name" {
  description = "Name of the ElastiCache parameter group"
  value       = aws_elasticache_parameter_group.main.name
}

output "subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}