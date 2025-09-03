-- Gateway Database Schema
-- This script initializes the database schema for the Bole.to Gateway service

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- OAuth states table for PKCE flow security
CREATE TABLE IF NOT EXISTS oauth_states (
    state VARCHAR(255) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'apple')),
    redirect_uri TEXT NOT NULL,
    code_challenge VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient cleanup of expired states
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Refresh tokens table with family tracking for security
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255),
    family_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_hash VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- User sessions table for device tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token_id ON user_sessions(refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Audit log table for security events
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    expired_states INTEGER;
    expired_tokens INTEGER;
    old_sessions INTEGER;
    old_logs INTEGER;
BEGIN
    -- Delete expired OAuth states
    DELETE FROM oauth_states WHERE expires_at < NOW();
    GET DIAGNOSTICS expired_states = ROW_COUNT;
    
    -- Delete expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS expired_tokens = ROW_COUNT;
    
    -- Delete old user sessions (older than 90 days)
    DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS old_sessions = ROW_COUNT;
    
    -- Delete old audit logs (older than 1 year)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS old_logs = ROW_COUNT;
    
    -- Log cleanup results
    INSERT INTO audit_logs (event_type, event_data) VALUES (
        'cleanup_expired_data',
        json_build_object(
            'expired_states', expired_states,
            'expired_tokens', expired_tokens,
            'old_sessions', old_sessions,
            'old_logs', old_logs
        )
    );
    
    RETURN expired_states + expired_tokens + old_sessions + old_logs;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_activity on user_sessions
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_sessions_last_activity ON user_sessions;
CREATE TRIGGER trigger_update_user_sessions_last_activity
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

-- Grant permissions to application user
-- Note: Replace 'gateway_user' with your actual database user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gateway_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gateway_user;

-- Insert initial audit log entry
INSERT INTO audit_logs (event_type, event_data) VALUES (
    'database_initialized',
    json_build_object(
        'timestamp', NOW(),
        'version', '1.0.0',
        'tables_created', json_build_array(
            'oauth_states',
            'refresh_tokens', 
            'user_sessions',
            'audit_logs'
        )
    )
);

-- Display initialization summary
SELECT 
    'Database initialization completed' as status,
    NOW() as timestamp,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;