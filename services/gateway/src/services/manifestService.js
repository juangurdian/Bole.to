const crypto = require('crypto');
const { GatewayError } = require('../middleware/errorHandler');
const hiEventsService = require('./hiEventsService');

class ManifestService {
  constructor() {
    this.manifestSecret = process.env.MANIFEST_SECRET || 'default-manifest-secret-key';
    this.defaultMaxAge = parseInt(process.env.MANIFEST_MAX_AGE_MINUTES) || 60; // 1 hour
  }

  /**
   * Get event with user permissions check
   */
  async getEventWithPermissions(eventId, userId, accountId) {
    try {
      // Get event and permissions from Hi.Events service
      const permissions = await hiEventsService.getUserEventPermissions(eventId, userId, accountId);
      
      if (!permissions.canView) {
        return null;
      }

      return permissions.event;
    } catch (error) {
      console.error('Failed to get event with permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has manifest access (staff or organizer permissions)
   */
  async hasManifestAccess(event, userId, accountId) {
    try {
      // Get user permissions for this event
      const permissions = await hiEventsService.getUserEventPermissions(event.id, userId, accountId);
      
      // User needs scanning permissions to access manifest
      return permissions.canScan;
    } catch (error) {
      console.error('Failed to check manifest access:', error);
      return false;
    }
  }

  /**
   * Generate ETag for event data to support delta sync
   */
  async generateEventDataEtag(eventId, checkInListId = null) {
    try {
      // Get event's last modification timestamp and attendee count
      const [event, attendeeCount] = await Promise.all([
        hiEventsService.getEvent(eventId),
        this.getAttendeeCount(eventId, checkInListId)
      ]);

      if (!event) {
        throw new GatewayError('EVENT_NOT_FOUND', 'Event not found', 404);
      }

      // Create hash from event modification time, attendee count, and check-in list
      const hashData = [
        event.updated_at || event.created_at,
        attendeeCount.toString(),
        checkInListId || 'all',
        this.manifestSecret
      ].join('|');

      return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 16);
    } catch (error) {
      console.error('Failed to generate ETag:', error);
      throw error;
    }
  }

  /**
   * Get attendee count for ETag generation
   */
  async getAttendeeCount(eventId, checkInListId = null) {
    try {
      const result = await hiEventsService.getEventAttendees(eventId, {
        page: 1,
        perPage: 1,
        checkInListId,
        status: 'active'
      });
      
      return result.meta?.total || 0;
    } catch (error) {
      console.error('Failed to get attendee count:', error);
      return 0;
    }
  }

  /**
   * Generate event manifest for offline QR scanning
   */
  async generateEventManifest(options) {
    const {
      eventId,
      userId,
      accountId,
      checkInListId,
      includeDeleted = false,
      maxAge = this.defaultMaxAge
    } = options;

    try {
      // Get event data
      const event = await this.getEventWithPermissions(eventId, userId, accountId);
      if (!event) {
        throw new GatewayError('EVENT_NOT_FOUND', 'Event not found or access denied', 404);
      }

      // Get check-in lists for this event
      const checkInLists = await this.getEventCheckInLists(eventId, userId, accountId);

      // Get attendees and their tickets
      const attendees = await this.getEventAttendees(eventId, checkInListId, includeDeleted);

      // Generate current ETag
      const etag = await this.generateEventDataEtag(eventId, checkInListId);

      // Calculate expiration
      const expiresAt = new Date(Date.now() + maxAge * 60 * 1000);

      // Prepare manifest data
      const manifestData = {
        attendees,
        checkInLists: checkInListId ? 
          checkInLists.filter(list => list.id === checkInListId) : 
          checkInLists,
        etag,
        expiresAt: expiresAt.toISOString(),
        generatedAt: new Date().toISOString(),
        eventId,
        deltaSync: false, // TODO: Implement delta sync logic
        maxAge: maxAge * 60 // seconds
      };

      // Generate HMAC signature for data integrity
      const signature = this.signManifest(manifestData);
      manifestData.signature = signature;

      console.log(`Generated manifest for event ${eventId}: ${attendees.length} attendees, ${manifestData.checkInLists.length} check-in lists`);

      return manifestData;
    } catch (error) {
      console.error('Failed to generate event manifest:', error);
      throw error;
    }
  }

  /**
   * Get event check-in lists
   */
  async getEventCheckInLists(eventId, userId, accountId) {
    try {
      const lists = await hiEventsService.getEventCheckInLists(eventId);

      if (lists.length === 0) {
        // Return default check-in list if none found
        return [{
          id: 'default',
          name: 'General Admission',
          description: 'Default check-in list for all attendees',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }

      return lists.map(list => ({
        id: list.id,
        name: list.name || 'Default Check-in List',
        description: list.description || null,
        isActive: list.is_active ?? true,
        createdAt: list.created_at,
        updatedAt: list.updated_at
      }));
    } catch (error) {
      console.error('Failed to get check-in lists:', error);
      throw error;
    }
  }

  /**
   * Get event attendees with their tickets
   */
  async getEventAttendees(eventId, checkInListId = null, includeDeleted = false) {
    try {
      const options = {
        perPage: 1000, // Large page size for manifest
        checkInListId: checkInListId !== 'default' ? checkInListId : null,
        status: includeDeleted ? null : 'active',
        includeTickets: true
      };

      const result = await hiEventsService.getEventAttendees(eventId, options);
      const attendees = result.data || [];

      return attendees.map(attendee => ({
        id: attendee.id,
        ticketCode: attendee.short_id || attendee.id, // QR code identifier
        firstName: attendee.first_name || '',
        lastName: attendee.last_name || '',
        email: attendee.email || '',
        ticketType: attendee.ticket_type?.name || 'General Admission',
        ticketTypeId: attendee.ticket_type?.id || null,
        status: attendee.status || 'active',
        checkInStatus: attendee.checked_in_at ? 'checked_in' : 'not_checked_in',
        checkInAt: attendee.checked_in_at || null,
        checkInBy: attendee.checked_in_by || null,
        checkInListId: checkInListId || 'default',
        order: {
          id: attendee.order?.id || null,
          reference: attendee.order?.reference || null,
          status: attendee.order?.status || 'completed'
        },
        metadata: {
          createdAt: attendee.created_at,
          updatedAt: attendee.updated_at,
          publicId: attendee.public_id || null
        },
        // QR code data - simplified format for offline scanning
        qrData: this.generateQRData(attendee, eventId)
      }));
    } catch (error) {
      console.error('Failed to get event attendees:', error);
      throw error;
    }
  }

  /**
   * Generate QR code data for an attendee
   */
  generateQRData(attendee, eventId) {
    const qrPayload = {
      type: 'ticket',
      event: eventId,
      attendee: attendee.id,
      code: attendee.short_id || attendee.id,
      timestamp: Date.now()
    };

    // Create a signed QR payload
    const qrString = JSON.stringify(qrPayload);
    const signature = crypto
      .createHmac('sha256', this.manifestSecret)
      .update(qrString)
      .digest('hex')
      .substring(0, 8); // Short signature for QR space efficiency

    return {
      payload: qrPayload,
      signature,
      // Complete QR string that would be encoded in the QR code
      qrString: `${qrString}:${signature}`
    };
  }

  /**
   * Sign manifest data for integrity verification
   */
  signManifest(manifestData) {
    // Create signature excluding the signature field itself
    const { signature, ...dataToSign } = manifestData;
    const dataString = JSON.stringify(dataToSign, Object.keys(dataToSign).sort());
    
    return crypto
      .createHmac('sha256', this.manifestSecret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify manifest signature
   */
  verifyManifest(manifestData) {
    const providedSignature = manifestData.signature;
    const computedSignature = this.signManifest(manifestData);
    
    return providedSignature === computedSignature;
  }

  /**
   * Verify QR code data signature
   */
  verifyQRData(qrString) {
    try {
      const [payloadStr, signature] = qrString.split(':');
      if (!payloadStr || !signature) {
        return { valid: false, error: 'Invalid QR format' };
      }

      const payload = JSON.parse(payloadStr);
      const computedSignature = crypto
        .createHmac('sha256', this.manifestSecret)
        .update(payloadStr)
        .digest('hex')
        .substring(0, 8);

      if (signature !== computedSignature) {
        return { valid: false, error: 'Invalid QR signature' };
      }

      // Check timestamp (QR codes expire after 24 hours for security)
      const qrAge = Date.now() - payload.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (qrAge > maxAge) {
        return { valid: false, error: 'QR code expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Invalid QR data format' };
    }
  }
}

// Export singleton instance
module.exports = new ManifestService();