const axios = require('axios');
const jwt = require('jsonwebtoken');
const { GatewayError } = require('../middleware/errorHandler');

class OAuthService {
  constructor() {
    // Google OAuth configuration
    this.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'com.bole.to://oauth/callback',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile']
    };

    // Apple OAuth configuration
    this.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      redirectUri: process.env.APPLE_REDIRECT_URI || 'com.bole.to://oauth/callback',
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      scopes: ['name', 'email']
    };

    this.validateConfiguration();
  }

  /**
   * Validate OAuth provider configuration
   */
  validateConfiguration() {
    const missingConfigs = [];

    // Check Google configuration
    if (!this.google.clientId) missingConfigs.push('GOOGLE_CLIENT_ID');
    if (!this.google.clientSecret) missingConfigs.push('GOOGLE_CLIENT_SECRET');

    // Check Apple configuration
    if (!this.apple.clientId) missingConfigs.push('APPLE_CLIENT_ID');
    if (!this.apple.privateKey) missingConfigs.push('APPLE_PRIVATE_KEY');
    if (!this.apple.teamId) missingConfigs.push('APPLE_TEAM_ID');
    if (!this.apple.keyId) missingConfigs.push('APPLE_KEY_ID');

    if (missingConfigs.length > 0) {
      console.warn('⚠️  Missing OAuth configuration:', missingConfigs.join(', '));
      console.warn('⚠️  OAuth providers may not work properly');
    } else {
      console.log('✅ OAuth providers configured successfully');
    }
  }

  /**
   * Generate authorization URL for OAuth provider
   */
  generateAuthUrl(provider, state, codeChallenge) {
    try {
      const config = this.getProviderConfig(provider);
      
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      // Apple-specific parameters
      if (provider === 'apple') {
        params.append('response_mode', 'form_post');
      }

      return `${config.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error(`Failed to generate ${provider} auth URL:`, error);
      throw new GatewayError('AUTH_URL_GENERATION_FAILED', `Failed to generate ${provider} authorization URL`, 500);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(provider, code, codeVerifier, redirectUri) {
    try {
      const config = this.getProviderConfig(provider);
      
      if (provider === 'google') {
        return await this.exchangeGoogleCode(config, code, codeVerifier, redirectUri);
      } else if (provider === 'apple') {
        return await this.exchangeAppleCode(config, code, codeVerifier, redirectUri);
      } else {
        throw new GatewayError('UNSUPPORTED_PROVIDER', `OAuth provider '${provider}' not supported`, 400);
      }
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error(`Token exchange failed for ${provider}:`, error);
      throw new GatewayError('TOKEN_EXCHANGE_FAILED', `Failed to exchange code for tokens with ${provider}`, 500);
    }
  }

  /**
   * Get user profile from OAuth provider
   */
  async getUserProfile(provider, accessToken) {
    try {
      if (provider === 'google') {
        return await this.getGoogleUserProfile(accessToken);
      } else if (provider === 'apple') {
        return await this.getAppleUserProfile(accessToken);
      } else {
        throw new GatewayError('UNSUPPORTED_PROVIDER', `OAuth provider '${provider}' not supported`, 400);
      }
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error(`Failed to get ${provider} user profile:`, error);
      throw new GatewayError('USER_PROFILE_FAILED', `Failed to get user profile from ${provider}`, 500);
    }
  }

  /**
   * Exchange Google authorization code for tokens
   */
  async exchangeGoogleCode(config, code, codeVerifier, redirectUri) {
    const response = await axios.post(config.tokenUrl, {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  /**
   * Exchange Apple authorization code for tokens
   */
  async exchangeAppleCode(config, code, codeVerifier, redirectUri) {
    // Generate client assertion JWT for Apple
    const clientAssertion = this.generateAppleClientAssertion(config);

    const response = await axios.post(config.tokenUrl, new URLSearchParams({
      client_id: config.clientId,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data;
  }

  /**
   * Generate Apple client assertion JWT
   */
  generateAppleClientAssertion(config) {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: config.teamId,
      iat: now,
      exp: now + 300, // 5 minutes
      aud: 'https://appleid.apple.com',
      sub: config.clientId
    };

    return jwt.sign(payload, config.privateKey.replace(/\\n/g, '\n'), {
      algorithm: 'ES256',
      keyid: config.keyId
    });
  }

  /**
   * Get Google user profile
   */
  async getGoogleUserProfile(accessToken) {
    const response = await axios.get(this.google.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const profile = response.data;
    
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
      name: profile.name || '',
      picture: profile.picture || null,
      emailVerified: profile.verified_email || false,
      provider: 'google'
    };
  }

  /**
   * Get Apple user profile (from ID token)
   */
  async getAppleUserProfile(idToken) {
    try {
      // Decode Apple ID token (we should verify signature in production)
      const decoded = jwt.decode(idToken);
      
      if (!decoded) {
        throw new GatewayError('INVALID_APPLE_TOKEN', 'Invalid Apple ID token', 400);
      }

      return {
        id: decoded.sub,
        email: decoded.email || null,
        firstName: decoded.given_name || '',
        lastName: decoded.family_name || '',
        name: `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
        picture: null, // Apple doesn't provide profile pictures
        emailVerified: decoded.email_verified === 'true',
        provider: 'apple',
        isPrivateRelay: decoded.email && decoded.email.includes('@privaterelay.appleid.com')
      };
    } catch (error) {
      console.error('Failed to decode Apple ID token:', error);
      throw new GatewayError('APPLE_PROFILE_FAILED', 'Failed to get Apple user profile', 500);
    }
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider) {
    const config = this[provider];
    if (!config) {
      throw new GatewayError('UNSUPPORTED_PROVIDER', `OAuth provider '${provider}' not supported`, 400);
    }
    return config;
  }

  /**
   * Validate provider is supported and configured
   */
  validateProvider(provider) {
    const supportedProviders = ['google', 'apple'];
    
    if (!supportedProviders.includes(provider)) {
      throw new GatewayError('UNSUPPORTED_PROVIDER', `OAuth provider '${provider}' not supported`, 400);
    }

    const config = this.getProviderConfig(provider);
    
    // Check if provider is properly configured
    if (provider === 'google' && (!config.clientId || !config.clientSecret)) {
      throw new GatewayError('PROVIDER_NOT_CONFIGURED', `Google OAuth not properly configured`, 500);
    }

    if (provider === 'apple' && (!config.clientId || !config.privateKey || !config.teamId || !config.keyId)) {
      throw new GatewayError('PROVIDER_NOT_CONFIGURED', `Apple OAuth not properly configured`, 500);
    }

    return true;
  }
}

// Export singleton instance
module.exports = new OAuthService();