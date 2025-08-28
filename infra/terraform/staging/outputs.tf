# Gateway Outputs
output "gateway_url" {
  description = "URL of the deployed gateway service"
  value       = "https://${cloudflare_record.gateway.hostname}"
}

output "gateway_app_url" {
  description = "DigitalOcean App Platform URL for gateway"
  value       = "https://${digitalocean_app.gateway.default_ingress}"
}

output "gateway_app_id" {
  description = "DigitalOcean App ID for gateway"
  value       = digitalocean_app.gateway.id
}

# Hi.Events Backend Outputs
output "hievents_url" {
  description = "URL of the Hi.Events backend service"
  value       = "https://${digitalocean_app.hievents.default_ingress}"
}

output "hievents_app_id" {
  description = "DigitalOcean App ID for Hi.Events backend"
  value       = digitalocean_app.hievents.id
}

# Database Outputs
output "database_host" {
  description = "PostgreSQL database host"
  value       = digitalocean_database_cluster.postgres.host
  sensitive   = true
}

output "database_port" {
  description = "PostgreSQL database port"
  value       = digitalocean_database_cluster.postgres.port
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = digitalocean_database_db.hievents.name
}

output "database_username" {
  description = "PostgreSQL database username"
  value       = digitalocean_database_user.hievents.name
  sensitive   = true
}

output "database_password" {
  description = "PostgreSQL database password"
  value       = digitalocean_database_user.hievents.password
  sensitive   = true
}

output "database_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${digitalocean_database_user.hievents.name}:${digitalocean_database_user.hievents.password}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.hievents.name}"
  sensitive   = true
}

# Container Registry Outputs
output "container_registry_endpoint" {
  description = "Container registry endpoint"
  value       = digitalocean_container_registry.main.endpoint
}

# DNS Outputs
output "dns_record_id" {
  description = "Cloudflare DNS record ID"
  value       = cloudflare_record.gateway.id
}

# Cost Estimation
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value = {
    database             = "$15 (db-s-1vcpu-1gb)"
    gateway_app          = "$5 (basic-xxs instance)"
    hievents_app        = "$5 (basic-xxs instance)"
    container_registry  = "$0 (basic plan)"
    cloudflare          = "$0 (free features used)"
    total_estimated     = "$25/month"
    notes               = "Costs may vary based on usage and additional features"
  }
}

# Health Check Endpoints
output "health_check_endpoints" {
  description = "Health check endpoints for monitoring"
  value = {
    gateway_health    = "https://${cloudflare_record.gateway.hostname}/healthz"
    gateway_deep     = "https://${cloudflare_record.gateway.hostname}/healthz?deep=true"
    hievents_health  = "https://${digitalocean_app.hievents.default_ingress}/api/public/color-themes"
  }
}

# Environment Configuration
output "environment_info" {
  description = "Environment configuration summary"
  value = {
    environment = "staging"
    region      = var.region
    domain      = cloudflare_record.gateway.hostname
    ssl_enabled = true
    cdn_enabled = true
    monitoring  = "Basic health checks enabled"
  }
}