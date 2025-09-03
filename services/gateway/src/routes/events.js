const express = require('express');
const { param, query, validationResult } = require('express-validator');
const crypto = require('crypto');

const jwtService = require('../services/jwtService');
const hiEventsService = require('../services/hiEventsService');
const manifestService = require('../services/manifestService');
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
 * JWT Authentication middleware
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new GatewayError('UNAUTHORIZED', 'Authorization header required', 401);
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwtService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new GatewayError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }
};

/**
 * GET /events/:id/tickets/manifest
 * Returns signed bundle of attendee data for offline QR scanning
 * 
 * Query parameters:
 * - etag: Client's current ETag for delta sync
 * - checkInList: Specific check-in list ID (optional)
 * 
 * Response format:
 * {
 *   attendees: Array of attendee objects with tickets,
 *   checkInLists: Array of available check-in lists,
 *   etag: Current data version hash,
 *   expiresAt: Manifest expiration timestamp,
 *   deltaSync: Boolean indicating if this is a delta update,
 *   signature: HMAC signature for data integrity verification
 * }
 */
router.get('/events/:id/tickets/manifest',
  [
    param('id').isUUID().withMessage('Event ID must be a valid UUID'),
    query('etag').optional().isString().isLength({ min: 8, max: 64 }),
    query('checkInList').optional().isUUID().withMessage('Check-in list ID must be a valid UUID')
  ],
  validateRequest,
  authenticateJWT,
  async (req, res, next) => {
    try {
      const { id: eventId } = req.params;
      const { etag: clientEtag, checkInList } = req.query;
      const userId = req.user.sub;
      const accountId = req.user.aid;

      // Verify user has access to this event
      const event = await manifestService.getEventWithPermissions(eventId, userId, accountId);
      
      if (!event) {
        throw new GatewayError('EVENT_NOT_FOUND', 'Event not found or access denied', 404);
      }

      // Check if user has staff/organizer permissions for this event
      if (!(await manifestService.hasManifestAccess(event, userId, accountId))) {
        throw new GatewayError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to access event manifest', 403);
      }

      // Generate current data hash to check for updates
      const currentEtag = await manifestService.generateEventDataEtag(eventId, checkInList);

      // Check if client has the latest data (HTTP 304 Not Modified)
      if (clientEtag && clientEtag === currentEtag) {
        res.set('ETag', currentEtag);
        return res.status(304).end();
      }

      // Prepare manifest options
      const manifestOptions = {
        eventId,
        userId,
        accountId,
        checkInListId: checkInList,
        includeDeleted: false,
        maxAge: process.env.MANIFEST_MAX_AGE_MINUTES || 60 // 1 hour default
      };

      // Generate the manifest
      const manifest = await manifestService.generateEventManifest(manifestOptions);

      // Set response headers
      res.set({
        'ETag': manifest.etag,
        'Cache-Control': `private, max-age=${manifest.maxAge * 60}`,
        'Expires': manifest.expiresAt,
        'X-Manifest-Version': '1.0',
        'X-Event-ID': eventId,
        'X-Generated-At': new Date().toISOString()
      });

      // Log manifest access for auditing
      console.log(`[${req.requestId}] Manifest generated for event ${eventId} by user ${userId}`);

      res.json({
        success: true,
        data: manifest
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /events/:id/tickets/check-in
 * Check in attendee using offline-verified QR data
 * 
 * Body:
 * {
 *   ticketCode: "string",
 *   checkInListId: "uuid", 
 *   timestamp: "ISO string",
 *   staffUserId: "string",
 *   signature: "string" // HMAC signature for integrity
 * }
 */
router.post('/events/:id/tickets/check-in',
  [
    param('id').isUUID().withMessage('Event ID must be a valid UUID'),
    // Body validation would go here
  ],
  validateRequest,
  authenticateJWT,
  async (req, res, next) => {
    try {
      const { id: eventId } = req.params;
      const userId = req.user.sub;
      const accountId = req.user.aid;

      // This endpoint would handle offline check-ins when reconnected
      // For now, proxy to Hi.Events backend
      throw new GatewayError('NOT_IMPLEMENTED', 'Offline check-in sync not yet implemented', 501);

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /events/:id/check-in-lists
 * Get available check-in lists for an event
 */
router.get('/events/:id/check-in-lists',
  [
    param('id').isUUID().withMessage('Event ID must be a valid UUID')
  ],
  validateRequest,
  authenticateJWT,
  async (req, res, next) => {
    try {
      const { id: eventId } = req.params;
      const userId = req.user.sub;
      const accountId = req.user.aid;

      // Get check-in lists from Hi.Events
      const checkInLists = await manifestService.getEventCheckInLists(eventId, userId, accountId);

      res.json({
        success: true,
        data: {
          checkInLists,
          eventId
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;