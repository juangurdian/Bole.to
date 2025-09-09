# ECS Module Outputs

output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "gateway_service_name" {
  description = "Name of the Gateway service"
  value       = aws_ecs_service.gateway.name
}

output "gateway_service_arn" {
  description = "ARN of the Gateway service"
  value       = aws_ecs_service.gateway.arn
}

output "hievents_service_name" {
  description = "Name of the Hi.Events service"
  value       = aws_ecs_service.hievents.name
}

output "hievents_service_arn" {
  description = "ARN of the Hi.Events service"
  value       = aws_ecs_service.hievents.arn
}

output "gateway_task_definition_arn" {
  description = "ARN of the Gateway task definition"
  value       = aws_ecs_task_definition.gateway.arn
}

output "hievents_task_definition_arn" {
  description = "ARN of the Hi.Events task definition"
  value       = aws_ecs_task_definition.hievents.arn
}

output "service_discovery_namespace_id" {
  description = "ID of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "ecr_gateway_repository_url" {
  description = "URL of the Gateway ECR repository"
  value       = aws_ecr_repository.gateway.repository_url
}

output "ecr_hievents_repository_url" {
  description = "URL of the Hi.Events ECR repository"
  value       = aws_ecr_repository.hievents.repository_url
}

output "gateway_log_group_name" {
  description = "Name of the Gateway CloudWatch log group"
  value       = aws_cloudwatch_log_group.gateway.name
}

output "hievents_log_group_name" {
  description = "Name of the Hi.Events CloudWatch log group"
  value       = aws_cloudwatch_log_group.hievents.name
}