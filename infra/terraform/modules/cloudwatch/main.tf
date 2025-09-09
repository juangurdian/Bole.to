# CloudWatch Monitoring Module

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Load Balancer Metrics"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.gateway_service_name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", var.gateway_service_name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.hievents_service_name, "ClusterName", var.ecs_cluster_name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", var.hievents_service_name, "ClusterName", var.ecs_cluster_name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Metrics"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_id],
            ["AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", var.rds_instance_id],
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_instance_id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "RDS Database Metrics"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${var.redis_cluster_id}-001"],
            ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "CacheClusterId", "${var.redis_cluster_id}-001"],
            ["AWS/ElastiCache", "CurrConnections", "CacheClusterId", "${var.redis_cluster_id}-001"],
            ["AWS/ElastiCache", "Evictions", "CacheClusterId", "${var.redis_cluster_id}-001"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ElastiCache Redis Metrics"
          period  = 300
          stat    = "Average"
        }
      }
    ]
  })
  
  depends_on = [
    aws_cloudwatch_log_group.application_logs
  ]
}

# Application Log Groups
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/aws/application/${var.name_prefix}"
  retention_in_days = 7
  kms_key_id        = var.cloudwatch_kms_key_arn
  
  tags = var.tags
}

# Custom Metrics for Application Performance
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "${var.name_prefix}-error-rate"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
  pattern        = "[timestamp, requestId, level=\"ERROR\", ...]"
  
  metric_transformation {
    name      = "${var.name_prefix}-ErrorRate"
    namespace = "Boleto/Application"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_success" {
  name           = "${var.name_prefix}-payment-success"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
  pattern        = "[timestamp, requestId, level, message=\"Payment successful\", ...]"
  
  metric_transformation {
    name      = "${var.name_prefix}-PaymentSuccess"
    namespace = "Boleto/Payments"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "payment_failure" {
  name           = "${var.name_prefix}-payment-failure"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
  pattern        = "[timestamp, requestId, level, message=\"Payment failed\", ...]"
  
  metric_transformation {
    name      = "${var.name_prefix}-PaymentFailure"
    namespace = "Boleto/Payments"
    value     = "1"
  }
}

# CloudWatch Alarms for Critical Metrics
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${var.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5xx errors"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_gateway_cpu" {
  alarm_name          = "${var.name_prefix}-ecs-gateway-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS Gateway CPU utilization"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  
  dimensions = {
    ServiceName = var.gateway_service_name
    ClusterName = var.ecs_cluster_name
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_hievents_cpu" {
  alarm_name          = "${var.name_prefix}-ecs-hievents-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS Hi.Events CPU utilization"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  
  dimensions = {
    ServiceName = var.hievents_service_name
    ClusterName = var.ecs_cluster_name
  }
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "application_error_rate" {
  alarm_name          = "${var.name_prefix}-application-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "${var.name_prefix}-ErrorRate"
  namespace           = "Boleto/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors application error rate"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "payment_failure_rate" {
  alarm_name          = "${var.name_prefix}-payment-high-failure-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "${var.name_prefix}-PaymentFailure"
  namespace           = "Boleto/Payments"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors payment failure rate"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"
  
  tags = var.tags
}

# CloudWatch Composite Alarms
resource "aws_cloudwatch_composite_alarm" "system_health" {
  alarm_name        = "${var.name_prefix}-system-health-composite"
  alarm_description = "Composite alarm for overall system health"
  
  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.alb_response_time.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.alb_5xx_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.ecs_gateway_cpu.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.ecs_hievents_cpu.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.application_error_rate.alarm_name})"
  ])
  
  alarm_actions = [var.sns_topic_arn]
  ok_actions    = [var.sns_topic_arn]
  
  tags = var.tags
}

# CloudWatch Insights Queries
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "${var.name_prefix}-error-analysis"
  
  log_group_names = [
    aws_cloudwatch_log_group.application_logs.name
  ]
  
  query_string = <<EOF
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "payment_analysis" {
  name = "${var.name_prefix}-payment-analysis"
  
  log_group_names = [
    aws_cloudwatch_log_group.application_logs.name
  ]
  
  query_string = <<EOF
fields @timestamp, @message, @requestId
| filter @message like /Payment/
| stats count() by bin(5m)
| sort @timestamp desc
EOF
}

resource "aws_cloudwatch_query_definition" "performance_analysis" {
  name = "${var.name_prefix}-performance-analysis"
  
  log_group_names = [
    aws_cloudwatch_log_group.application_logs.name
  ]
  
  query_string = <<EOF
fields @timestamp, @duration, @requestId, @message
| filter ispresent(@duration)
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
| sort @timestamp desc
EOF
}

data "aws_region" "current" {}