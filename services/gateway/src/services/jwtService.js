const jwt = require('jsonwebtoken');
const { createPublicKey, createPrivateKey, generateKeyPairSync } = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { GatewayError } = require('../middleware/errorHandler');

class JWTService {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
    this.keyId = process.env.JWT_KEY_ID || 'gateway-key-1';
    this.issuer = process.env.JWT_ISSUER || 'https://api.bole.to';
    this.audience = process.env.JWT_AUDIENCE || 'boleto-mobile';
    this.accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d';
    
    this.initializeKeys();
  }

  /**
   * Initialize RSA key pair for JWT signing
   */
  initializeKeys() {
    try {
      const privateKeyPem = process.env.JWT_PRIVATE_KEY;
      const publicKeyPem = process.env.JWT_PUBLIC_KEY;

      if (privateKeyPem && publicKeyPem) {
        // Use provided keys
        this.privateKey = createPrivateKey({
          key: privateKeyPem.replace(/\\n/g, '\n'),
          format: 'pem'
        });
        this.publicKey = createPublicKey({
          key: publicKeyPem.replace(/\\n/g, '\n'),
          format: 'pem'
        });
        console.log('✅ JWT keys loaded from environment');
      } else {
        // Generate new keys for development
        console.warn('⚠️  No JWT keys found in environment, generating new ones...');
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });

        this.privateKey = createPrivateKey(privateKey);
        this.publicKey = createPublicKey(publicKey);
        
        console.log('🔑 Generated new RSA key pair for development');
        console.log('🔑 Private Key:\n', privateKey);
        console.log('🔑 Public Key:\n', publicKey);
        console.warn('⚠️  In production, use pre-generated keys stored in environment variables');
      }
    } catch (error) {
      console.error('❌ Failed to initialize JWT keys:', error);
      throw new GatewayError('JWT_KEY_INIT_FAILED', 'Failed to initialize JWT keys', 500);
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        iss: this.issuer,
        aud: this.audience,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.accessTokenExpiry),
        jti: uuidv4(),
        scope: 'user'
      };

      return jwt.sign(tokenPayload, this.privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId
      });
    } catch (error) {
      console.error('Failed to generate access token:', error);
      throw new GatewayError('TOKEN_GENERATION_FAILED', 'Failed to generate access token', 500);
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        sub: payload.sub,
        aid: payload.aid,
        iss: this.issuer,
        aud: this.audience,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.refreshTokenExpiry),
        jti: uuidv4(),
        scope: 'refresh'
      };

      return jwt.sign(tokenPayload, this.privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId
      });
    } catch (error) {
      console.error('Failed to generate refresh token:', error);
      throw new GatewayError('TOKEN_GENERATION_FAILED', 'Failed to generate refresh token', 500);
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new GatewayError('TOKEN_EXPIRED', 'Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new GatewayError('INVALID_TOKEN', 'Invalid or malformed token', 401);
      } else {
        throw new GatewayError('TOKEN_VERIFICATION_FAILED', 'Token verification failed', 401);
      }
    }
  }

  /**
   * Decode JWT token without verification (for inspection)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      throw new GatewayError('TOKEN_DECODE_FAILED', 'Failed to decode token', 400);
    }
  }

  /**
   * Get public key in JWK format for JWKS endpoint
   */
  getJWKS() {
    try {
      const publicKeyObject = this.publicKey.export({ format: 'jwk' });
      
      return {
        keys: [
          {
            kty: publicKeyObject.kty,
            kid: this.keyId,
            use: 'sig',
            alg: 'RS256',
            n: publicKeyObject.n,
            e: publicKeyObject.e
          }
        ]
      };
    } catch (error) {
      console.error('Failed to generate JWKS:', error);
      throw new GatewayError('JWKS_GENERATION_FAILED', 'Failed to generate JWKS', 500);
    }
  }

  /**
   * Parse expiry string to seconds
   */
  parseExpiry(expiryString) {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new GatewayError('INVALID_EXPIRY_FORMAT', 'Invalid expiry format', 500);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's': return numValue;
      case 'm': return numValue * 60;
      case 'h': return numValue * 60 * 60;
      case 'd': return numValue * 24 * 60 * 60;
      default: throw new GatewayError('INVALID_EXPIRY_UNIT', 'Invalid expiry time unit', 500);
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.parseExpiry(this.accessTokenExpiry),
      refresh_token: refreshToken,
      refresh_expires_in: this.parseExpiry(this.refreshTokenExpiry)
    };
  }
}

// Export singleton instance
module.exports = new JWTService();