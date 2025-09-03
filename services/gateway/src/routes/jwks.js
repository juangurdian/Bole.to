const jwtService = require('../services/jwtService');
const { GatewayError } = require('../middleware/errorHandler');

/**
 * JWKS (JSON Web Key Set) endpoint
 * Provides public keys for JWT verification
 */
module.exports = async (req, res, next) => {
  try {
    const jwks = jwtService.getJWKS();

    // Set appropriate cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Type': 'application/json'
    });

    res.json(jwks);
  } catch (error) {
    console.error('JWKS endpoint error:', error);
    next(new GatewayError('JWKS_ERROR', 'Failed to generate JWKS', 500));
  }
};