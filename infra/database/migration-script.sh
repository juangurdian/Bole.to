#!/bin/bash

# Database Migration Script for Bole.to Production Deployment
# This script handles database setup, migrations, and health checks

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/boleto-migration-$(date +%Y%m%d_%H%M%S).log"

# Default values (can be overridden by environment variables)
DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-boleto_production}"
DB_USER="${DB_USER:-boleto_admin}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_APP_USER="${DB_APP_USER:-boleto_app}"
DB_APP_PASSWORD="${DB_APP_PASSWORD:-}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DRY_RUN="${DRY_RUN:-false}"
BACKUP_BEFORE_MIGRATION="${BACKUP_BEFORE_MIGRATION:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message" >&2
            echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message" >&2
            echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
            ;;
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            echo "[$timestamp] [DEBUG] $message" >> "$LOG_FILE"
            ;;
    esac
}

# Validation function
validate_environment() {
    log INFO "Validating environment configuration..."
    
    # Check required environment variables
    if [[ -z "$DB_HOST" ]]; then
        log ERROR "DB_HOST environment variable is required"
        exit 1
    fi
    
    if [[ -z "$DB_PASSWORD" ]]; then
        log ERROR "DB_PASSWORD environment variable is required"
        exit 1
    fi
    
    if [[ -z "$DB_APP_PASSWORD" ]]; then
        log ERROR "DB_APP_PASSWORD environment variable is required"
        exit 1
    fi
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log ERROR "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if aws CLI is available (for RDS deployments)
    if ! command -v aws &> /dev/null; then
        log WARN "AWS CLI not found. Some features may not be available."
    fi
    
    log INFO "Environment validation completed"
}

# Database connection test
test_connection() {
    local user=$1
    local password=$2
    local database=${3:-postgres}
    
    log INFO "Testing database connection to $DB_HOST:$DB_PORT/$database as $user"
    
    if PGPASSWORD="$password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$user" -d "$database" -c "SELECT 1;" > /dev/null 2>&1; then
        log INFO "Connection successful"
        return 0
    else
        log ERROR "Connection failed"
        return 1
    fi
}

# Create database backup
create_backup() {
    if [[ "$BACKUP_BEFORE_MIGRATION" == "true" ]]; then
        local backup_file="/tmp/boleto-backup-$(date +%Y%m%d_%H%M%S).sql"
        log INFO "Creating database backup: $backup_file"
        
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --no-password \
            --format=plain \
            --file="$backup_file"
        
        if [[ $? -eq 0 ]]; then
            log INFO "Backup created successfully: $backup_file"
            
            # Compress backup
            gzip "$backup_file"
            log INFO "Backup compressed: ${backup_file}.gz"
        else
            log ERROR "Backup failed"
            exit 1
        fi
    else
        log INFO "Backup skipped (BACKUP_BEFORE_MIGRATION=false)"
    fi
}

# Run database initialization
run_initialization() {
    local init_script="$SCRIPT_DIR/init-production.sql"
    
    if [[ ! -f "$init_script" ]]; then
        log ERROR "Initialization script not found: $init_script"
        exit 1
    fi
    
    log INFO "Running database initialization..."
    
    # Replace placeholder passwords in the script
    local temp_script="/tmp/init-production-$(date +%Y%m%d_%H%M%S).sql"
    sed "s/CHANGE_ME_IN_PRODUCTION/$DB_APP_PASSWORD/g" "$init_script" > "$temp_script"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would execute initialization script"
        log INFO "Script location: $temp_script"
        return 0
    fi
    
    # Execute initialization script
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$temp_script" \
        --echo-errors \
        --on-error-stop
    
    if [[ $? -eq 0 ]]; then
        log INFO "Database initialization completed successfully"
    else
        log ERROR "Database initialization failed"
        exit 1
    fi
    
    # Clean up temporary script
    rm -f "$temp_script"
}

# Run Hi.Events migrations
run_hievents_migrations() {
    log INFO "Hi.Events migrations should be run separately using Laravel Artisan commands"
    log INFO "Example: docker exec -it hievents-container php artisan migrate --force"
}

# Verify database schema
verify_schema() {
    log INFO "Verifying database schema..."
    
    local expected_tables=(
        "sessions"
        "user_profiles" 
        "oauth_states"
        "rate_limits"
        "audit_logs"
        "api_keys"
        "feature_flags"
    )
    
    for table in "${expected_tables[@]}"; do
        local exists=$(PGPASSWORD="$DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');")
        
        if [[ "$exists" == "t" ]]; then
            log INFO "Table '$table' exists"
        else
            log ERROR "Table '$table' missing"
            exit 1
        fi
    done
    
    log INFO "Schema verification completed"
}

# Set up monitoring
setup_monitoring() {
    log INFO "Setting up database monitoring..."
    
    # Enable pg_stat_statements if available
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" || log WARN "Could not enable pg_stat_statements"
    
    log INFO "Monitoring setup completed"
}

# Performance tuning
apply_performance_tuning() {
    log INFO "Applying performance tuning recommendations..."
    
    # Note: Many of these settings require superuser privileges
    # They should be applied at the RDS parameter group level
    
    local recommendations=(
        "Consider setting shared_buffers to 25% of available RAM"
        "Consider setting effective_cache_size to 75% of available RAM"
        "Consider setting work_mem based on concurrent connections"
        "Consider setting maintenance_work_mem to 256MB or higher"
        "Consider enabling auto_vacuum if not already enabled"
    )
    
    for recommendation in "${recommendations[@]}"; do
        log INFO "$recommendation"
    done
}

# Cleanup function
cleanup_expired_data() {
    log INFO "Running cleanup for expired data..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log INFO "DRY RUN: Would run cleanup function"
        return 0
    fi
    
    local cleaned_records=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -tAc "SELECT cleanup_expired_records();")
    
    log INFO "Cleaned up $cleaned_records expired records"
}

# Main execution function
main() {
    log INFO "Starting Bole.to database migration process"
    log INFO "Environment: $ENVIRONMENT"
    log INFO "Database: $DB_HOST:$DB_PORT/$DB_NAME"
    log INFO "Log file: $LOG_FILE"
    
    # Validation
    validate_environment
    
    # Test admin connection
    if ! test_connection "$DB_USER" "$DB_PASSWORD" "postgres"; then
        exit 1
    fi
    
    # Create database if it doesn't exist
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" \
        -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log INFO "Database $DB_NAME already exists"
    
    # Test connection to target database
    if ! test_connection "$DB_USER" "$DB_PASSWORD" "$DB_NAME"; then
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Run initialization
    run_initialization
    
    # Verify schema
    verify_schema
    
    # Test application user connection
    if ! test_connection "$DB_APP_USER" "$DB_APP_PASSWORD" "$DB_NAME"; then
        log ERROR "Application user connection failed"
        exit 1
    fi
    
    # Setup monitoring
    setup_monitoring
    
    # Performance tuning recommendations
    apply_performance_tuning
    
    # Cleanup expired data
    cleanup_expired_data
    
    # Hi.Events migrations info
    run_hievents_migrations
    
    log INFO "Database migration completed successfully"
    log INFO "Log file saved to: $LOG_FILE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --no-backup)
            BACKUP_BEFORE_MIGRATION="false"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --dry-run        Show what would be done without executing"
            echo "  --no-backup      Skip database backup"
            echo "  --help           Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DB_HOST          Database host (required)"
            echo "  DB_PORT          Database port (default: 5432)"
            echo "  DB_NAME          Database name (default: boleto_production)"
            echo "  DB_USER          Admin database user (default: boleto_admin)"
            echo "  DB_PASSWORD      Admin database password (required)"
            echo "  DB_APP_USER      Application database user (default: boleto_app)"
            echo "  DB_APP_PASSWORD  Application database password (required)"
            echo "  ENVIRONMENT      Environment name (default: production)"
            exit 0
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"