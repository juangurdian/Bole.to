const express = require('express');
const jwtService = require('../services/jwtService');
const hiEventsService = require('../services/hiEventsService');
const { GatewayError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * JWT Authentication middleware
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new GatewayError('MISSING_AUTHORIZATION', 'Authorization header required', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwtService.verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /me
 * Get current user profile
 */
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    
    // Get user profile from Hi.Events
    const user = await hiEventsService.getUserProfile(userId);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /me
 * Update current user profile
 */
router.put('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const updateData = req.body;
    
    // Validate and sanitize update data
    const allowedFields = ['firstName', 'lastName', 'profile'];
    const sanitizedData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = updateData[key];
      }
    });
    
    // Update user profile in Hi.Events
    const updatedUser = await hiEventsService.updateUser(userId, sanitizedData);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /me/accounts
 * Get user accounts
 */
router.get('/accounts', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    
    // Get user accounts from Hi.Events
    const accounts = await hiEventsService.getUserAccounts(userId);
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;