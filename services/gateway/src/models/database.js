const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { GatewayError } = require('../middleware/errorHandler');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');

      // Create tables if they don't exist
      await this.createTables();
      this.initialized = true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new GatewayError('DATABASE_CONNECTION_FAILED', 'Failed to connect to database', 500);
    }
  }

  /**
   * Create necessary database tables
   */
  async createTables() {
    try {
      // OAuth states table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS oauth_states (
          state VARCHAR(255) PRIMARY KEY,
          provider VARCHAR(50) NOT NULL,
          redirect_uri TEXT NOT NULL,
          code_challenge VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Refresh tokens table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          account_id VARCHAR(255),
          family_id UUID NOT NULL,
          token_hash VARCHAR(255) NOT NULL UNIQUE,
          device_info JSONB,
          ip_hash VARCHAR(255),
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP DEFAULT NOW()
        )
      `);

      // User sessions table for device tracking
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
          device_fingerprint VARCHAR(255),
          user_agent TEXT,
          ip_address INET,
          last_activity TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Indexes for performance
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      `);

      console.log('✅ Database tables created/verified');
    } catch (error) {
      console.error('❌ Failed to create database tables:', error);
      throw new GatewayError('TABLE_CREATION_FAILED', 'Failed to create database tables', 500);
    }
  }

  /**
   * Store OAuth state
   */
  async storeOAuthState(state, provider, redirectUri, codeChallenge, expiresInMinutes = 10) {
    this.ensureInitialized();
    
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    try {
      await this.pool.query(`
        INSERT INTO oauth_states (state, provider, redirect_uri, code_challenge, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [state, provider, redirectUri, codeChallenge, expiresAt]);
      
      return true;
    } catch (error) {
      console.error('Failed to store OAuth state:', error);
      throw new GatewayError('OAUTH_STATE_STORAGE_FAILED', 'Failed to store OAuth state', 500);
    }
  }

  /**
   * Retrieve and validate OAuth state
   */
  async retrieveOAuthState(state) {
    this.ensureInitialized();
    
    try {
      const result = await this.pool.query(`
        DELETE FROM oauth_states 
        WHERE state = $1 AND expires_at > NOW()
        RETURNING *
      `, [state]);

      if (result.rows.length === 0) {
        throw new GatewayError('INVALID_OAUTH_STATE', 'Invalid or expired OAuth state', 400);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error('Failed to retrieve OAuth state:', error);
      throw new GatewayError('OAUTH_STATE_RETRIEVAL_FAILED', 'Failed to retrieve OAuth state', 500);
    }
  }

  /**
   * Store refresh token with family tracking
   */
  async storeRefreshToken(userId, accountId, tokenHash, deviceInfo, ipAddress, familyId = null) {
    this.ensureInitialized();
    
    const actualFamilyId = familyId || uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const ipHash = this.hashIP(ipAddress);
    
    try {
      const result = await this.pool.query(`
        INSERT INTO refresh_tokens (user_id, account_id, family_id, token_hash, device_info, ip_hash, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, family_id
      `, [userId, accountId, actualFamilyId, tokenHash, JSON.stringify(deviceInfo), ipHash, expiresAt]);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new GatewayError('REFRESH_TOKEN_STORAGE_FAILED', 'Failed to store refresh token', 500);
    }
  }

  /**
   * Retrieve refresh token and update last used
   */
  async retrieveRefreshToken(tokenHash) {
    this.ensureInitialized();
    
    try {
      const result = await this.pool.query(`
        UPDATE refresh_tokens 
        SET last_used = NOW()
        WHERE token_hash = $1 AND expires_at > NOW()
        RETURNING *
      `, [tokenHash]);

      if (result.rows.length === 0) {
        throw new GatewayError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error('Failed to retrieve refresh token:', error);
      throw new GatewayError('REFRESH_TOKEN_RETRIEVAL_FAILED', 'Failed to retrieve refresh token', 500);
    }
  }

  /**
   * Revoke refresh token family (for replay attack prevention)
   */
  async revokeTokenFamily(familyId) {
    this.ensureInitialized();
    
    try {
      const result = await this.pool.query(`
        DELETE FROM refresh_tokens 
        WHERE family_id = $1
        RETURNING id
      `, [familyId]);

      console.log(`Revoked ${result.rows.length} tokens from family ${familyId}`);
      return result.rows.length;
    } catch (error) {
      console.error('Failed to revoke token family:', error);
      throw new GatewayError('TOKEN_FAMILY_REVOCATION_FAILED', 'Failed to revoke token family', 500);
    }
  }

  /**
   * Revoke user tokens
   */
  async revokeUserTokens(userId, exceptFamilyId = null) {
    this.ensureInitialized();
    
    try {
      let query = 'DELETE FROM refresh_tokens WHERE user_id = $1';
      let params = [userId];
      
      if (exceptFamilyId) {
        query += ' AND family_id != $2';
        params.push(exceptFamilyId);
      }
      
      query += ' RETURNING id';
      
      const result = await this.pool.query(query, params);
      
      console.log(`Revoked ${result.rows.length} tokens for user ${userId}`);
      return result.rows.length;
    } catch (error) {
      console.error('Failed to revoke user tokens:', error);
      throw new GatewayError('USER_TOKEN_REVOCATION_FAILED', 'Failed to revoke user tokens', 500);
    }
  }

  /**
   * Clean up expired tokens and states
   */
  async cleanupExpired() {
    this.ensureInitialized();
    
    try {
      const [statesResult, tokensResult] = await Promise.all([
        this.pool.query('DELETE FROM oauth_states WHERE expires_at < NOW() RETURNING id'),
        this.pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING id')
      ]);

      const expiredStates = statesResult.rows.length;
      const expiredTokens = tokensResult.rows.length;

      if (expiredStates > 0 || expiredTokens > 0) {
        console.log(`Cleaned up ${expiredStates} expired states and ${expiredTokens} expired tokens`);
      }

      return { expiredStates, expiredTokens };
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      throw new GatewayError('CLEANUP_FAILED', 'Failed to cleanup expired data', 500);
    }
  }

  /**
   * Create session record when refresh token is issued
   */
  async createSessionRecord(userId, refreshTokenId, deviceInfo, ipAddress) {
    this.ensureInitialized();
    
    try {
      // Extract device fingerprint from device info
      const deviceFingerprint = deviceInfo ? 
        crypto.createHash('sha256').update(JSON.stringify(deviceInfo)).digest('hex').substring(0, 32) :
        null;
      
      const result = await this.pool.query(`
        INSERT INTO user_sessions (user_id, refresh_token_id, device_fingerprint, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5::inet)
        RETURNING *
      `, [
        userId,
        refreshTokenId,
        deviceFingerprint,
        deviceInfo?.userAgent || null,
        ipAddress
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to create session record:', error);
      throw new GatewayError('SESSION_CREATION_FAILED', 'Failed to create session record', 500);
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(refreshTokenId, ipAddress = null) {
    this.ensureInitialized();
    
    try {
      let query = 'UPDATE user_sessions SET last_activity = NOW()';
      let params = [refreshTokenId];
      
      if (ipAddress) {
        query += ', ip_address = $2::inet';
        params.push(ipAddress);
      }
      
      query += ' WHERE refresh_token_id = $1 RETURNING *';
      
      const result = await this.pool.query(query, params);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to update session activity:', error);
      // Don't throw error for non-critical operation
      return null;
    }
  }

  /**
   * Update session activity by user ID (for access token usage)
   */
  async updateLatestSessionActivity(userId, ipAddress = null) {
    this.ensureInitialized();
    
    try {
      let query = `
        UPDATE user_sessions 
        SET last_activity = NOW()`;
      let params = [userId];
      
      if (ipAddress) {
        query += ', ip_address = $2::inet';
        params.push(ipAddress);
        query += ` WHERE user_id = $1 AND last_activity = (
          SELECT MAX(last_activity) 
          FROM user_sessions 
          WHERE user_id = $1
        ) RETURNING *`;
      } else {
        query += ` WHERE user_id = $1 AND last_activity = (
          SELECT MAX(last_activity) 
          FROM user_sessions 
          WHERE user_id = $1
        ) RETURNING *`;
      }
      
      const result = await this.pool.query(query, params);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to update latest session activity:', error);
      // Don't throw error for non-critical operation
      return null;
    }
  }

  /**
   * Get all active sessions for a user with pagination
   */
  async getUserSessions(userId, limit = 20, offset = 0) {
    this.ensureInitialized();
    
    try {
      const result = await this.pool.query(`
        SELECT 
          s.id,
          s.user_id,
          s.device_fingerprint,
          s.user_agent,
          s.ip_address,
          s.last_activity,
          s.created_at,
          rt.device_info,
          rt.last_used,
          rt.expires_at as token_expires_at,
          CASE 
            WHEN rt.expires_at > NOW() THEN true 
            ELSE false 
          END as is_active
        FROM user_sessions s
        LEFT JOIN refresh_tokens rt ON s.refresh_token_id = rt.id
        WHERE s.user_id = $1
        ORDER BY s.last_activity DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      // Get total count for pagination
      const countResult = await this.pool.query(`
        SELECT COUNT(*) as total
        FROM user_sessions
        WHERE user_id = $1
      `, [userId]);

      return {
        sessions: result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          deviceInfo: this.parseDeviceInfo(row),
          ipAddress: row.ip_address,
          lastActivity: row.last_activity,
          createdAt: row.created_at,
          tokenExpiresAt: row.token_expires_at,
          isActive: row.is_active,
          isCurrent: false // Will be set by the calling code if needed
        })),
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: limit,
          offset: offset,
          hasMore: offset + limit < parseInt(countResult.rows[0].total)
        }
      };
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw new GatewayError('SESSION_RETRIEVAL_FAILED', 'Failed to retrieve user sessions', 500);
    }
  }

  /**
   * Revoke a specific session by ID
   */
  async revokeSpecificSession(sessionId, userId) {
    this.ensureInitialized();
    
    try {
      // First, get the session to find the refresh token
      const sessionResult = await this.pool.query(`
        SELECT s.*, rt.family_id
        FROM user_sessions s
        LEFT JOIN refresh_tokens rt ON s.refresh_token_id = rt.id
        WHERE s.id = $1 AND s.user_id = $2
      `, [sessionId, userId]);

      if (sessionResult.rows.length === 0) {
        throw new GatewayError('SESSION_NOT_FOUND', 'Session not found or access denied', 404);
      }

      const session = sessionResult.rows[0];
      
      // Revoke the token family (this will cascade delete the session)
      if (session.family_id) {
        await this.revokeTokenFamily(session.family_id);
      } else {
        // If no token family, just delete the session record
        await this.pool.query(`
          DELETE FROM user_sessions WHERE id = $1
        `, [sessionId]);
      }

      return { success: true, sessionId: session.id };
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error('Failed to revoke specific session:', error);
      throw new GatewayError('SESSION_REVOCATION_FAILED', 'Failed to revoke session', 500);
    }
  }

  /**
   * Parse device information for display
   */
  parseDeviceInfo(sessionRow) {
    try {
      const deviceInfo = JSON.parse(sessionRow.device_info || '{}');
      
      // Create a unified device info object
      return {
        deviceType: deviceInfo.deviceType || 'Unknown Device',
        deviceName: deviceInfo.deviceName || deviceInfo.model || 'Unknown',
        os: deviceInfo.os || deviceInfo.platform || 'Unknown OS',
        osVersion: deviceInfo.osVersion || deviceInfo.version || null,
        browser: deviceInfo.browser || null,
        browserVersion: deviceInfo.browserVersion || null,
        userAgent: sessionRow.user_agent,
        appVersion: deviceInfo.appVersion || null,
        fingerprint: sessionRow.device_fingerprint
      };
    } catch (error) {
      console.warn('Failed to parse device info:', error);
      return {
        deviceType: 'Unknown Device',
        deviceName: 'Unknown',
        os: 'Unknown OS',
        userAgent: sessionRow.user_agent,
        fingerprint: sessionRow.device_fingerprint
      };
    }
  }

  /**
   * Hash IP address for privacy
   */
  hashIP(ipAddress) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress + process.env.IP_HASH_SALT || 'default-salt').digest('hex');
  }

  /**
   * Ensure database is initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new GatewayError('DATABASE_NOT_INITIALIZED', 'Database not initialized', 500);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();