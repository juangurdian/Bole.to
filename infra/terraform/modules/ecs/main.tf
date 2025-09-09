# ECS Cluster and Services Module

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"
  
  configuration {
    execute_command_configuration {
      kms_key_id = var.kms_key_id
      logging    = "OVERRIDE"
      
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = var.tags
}

# CloudWatch Log Group for ECS Exec
resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/aws/ecs/${var.name_prefix}/exec"
  retention_in_days = 7
  
  tags = var.tags
}

# ECR Repositories
resource "aws_ecr_repository" "gateway" {
  name = "${var.name_prefix}-gateway"
  
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "AES256"
  }
  
  tags = var.tags
}

resource "aws_ecr_repository" "hievents" {
  name = "${var.name_prefix}-hievents"
  
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  encryption_configuration {
    encryption_type = "AES256"
  }
  
  tags = var.tags
}

# ECR Repository Policies
resource "aws_ecr_repository_policy" "gateway" {
  repository = aws_ecr_repository.gateway.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = [
            var.execution_role_arn,
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

resource "aws_ecr_repository_policy" "hievents" {
  repository = aws_ecr_repository.hievents.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushPull"
        Effect = "Allow"
        Principal = {
          AWS = [
            var.execution_role_arn,
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# CloudWatch Log Groups for Services
resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/aws/ecs/${var.name_prefix}/gateway"
  retention_in_days = 7
  
  tags = var.tags
}

resource "aws_cloudwatch_log_group" "hievents" {
  name              = "/aws/ecs/${var.name_prefix}/hievents"
  retention_in_days = 7
  
  tags = var.tags
}

# Gateway Service Task Definition
resource "aws_ecs_task_definition" "gateway" {
  family                   = "${var.name_prefix}-gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.gateway_cpu
  memory                   = var.gateway_memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn
  
  container_definitions = jsonencode([
    {
      name  = "gateway"
      image = var.gateway_image
      
      essential = true
      
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "HOST"
          value = "0.0.0.0"
        },
        {
          name  = "HIEVENTS_API_URL"
          value = "http://127.0.0.1:8000"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.secrets_manager_arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_PRIVATE_KEY"
          valueFrom = "${var.secrets_manager_arn}:JWT_PRIVATE_KEY::"
        },
        {
          name      = "JWT_PUBLIC_KEY"
          valueFrom = "${var.secrets_manager_arn}:JWT_PUBLIC_KEY::"
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = "${var.secrets_manager_arn}:GOOGLE_CLIENT_ID::"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "${var.secrets_manager_arn}:GOOGLE_CLIENT_SECRET::"
        },
        {
          name      = "APPLE_CLIENT_ID"
          valueFrom = "${var.secrets_manager_arn}:APPLE_CLIENT_ID::"
        },
        {
          name      = "APPLE_KEY_ID"
          valueFrom = "${var.secrets_manager_arn}:APPLE_KEY_ID::"
        },
        {
          name      = "APPLE_TEAM_ID"
          valueFrom = "${var.secrets_manager_arn}:APPLE_TEAM_ID::"
        },
        {
          name      = "APPLE_PRIVATE_KEY"
          valueFrom = "${var.secrets_manager_arn}:APPLE_PRIVATE_KEY::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.gateway.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:3001/healthz || exit 1"
        ]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = var.tags
}

# Hi.Events Service Task Definition
resource "aws_ecs_task_definition" "hievents" {
  family                   = "${var.name_prefix}-hievents"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.hievents_cpu
  memory                   = var.hievents_memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn
  
  container_definitions = jsonencode([
    {
      name  = "hievents"
      image = var.hievents_image
      
      essential = true
      
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "APP_ENV"
          value = var.environment
        },
        {
          name  = "APP_DEBUG"
          value = var.environment == "production" ? "false" : "true"
        },
        {
          name  = "DB_CONNECTION"
          value = "pgsql"
        },
        {
          name  = "DB_HOST"
          value = var.database_endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "REDIS_HOST"
          value = var.redis_endpoint
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        }
      ]
      
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.secrets_manager_arn}:DATABASE_PASSWORD::"
        },
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = "${var.secrets_manager_arn}:STRIPE_SECRET_KEY::"
        },
        {
          name      = "STRIPE_WEBHOOK_SECRET"
          valueFrom = "${var.secrets_manager_arn}:STRIPE_WEBHOOK_SECRET::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.hievents.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:8000/api/health || exit 1"
        ]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = var.tags
}

data "aws_region" "current" {}

# Gateway ECS Service
resource "aws_ecs_service" "gateway" {
  name            = "${var.name_prefix}-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.gateway.arn
  desired_count   = var.gateway_desired_capacity
  
  launch_type = "FARGATE"
  
  platform_version = "LATEST"
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = var.target_group_gateway_arn
    container_name   = "gateway"
    container_port   = 3001
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.gateway.arn
  }
  
  enable_execute_command = true
  
  depends_on = [var.target_group_gateway_arn]
  
  tags = var.tags
}

# Hi.Events ECS Service
resource "aws_ecs_service" "hievents" {
  name            = "${var.name_prefix}-hievents"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.hievents.arn
  desired_count   = var.hievents_desired_capacity
  
  launch_type = "FARGATE"
  
  platform_version = "LATEST"
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = var.target_group_hievents_arn
    container_name   = "hievents"
    container_port   = 8000
  }
  
  service_registries {
    registry_arn = aws_service_discovery_service.hievents.arn
  }
  
  enable_execute_command = true
  
  depends_on = [var.target_group_hievents_arn]
  
  tags = var.tags
}

# Service Discovery Namespace
resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "${var.name_prefix}.local"
  vpc  = var.vpc_id
  
  tags = var.tags
}

# Service Discovery Services
resource "aws_service_discovery_service" "gateway" {
  name = "gateway"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_grace_period_seconds = 30
  
  tags = var.tags
}

resource "aws_service_discovery_service" "hievents" {
  name = "hievents"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_grace_period_seconds = 30
  
  tags = var.tags
}

# Auto Scaling for Gateway Service
resource "aws_appautoscaling_target" "gateway" {
  max_capacity       = var.gateway_max_capacity
  min_capacity       = var.gateway_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.gateway.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  tags = var.tags
}

resource "aws_appautoscaling_policy" "gateway_cpu" {
  name               = "${var.name_prefix}-gateway-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.gateway.resource_id
  scalable_dimension = aws_appautoscaling_target.gateway.scalable_dimension
  service_namespace  = aws_appautoscaling_target.gateway.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "gateway_memory" {
  name               = "${var.name_prefix}-gateway-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.gateway.resource_id
  scalable_dimension = aws_appautoscaling_target.gateway.scalable_dimension
  service_namespace  = aws_appautoscaling_target.gateway.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Auto Scaling for Hi.Events Service
resource "aws_appautoscaling_target" "hievents" {
  max_capacity       = var.hievents_max_capacity
  min_capacity       = var.hievents_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.hievents.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  
  tags = var.tags
}

resource "aws_appautoscaling_policy" "hievents_cpu" {
  name               = "${var.name_prefix}-hievents-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.hievents.resource_id
  scalable_dimension = aws_appautoscaling_target.hievents.scalable_dimension
  service_namespace  = aws_appautoscaling_target.hievents.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "hievents_memory" {
  name               = "${var.name_prefix}-hievents-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.hievents.resource_id
  scalable_dimension = aws_appautoscaling_target.hievents.scalable_dimension
  service_namespace  = aws_appautoscaling_target.hievents.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}