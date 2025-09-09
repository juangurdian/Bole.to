import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { offlineManifestService, ManifestAttendee } from './OfflineManifestService';
import { GatewayAuthService } from '../auth/gateway-auth-service';

// QR Code data structure
export interface BoletoQRData {
  type: 'boleto_checkin';
  attendeeId: string;
  eventId: string;
  checkInListId: string;
  signature: string;
  timestamp?: string;
}

export interface QRValidationResult {
  isValid: boolean;
  attendee?: ManifestAttendee;
  error?: string;
  errorCode?: 'INVALID_FORMAT' | 'INVALID_SIGNATURE' | 'ATTENDEE_NOT_FOUND' | 'ALREADY_CHECKED_IN' | 'EXPIRED_CODE';
}

export interface CheckInResult {
  success: boolean;
  message: string;
  attendee?: ManifestAttendee;
  isOffline: boolean;
}

export class QRValidationService {
  private static instance: QRValidationService;
  private gatewayAuth: GatewayAuthService;
  private validationSecret: string | null = null;

  private constructor() {
    this.gatewayAuth = GatewayAuthService.getInstance();
  }

  public static getInstance(): QRValidationService {
    if (!QRValidationService.instance) {
      QRValidationService.instance = new QRValidationService();
    }
    return QRValidationService.instance;
  }

  /**
   * Validate and parse QR code data
   */
  async validateQRCode(qrCodeString: string): Promise<QRValidationResult> {
    try {
      // Parse QR code JSON
      const qrData = this.parseQRCode(qrCodeString);
      if (!qrData) {
        return {
          isValid: false,
          error: 'Invalid QR code format',
          errorCode: 'INVALID_FORMAT'
        };
      }

      // Validate QR code structure
      if (!this.isValidQRStructure(qrData)) {
        return {
          isValid: false,
          error: 'Invalid QR code structure',
          errorCode: 'INVALID_FORMAT'
        };
      }

      // Find attendee in offline manifest
      const attendee = await offlineManifestService.findAttendeeByQRCode(qrCodeString);
      if (!attendee) {
        return {
          isValid: false,
          error: 'Attendee not found in manifest',
          errorCode: 'ATTENDEE_NOT_FOUND'
        };
      }

      // Validate HMAC signature using Gateway-provided secret
      const isValidSignature = await this.validateHMACSignature(qrData, attendee);
      if (!isValidSignature) {
        return {
          isValid: false,
          error: 'Invalid QR code signature',
          errorCode: 'INVALID_SIGNATURE'
        };
      }

      // Check if already checked in
      if (attendee.checkedIn) {
        return {
          isValid: true,
          attendee,
          error: 'Attendee already checked in',
          errorCode: 'ALREADY_CHECKED_IN'
        };
      }

      return {
        isValid: true,
        attendee
      };
    } catch (error) {
      console.error('QR validation error:', error);
      return {
        isValid: false,
        error: 'QR code validation failed',
        errorCode: 'INVALID_FORMAT'
      };
    }
  }

  /**
   * Perform check-in operation
   */
  async performCheckIn(qrCodeString: string): Promise<CheckInResult> {
    const validation = await this.validateQRCode(qrCodeString);
    
    if (!validation.isValid || !validation.attendee) {
      return {
        success: false,
        message: validation.error || 'Invalid QR code',
        isOffline: true
      };
    }

    if (validation.errorCode === 'ALREADY_CHECKED_IN') {
      return {
        success: false,
        message: `${validation.attendee.firstName} ${validation.attendee.lastName} is already checked in`,
        attendee: validation.attendee,
        isOffline: true
      };
    }

    try {
      // Perform offline check-in
      const result = await offlineManifestService.performOfflineCheckIn(
        validation.attendee.attendeeShortId.split('_')[1], // Extract check-in list ID
        validation.attendee.attendeeShortId
      );

      return {
        success: result.success,
        message: result.message,
        attendee: result.attendee || validation.attendee,
        isOffline: true
      };
    } catch (error) {
      console.error('Check-in failed:', error);
      return {
        success: false,
        message: 'Check-in operation failed',
        isOffline: true
      };
    }
  }

  /**
   * Perform check-in by attendee short ID (for manual lookup)
   */
  async performCheckInByShortId(checkInListId: string, attendeeShortId: string): Promise<CheckInResult> {
    try {
      const attendee = await offlineManifestService.findAttendeeByShortId(checkInListId, attendeeShortId);
      
      if (!attendee) {
        return {
          success: false,
          message: 'Attendee not found',
          isOffline: true
        };
      }

      if (attendee.checkedIn) {
        return {
          success: false,
          message: `${attendee.firstName} ${attendee.lastName} is already checked in`,
          attendee,
          isOffline: true
        };
      }

      const result = await offlineManifestService.performOfflineCheckIn(checkInListId, attendeeShortId);

      return {
        success: result.success,
        message: result.message,
        attendee: result.attendee || attendee,
        isOffline: true
      };
    } catch (error) {
      console.error('Manual check-in failed:', error);
      return {
        success: false,
        message: 'Check-in operation failed',
        isOffline: true
      };
    }
  }

  /**
   * Undo check-in operation
   */
  async undoCheckIn(checkInListId: string, attendeeShortId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await offlineManifestService.undoOfflineCheckIn(checkInListId, attendeeShortId);
    } catch (error) {
      console.error('Undo check-in failed:', error);
      return {
        success: false,
        message: 'Undo operation failed'
      };
    }
  }

  /**
   * Generate QR code data for testing
   */
  async generateTestQRCode(attendeeId: string, eventId: string, checkInListId: string): Promise<string> {
    const qrData: BoletoQRData = {
      type: 'boleto_checkin',
      attendeeId,
      eventId,
      checkInListId,
      signature: await this.generateSignature(attendeeId, eventId, checkInListId),
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(qrData);
  }

  // Private helper methods

  private parseQRCode(qrCodeString: string): BoletoQRData | null {
    try {
      const data = JSON.parse(qrCodeString);
      return data as BoletoQRData;
    } catch (error) {
      // Try to handle other QR formats or plain text
      console.warn('Failed to parse QR as JSON:', error);
      return null;
    }
  }

  private isValidQRStructure(qrData: any): qrData is BoletoQRData {
    return (
      qrData &&
      typeof qrData === 'object' &&
      qrData.type === 'boleto_checkin' &&
      typeof qrData.attendeeId === 'string' &&
      typeof qrData.eventId === 'string' &&
      typeof qrData.checkInListId === 'string' &&
      typeof qrData.signature === 'string'
    );
  }

  /**
   * Get or retrieve the validation secret from secure storage
   */
  private async getValidationSecret(): Promise<string | null> {
    if (this.validationSecret) {
      return this.validationSecret;
    }

    try {
      // Try to get cached secret first
      this.validationSecret = await SecureStore.getItemAsync('qr_validation_secret');
      
      if (!this.validationSecret) {
        // Fetch validation secret from Gateway
        const response = await this.gatewayAuth.client.request('/auth/validation-secret', {
          method: 'GET',
        });
        
        if (response.data?.secret) {
          this.validationSecret = response.data.secret;
          await SecureStore.setItemAsync('qr_validation_secret', this.validationSecret);
        }
      }
      
      return this.validationSecret;
    } catch (error) {
      console.error('Failed to get validation secret:', error);
      return null;
    }
  }

  /**
   * Validate HMAC signature using cryptographic verification
   */
  private async validateHMACSignature(qrData: BoletoQRData, attendee: ManifestAttendee): Promise<boolean> {
    try {
      // Get the validation secret
      const secret = await this.getValidationSecret();
      if (!secret) {
        console.error('No validation secret available');
        return false;
      }

      // Check that the QR data matches the attendee
      if (qrData.attendeeId !== attendee.attendeeId) {
        return false;
      }

      // Create the message to verify
      const message = this.createSignatureMessage(qrData);
      
      // Compute expected HMAC-SHA256 signature
      const expectedSignature = await this.computeHMAC(message, secret);
      
      // Compare signatures using constant-time comparison
      return this.constantTimeCompare(qrData.signature, expectedSignature);
    } catch (error) {
      console.error('HMAC signature validation failed:', error);
      return false;
    }
  }

  /**
   * Create the message string for HMAC signature
   */
  private createSignatureMessage(qrData: BoletoQRData): string {
    return `${qrData.type}:${qrData.attendeeId}:${qrData.eventId}:${qrData.checkInListId}:${qrData.timestamp || ''}`;
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  private async computeHMAC(message: string, secret: string): Promise<string> {
    try {
      // Create HMAC key from secret
      const keyData = new TextEncoder().encode(secret);
      const messageData = new TextEncoder().encode(message);
      
      // Import the key for HMAC
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      // Compute HMAC
      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Failed to compute HMAC:', error);
      // Fallback to crypto digest if SubtleCrypto is not available
      const combinedData = secret + message;
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combinedData,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Generate HMAC signature for QR code
   */
  private async generateSignature(attendeeId: string, eventId: string, checkInListId: string): Promise<string> {
    try {
      const secret = await this.getValidationSecret();
      if (!secret) {
        throw new Error('No validation secret available for signature generation');
      }

      const timestamp = Date.now().toString();
      const qrData: BoletoQRData = {
        type: 'boleto_checkin',
        attendeeId,
        eventId,
        checkInListId,
        signature: '', // Will be filled after computation
        timestamp
      };

      const message = this.createSignatureMessage(qrData);
      return await this.computeHMAC(message, secret);
    } catch (error) {
      console.error('Failed to generate signature:', error);
      // Fallback to basic signature generation for development
      const data = `${attendeeId}:${eventId}:${checkInListId}:${Date.now()}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return hash;
    }
  }

  /**
   * Validate ticket reference format
   */
  isValidTicketReference(reference: string): boolean {
    // Basic validation for ticket reference format
    const ticketRefPattern = /^TKT[A-Z0-9]{6,12}$/i;
    return ticketRefPattern.test(reference);
  }

  /**
   * Validate attendee short ID format
   */
  isValidAttendeeShortId(shortId: string): boolean {
    // Basic validation for attendee short ID format
    const shortIdPattern = /^ATT\d{4,8}$/i;
    return shortIdPattern.test(shortId);
  }

  /**
   * Extract attendee information from QR code without validation
   */
  extractAttendeeInfo(qrCodeString: string): { attendeeId?: string; eventId?: string; checkInListId?: string } | null {
    try {
      const qrData = this.parseQRCode(qrCodeString);
      if (!qrData) return null;

      return {
        attendeeId: qrData.attendeeId,
        eventId: qrData.eventId,
        checkInListId: qrData.checkInListId
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const qrValidationService = QRValidationService.getInstance();