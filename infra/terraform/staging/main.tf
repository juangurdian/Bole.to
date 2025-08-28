terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.20"
    }
  }
  
  # Remote state storage (update with your backend configuration)
  backend "s3" {
    bucket = "bole-to-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "us-east-1"
    # Enable this after creating the S3 bucket
    # dynamodb_table = "terraform-locks"
    # encrypt        = true
  }
}

# Configure providers
provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Local values
locals {
  environment = "staging"
  project     = "bole-to"
  
  # Common tags
  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "Terraform"
    CreatedDate = timestamp()
  }

  # Domain configuration
  domain_name     = "bole.to"
  gateway_domain  = "staging-api.${local.domain_name}"
  
  # App configuration
  gateway_app_name = "${local.project}-gateway-${local.environment}"
  hievents_app_name = "${local.project}-hievents-${local.environment}"
}

# Get Cloudflare zone information
data "cloudflare_zone" "main" {
  name = local.domain_name
}

# PostgreSQL Database Cluster
resource "digitalocean_database_cluster" "postgres" {
  name       = "${local.project}-postgres-${local.environment}"
  engine     = "pg"
  version    = "15"
  size       = "db-s-1vcpu-1gb"  # Cost-effective for staging
  region     = var.region
  node_count = 1

  tags = [
    "environment:${local.environment}",
    "project:${local.project}",
    "service:database"
  ]
}

# Database for Hi.Events
resource "digitalocean_database_db" "hievents" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "hievents_staging"
}

# Database user for Hi.Events
resource "digitalocean_database_user" "hievents" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "hievents_user"
}

# Container Registry
resource "digitalocean_container_registry" "main" {
  name                   = "${local.project}-registry"
  subscription_tier_slug = "basic"  # Free tier
}

# Hi.Events Backend App
resource "digitalocean_app" "hievents" {
  spec {
    name   = local.hievents_app_name
    region = var.region

    # Hi.Events Laravel backend service
    service {
      name                 = "hievents-backend"
      instance_count       = 1
      instance_size_slug   = "basic-xxs"  # $5/month
      build_command        = "composer install --optimize-autoloader --no-dev && php artisan config:cache && php artisan route:cache && php artisan view:cache"
      run_command          = "php artisan serve --host=0.0.0.0 --port=8080"
      
      git {
        repo_clone_url = "https://github.com/your-org/bole-to.git"
        branch         = "develop"
      }

      source_dir = "/services/hi-events"

      # Environment variables
      env {
        key   = "APP_ENV"
        value = "production"
        type  = "GENERAL"
      }

      env {
        key   = "APP_DEBUG"
        value = "false"
        type  = "GENERAL"
      }

      env {
        key   = "APP_KEY"
        value = var.app_key
        type  = "SECRET"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "DB_HOST"
        value = digitalocean_database_cluster.postgres.host
        type  = "GENERAL"
      }

      env {
        key   = "DB_PORT"
        value = tostring(digitalocean_database_cluster.postgres.port)
        type  = "GENERAL"
      }

      env {
        key   = "DB_DATABASE"
        value = digitalocean_database_db.hievents.name
        type  = "GENERAL"
      }

      env {
        key   = "DB_USERNAME"
        value = digitalocean_database_user.hievents.name
        type  = "GENERAL"
      }

      env {
        key   = "DB_PASSWORD"
        value = digitalocean_database_user.hievents.password
        type  = "SECRET"
      }

      env {
        key   = "STRIPE_PUBLIC_KEY"
        value = var.stripe_public_key
        type  = "GENERAL"
      }

      env {
        key   = "STRIPE_SECRET_KEY"
        value = var.stripe_secret_key
        type  = "SECRET"
      }

      env {
        key   = "MAIL_MAILER"
        value = "smtp"
        type  = "GENERAL"
      }

      env {
        key   = "MAIL_HOST"
        value = var.mail_host
        type  = "GENERAL"
      }

      env {
        key   = "MAIL_PORT"
        value = var.mail_port
        type  = "GENERAL"
      }

      env {
        key   = "MAIL_USERNAME"
        value = var.mail_username
        type  = "SECRET"
      }

      env {
        key   = "MAIL_PASSWORD"
        value = var.mail_password
        type  = "SECRET"
      }

      env {
        key   = "MAIL_FROM_ADDRESS"
        value = var.mail_from_address
        type  = "GENERAL"
      }

      # Health check
      health_check {
        http_path                = "/api/public/color-themes"
        initial_delay_seconds    = 60
        period_seconds          = 30
        timeout_seconds         = 10
        success_threshold       = 1
        failure_threshold       = 3
      }

      # Resource limits
      routes {
        path = "/"
      }
    }
  }
}

# Gateway App
resource "digitalocean_app" "gateway" {
  spec {
    name   = local.gateway_app_name
    region = var.region

    # Custom domain
    domain {
      name = local.gateway_domain
      type = "PRIMARY"
    }

    # Gateway service
    service {
      name                 = "gateway"
      instance_count       = 1
      instance_size_slug   = "basic-xxs"  # $5/month
      
      git {
        repo_clone_url = "https://github.com/your-org/bole-to.git"
        branch         = "develop"
      }

      source_dir = "/apps/gateway"

      # Build and run commands for Node.js
      build_command = "npm ci --only=production"
      run_command   = "npm start"

      # Environment variables
      env {
        key   = "NODE_ENV"
        value = "production"
        type  = "GENERAL"
      }

      env {
        key   = "PORT"
        value = "8080"
        type  = "GENERAL"
      }

      env {
        key   = "HIEVENTS_BACKEND_URL"
        value = "https://${digitalocean_app.hievents.default_ingress}"
        type  = "GENERAL"
      }

      env {
        key   = "CORS_ORIGINS"
        value = "exp://localhost:*,exp://127.0.0.1:*,exp://192.168.*:*,http://localhost:*,https://${local.gateway_domain},https://app.${local.domain_name}"
        type  = "GENERAL"
      }

      env {
        key   = "REQUEST_TIMEOUT"
        value = "30000"
        type  = "GENERAL"
      }

      # Health check
      health_check {
        http_path                = "/healthz"
        initial_delay_seconds    = 30
        period_seconds          = 30
        timeout_seconds         = 10
        success_threshold       = 1
        failure_threshold       = 3
      }

      # Resource limits
      routes {
        path = "/"
      }
    }
  }

  depends_on = [digitalocean_app.hievents]
}

# Cloudflare DNS Record for Gateway
resource "cloudflare_record" "gateway" {
  zone_id = data.cloudflare_zone.main.id
  name    = "staging-api"
  value   = digitalocean_app.gateway.default_ingress
  type    = "CNAME"
  ttl     = 300
  proxied = true  # Enable Cloudflare proxy for SSL and performance

  comment = "Gateway API for staging environment"
}

# Cloudflare Page Rules for enhanced security and performance
resource "cloudflare_page_rule" "gateway_security" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "${local.gateway_domain}/*"
  priority = 1

  actions {
    security_level      = "high"
    ssl                = "strict"
    always_use_https   = "on"
    browser_check      = "on"
    server_side_exclude = "on"
  }
}

# Cloudflare Page Rules for caching
resource "cloudflare_page_rule" "gateway_caching" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "${local.gateway_domain}/api/public/*"
  priority = 2

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 300  # 5 minutes for public API responses
  }
}