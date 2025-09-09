-- Production Database Initialization Script for Bole.to Gateway Service
-- This script sets up the PostgreSQL database for the production environment

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user with limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'boleto_app') THEN
        CREATE USER boleto_app WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
END
$$;

-- Grant necessary privileges
GRANT CONNECT ON DATABASE boleto_production TO boleto_app;
GRANT USAGE ON SCHEMA public TO boleto_app;
GRANT CREATE ON SCHEMA public TO boleto_app;

-- Sessions table for JWT refresh token storage
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_sessions_user_id ON sessions(user_id),
    INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash),
    INDEX idx_sessions_expires_at ON sessions(expires_at)
);

-- User profiles cache table (synchronized from Hi.Events)
CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_data JSONB,
    social_accounts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_user_profiles_email ON user_profiles(email),
    INDEX idx_user_profiles_updated_at ON user_profiles(updated_at)
);

-- OAuth states table for PKCE flow security
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_value VARCHAR(255) NOT NULL UNIQUE,
    code_verifier VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_oauth_states_state_value ON oauth_states(state_value),
    INDEX idx_oauth_states_expires_at ON oauth_states(expires_at)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, etc.
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE(identifier, endpoint, window_start),
    
    -- Indexes
    INDEX idx_rate_limits_identifier_endpoint ON rate_limits(identifier, endpoint),
    INDEX idx_rate_limits_expires_at ON rate_limits(expires_at)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_audit_logs_user_id ON audit_logs(user_id),
    INDEX idx_audit_logs_action ON audit_logs(action),
    INDEX idx_audit_logs_created_at ON audit_logs(created_at),
    INDEX idx_audit_logs_request_id ON audit_logs(request_id)
);

-- API keys table for service-to-service authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_api_keys_key_hash ON api_keys(key_hash),
    INDEX idx_api_keys_service_name ON api_keys(service_name),
    INDEX idx_api_keys_is_active ON api_keys(is_active)
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_feature_flags_flag_name ON feature_flags(flag_name),
    INDEX idx_feature_flags_is_enabled ON feature_flags(is_enabled)
);

-- Grant table permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO boleto_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO boleto_app;

-- Set up updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired records function
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up expired sessions
    DELETE FROM sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up expired OAuth states
    DELETE FROM oauth_states WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old rate limit records
    DELETE FROM rate_limits WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old audit logs (keep for 90 days)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
    ('oauth_google_enabled', true, 'Enable Google OAuth authentication'),
    ('oauth_apple_enabled', true, 'Enable Apple OAuth authentication'),
    ('rate_limiting_enabled', true, 'Enable API rate limiting'),
    ('audit_logging_enabled', true, 'Enable audit logging'),
    ('maintenance_mode', false, 'Enable maintenance mode'),
    ('new_user_registration', true, 'Allow new user registration'),
    ('enhanced_security', true, 'Enable enhanced security features')
ON CONFLICT (flag_name) DO NOTHING;

-- Performance optimization
-- Analyze tables for query planner
ANALYZE sessions;
ANALYZE user_profiles;
ANALYZE oauth_states;
ANALYZE rate_limits;
ANALYZE audit_logs;
ANALYZE api_keys;
ANALYZE feature_flags;

-- Set up connection pooling recommendations
COMMENT ON DATABASE boleto_production IS 'Recommended connection pool settings: max_connections=200, shared_buffers=256MB, effective_cache_size=1GB';

COMMIT;