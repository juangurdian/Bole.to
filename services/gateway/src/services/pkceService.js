const crypto = require('crypto');
const { GatewayError } = require('../middleware/errorHandler');

class PKCEService {
  /**
   * Generate PKCE code verifier (43-128 characters, URL-safe)
   */
  generateCodeVerifier() {
    const buffer = crypto.randomBytes(32);
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE code challenge using S256 method
   */
  generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256');
    hash.update(codeVerifier);
    return hash
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate both verifier and challenge
   */
  generatePKCEPair() {
    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(codeVerifier);

      return {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256'
      };
    } catch (error) {
      console.error('PKCE generation failed:', error);
      throw new GatewayError('PKCE_GENERATION_FAILED', 'Failed to generate PKCE parameters', 500);
    }
  }

  /**
   * Verify PKCE code challenge against verifier
   */
  verifyCodeChallenge(codeVerifier, codeChallenge) {
    try {
      if (!codeVerifier || !codeChallenge) {
        throw new GatewayError('PKCE_MISSING_PARAMETERS', 'Missing PKCE parameters', 400);
      }

      // Validate code verifier format (43-128 characters)
      if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        throw new GatewayError('PKCE_INVALID_VERIFIER_LENGTH', 'Code verifier length must be between 43-128 characters', 400);
      }

      // Validate code verifier contains only allowed characters
      const validPattern = /^[A-Za-z0-9_~.-]+$/;
      if (!validPattern.test(codeVerifier)) {
        throw new GatewayError('PKCE_INVALID_VERIFIER_FORMAT', 'Code verifier contains invalid characters', 400);
      }

      const expectedChallenge = this.generateCodeChallenge(codeVerifier);
      
      if (expectedChallenge !== codeChallenge) {
        console.warn('PKCE verification failed:', { 
          expected: expectedChallenge, 
          received: codeChallenge 
        });
        throw new GatewayError('PKCE_VERIFICATION_FAILED', 'Code challenge verification failed', 400);
      }

      return true;
    } catch (error) {
      if (error instanceof GatewayError) {
        throw error;
      }
      console.error('PKCE verification error:', error);
      throw new GatewayError('PKCE_VERIFICATION_ERROR', 'Error during PKCE verification', 500);
    }
  }

  /**
   * Generate cryptographically secure state parameter
   */
  generateState() {
    try {
      const buffer = crypto.randomBytes(32);
      return buffer.toString('base64url');
    } catch (error) {
      console.error('State generation failed:', error);
      throw new GatewayError('STATE_GENERATION_FAILED', 'Failed to generate state parameter', 500);
    }
  }

  /**
   * Validate state parameter format
   */
  validateState(state) {
    if (!state || typeof state !== 'string') {
      throw new GatewayError('INVALID_STATE_FORMAT', 'State parameter must be a non-empty string', 400);
    }

    // State should be at least 32 bytes of entropy
    if (state.length < 43) { // 32 bytes base64url encoded ≈ 43 chars
      throw new GatewayError('INVALID_STATE_LENGTH', 'State parameter insufficient entropy', 400);
    }

    // Validate base64url format
    const base64urlPattern = /^[A-Za-z0-9_-]+$/;
    if (!base64urlPattern.test(state)) {
      throw new GatewayError('INVALID_STATE_FORMAT', 'State parameter contains invalid characters', 400);
    }

    return true;
  }
}

// Export singleton instance
module.exports = new PKCEService();