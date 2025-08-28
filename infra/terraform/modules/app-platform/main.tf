# Reusable DigitalOcean App Platform module
variable "app_name" {
  description = "Name of the app"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "source_dir" {
  description = "Source directory in the repository"
  type        = string
}

variable "build_command" {
  description = "Build command for the application"
  type        = string
  default     = ""
}

variable "run_command" {
  description = "Run command for the application"
  type        = string
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 1
}

variable "instance_size" {
  description = "Instance size slug"
  type        = string
  default     = "basic-xxs"
}

variable "environment_variables" {
  description = "Environment variables for the app"
  type = map(object({
    value = string
    type  = string  # "GENERAL" or "SECRET"
  }))
  default = {}
}

variable "domains" {
  description = "Custom domains for the app"
  type        = list(string)
  default     = []
}

variable "health_check_path" {
  description = "Health check HTTP path"
  type        = string
  default     = "/"
}

variable "git_repo" {
  description = "Git repository URL"
  type        = string
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "develop"
}

resource "digitalocean_app" "main" {
  spec {
    name   = var.app_name
    region = var.region

    # Add custom domains
    dynamic "domain" {
      for_each = var.domains
      content {
        name = domain.value
        type = "PRIMARY"
      }
    }

    service {
      name                 = "main"
      instance_count       = var.instance_count
      instance_size_slug   = var.instance_size
      build_command        = var.build_command
      run_command          = var.run_command
      
      git {
        repo_clone_url = var.git_repo
        branch         = var.git_branch
      }

      source_dir = var.source_dir

      # Environment variables
      dynamic "env" {
        for_each = var.environment_variables
        content {
          key   = env.key
          value = env.value.value
          type  = env.value.type
        }
      }

      # Health check
      health_check {
        http_path                = var.health_check_path
        initial_delay_seconds    = 30
        period_seconds          = 30
        timeout_seconds         = 10
        success_threshold       = 1
        failure_threshold       = 3
      }

      routes {
        path = "/"
      }
    }
  }
}

# Outputs
output "app_id" {
  description = "The ID of the created app"
  value       = digitalocean_app.main.id
}

output "default_ingress" {
  description = "The default ingress URL"
  value       = digitalocean_app.main.default_ingress
}

output "live_url" {
  description = "The live URL of the app"
  value       = digitalocean_app.main.live_url
}