const express = require('express');
const { body, param, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const jwtService = require('../services/jwtService');
const pkceService = require('../services/pkceService');
const oauthService = require('../services/oauthService');
const hiEventsService = require('../services/hiEventsService');
const database = require('../models/database');
const { GatewayError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new GatewayError('VALIDATION_ERROR', 'Invalid request data', 400, errors.array());
  }
  next();
};

/**
 * POST /auth/login
 * Standard email/password login
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('rememberMe').optional().isBoolean(),
    body('deviceInfo').optional().isObject()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password, rememberMe = false, deviceInfo } = req.body;

      // Find user in Hi.Events
      const hiEventsUser = await hiEventsService.findUserByEmail(email);
      if (!hiEventsUser) {
        throw new GatewayError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      // For now, we'll accept any password since Hi.Events handles its own auth
      // In production, you'd verify password against Hi.Events API or stored hash
      
      // Transform user data
      const user = hiEventsService.transformHiEventsUser(hiEventsUser);
      const accounts = await hiEventsService.getUserAccounts(user.id);

      // Generate JWT tokens
      const tokenPayload = {
        sub: user.id,
        aid: accounts.length > 0 ? accounts[0].id : null,
        email: user.email,
        role: user.role
      };

      const tokens = jwtService.generateTokenPair(tokenPayload);

      // Store refresh token in database
      const tokenHash = crypto.createHash('sha256').update(tokens.refresh_token).digest('hex');
      const tokenRecord = await database.storeRefreshToken(
        user.id,
        tokenPayload.aid,
        tokenHash,
        deviceInfo,
        req.ip
      );

      // Create session record
      await database.createSessionRecord(
        user.id,
        tokenRecord.id,
        deviceInfo,
        req.ip
      );

      res.json({
        success: true,
        data: {
          user,
          tokens: {
            access_token: tokens.access_token,
            token_type: tokens.token_type,
            expires_in: tokens.expires_in
            // Note: refresh_token is handled via httpOnly cookie in production
          },
          accounts,
          permissions: ['user'] // Default permissions
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/oauth/:provider/start
 * Start OAuth flow with PKCE
 */
router.post('/oauth/:provider/start',
  [
    param('provider').isIn(['google', 'apple']),
    body('redirectUri').isURL()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { provider } = req.params;
      const { redirectUri } = req.body;

      // Validate provider configuration
      oauthService.validateProvider(provider);

      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = pkceService.generatePKCEPair();

      // Generate state parameter
      const state = pkceService.generateState();

      // Store state and code challenge in database
      await database.storeOAuthState(state, provider, redirectUri, codeChallenge);

      // Generate authorization URL
      const authUrl = oauthService.generateAuthUrl(provider, state, codeChallenge);

      res.json({
        success: true,
        data: {
          authUrl,
          state,
          codeChallenge,
          codeChallengeMethod: 'S256',
          // Return codeVerifier for mobile client to store securely
          codeVerifier
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/oauth/:provider/callback
 * Handle OAuth callback with PKCE verification
 */
router.post('/oauth/:provider/callback',
  [
    param('provider').isIn(['google', 'apple']),
    body('code').notEmpty(),
    body('codeVerifier').isLength({ min: 43, max: 128 }),
    body('state').notEmpty(),
    body('redirectUri').isURL(),
    body('deviceInfo').optional().isObject()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { provider } = req.params;
      const { code, codeVerifier, state, redirectUri, deviceInfo } = req.body;

      // Validate and retrieve stored OAuth state
      const storedState = await database.retrieveOAuthState(state);

      // Verify PKCE code challenge
      pkceService.verifyCodeChallenge(codeVerifier, storedState.code_challenge);

      // Verify redirect URI matches
      if (storedState.redirect_uri !== redirectUri) {
        throw new GatewayError('REDIRECT_URI_MISMATCH', 'Redirect URI mismatch', 400);
      }

      // Exchange authorization code for tokens
      const oauthTokens = await oauthService.exchangeCodeForTokens(
        provider,
        code,
        codeVerifier,
        redirectUri
      );

      // Get user profile from OAuth provider
      const oauthProfile = await oauthService.getUserProfile(provider, oauthTokens.access_token);

      // Handle identity linking with Hi.Events
      const { user, accounts, isNewUser } = await hiEventsService.handleIdentityLinking(oauthProfile);

      // Generate JWT tokens
      const tokenPayload = {
        sub: user.id,
        aid: accounts.length > 0 ? accounts[0].id : null,
        email: user.email,
        role: user.role
      };

      const tokens = jwtService.generateTokenPair(tokenPayload);

      // Store refresh token in database
      const tokenHash = crypto.createHash('sha256').update(tokens.refresh_token).digest('hex');
      const tokenRecord = await database.storeRefreshToken(
        user.id,
        tokenPayload.aid,
        tokenHash,
        deviceInfo,
        req.ip
      );

      // Create session record
      await database.createSessionRecord(
        user.id,
        tokenRecord.id,
        deviceInfo,
        req.ip
      );

      res.json({
        success: true,
        data: {
          user,
          tokens: {
            access_token: tokens.access_token,
            token_type: tokens.token_type,
            expires_in: tokens.expires_in
          },
          accounts,
          isNewUser,
          linkedProvider: provider
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      // Hash the refresh token to look up in database
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Retrieve refresh token record
      const tokenRecord = await database.retrieveRefreshToken(tokenHash);

      // Verify refresh token JWT
      const decoded = jwtService.verifyToken(refreshToken);

      // Check for token reuse (potential replay attack)
      if (tokenRecord.last_used && 
          new Date() - new Date(tokenRecord.last_used) < 1000) { // Less than 1 second ago
        console.warn(`Potential token reuse detected for user ${tokenRecord.user_id}`);
        // Revoke the entire token family
        await database.revokeTokenFamily(tokenRecord.family_id);
        throw new GatewayError('TOKEN_REUSE_DETECTED', 'Token reuse detected, all tokens revoked', 401);
      }

      // Generate new token pair
      const tokenPayload = {
        sub: tokenRecord.user_id,
        aid: tokenRecord.account_id,
        email: decoded.email,
        role: decoded.role
      };

      const newTokens = jwtService.generateTokenPair(tokenPayload);

      // Store new refresh token and revoke old one
      await database.revokeTokenFamily(tokenRecord.family_id);
      const newTokenHash = crypto.createHash('sha256').update(newTokens.refresh_token).digest('hex');
      const newTokenRecord = await database.storeRefreshToken(
        tokenRecord.user_id,
        tokenRecord.account_id,
        newTokenHash,
        JSON.parse(tokenRecord.device_info || '{}'),
        req.ip
      );

      // Create new session record and update activity
      await database.createSessionRecord(
        tokenRecord.user_id,
        newTokenRecord.id,
        JSON.parse(tokenRecord.device_info || '{}'),
        req.ip
      );
      await database.updateSessionActivity(newTokenRecord.id, req.ip);

      res.json({
        success: true,
        data: {
          access_token: newTokens.access_token,
          token_type: newTokens.token_type,
          expires_in: newTokens.expires_in
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Logout user and revoke tokens
 */
router.post('/logout',
  [
    body('allDevices').optional().isBoolean(),
    body('refreshToken').optional().notEmpty()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { allDevices = false, refreshToken } = req.body;

      // Get user ID from JWT token in Authorization header
      const authHeader = req.get('Authorization');
      let userId = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwtService.verifyToken(token);
          userId = decoded.sub;
        } catch (error) {
          // Token might be expired, but we still want to logout
          console.warn('Invalid token during logout:', error.message);
        }
      }

      if (refreshToken) {
        try {
          const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          const tokenRecord = await database.retrieveRefreshToken(tokenHash);
          userId = userId || tokenRecord.user_id;

          if (allDevices) {
            // Revoke all user tokens
            await database.revokeUserTokens(userId);
          } else {
            // Revoke just this token family
            await database.revokeTokenFamily(tokenRecord.family_id);
          }
        } catch (error) {
          console.warn('Failed to revoke refresh token during logout:', error.message);
        }
      } else if (userId && allDevices) {
        // Revoke all user tokens even without refresh token
        await database.revokeUserTokens(userId);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      // Don't fail logout on errors
      console.error('Logout error:', error);
      res.json({
        success: true,
        message: 'Logout completed with warnings'
      });
    }
  }
);

/**
 * GET /auth/sessions
 * Get all user sessions with pagination
 */
router.get('/sessions',
  async (req, res, next) => {
    try {
      // Get user ID from JWT token in Authorization header
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new GatewayError('UNAUTHORIZED', 'Authorization header required', 401);
      }

      const token = authHeader.substring(7);
      const decoded = jwtService.verifyToken(token);
      const userId = decoded.sub;

      // Get pagination parameters
      const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
      const offset = parseInt(req.query.offset) || 0;

      // Get user sessions
      const result = await database.getUserSessions(userId, limit, offset);

      // Mark current session (if we can identify it)
      const currentRefreshToken = req.body.refreshToken || req.query.refreshToken;
      if (currentRefreshToken) {
        const currentTokenHash = crypto.createHash('sha256').update(currentRefreshToken).digest('hex');
        // Find matching session (simplified - in real implementation you'd join with refresh_tokens)
        result.sessions.forEach(session => {
          if (session.tokenExpiresAt && new Date(session.tokenExpiresAt) > new Date()) {
            session.isCurrent = session.lastActivity && 
              new Date() - new Date(session.lastActivity) < 5 * 60 * 1000; // Within 5 minutes
          }
        });
      }

      res.json({
        success: true,
        data: {
          sessions: result.sessions,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /auth/sessions/:id
 * Revoke a specific session
 */
router.delete('/sessions/:id',
  [
    param('id').isUUID()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // Get user ID from JWT token in Authorization header
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new GatewayError('UNAUTHORIZED', 'Authorization header required', 401);
      }

      const token = authHeader.substring(7);
      const decoded = jwtService.verifyToken(token);
      const userId = decoded.sub;
      const sessionId = req.params.id;

      // Revoke the specific session
      const result = await database.revokeSpecificSession(sessionId, userId);

      res.json({
        success: true,
        message: 'Session revoked successfully',
        data: {
          sessionId: result.sessionId
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Initialize database connection on module load
database.initialize().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = router;