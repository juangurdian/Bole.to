# CloudWatch Module Outputs

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "application_log_group_name" {
  description = "Name of the application log group"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "application_log_group_arn" {
  description = "ARN of the application log group"
  value       = aws_cloudwatch_log_group.application_logs.arn
}

output "system_health_alarm_name" {
  description = "Name of the system health composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_health.alarm_name
}

output "system_health_alarm_arn" {
  description = "ARN of the system health composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_health.arn
}