import * as SQLite from 'expo-sqlite';
import { GatewayAuthService } from '../auth/gateway-auth-service';
import NetInfo from '@react-native-community/netinfo';

// Types for offline manifest system
export interface TicketManifest {
  id?: number; // SQLite auto-increment
  eventId: string;
  checkInListId: string;
  version: string;
  etag: string;
  expiresAt: string;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManifestAttendee {
  id?: number; // SQLite auto-increment
  manifestId: number;
  attendeeId: string;
  attendeeShortId: string;
  ticketReference: string;
  firstName: string;
  lastName: string;
  email: string;
  productName: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  qrCodeData: string | null;
  synced: boolean;
}

export interface OfflineCheckIn {
  id?: number; // SQLite auto-increment
  localId: string;
  attendeeShortId: string;
  checkInListId: string;
  action: 'checkin' | 'undo';
  timestamp: string;
  synced: boolean;
  serverId: string | null;
  error: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflictCount: number;
  errors: string[];
}

export class OfflineManifestService {
  private static instance: OfflineManifestService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private gatewayAuth: GatewayAuthService;

  private constructor() {
    this.gatewayAuth = GatewayAuthService.getInstance();
  }

  public static getInstance(): OfflineManifestService {
    if (!OfflineManifestService.instance) {
      OfflineManifestService.instance = new OfflineManifestService();
    }
    return OfflineManifestService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('offline_manifests.db');
      await this.createTables();
      this.isInitialized = true;
      console.log('OfflineManifestService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineManifestService:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Offline manifest storage
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_manifests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        check_in_list_id TEXT NOT NULL,
        version TEXT NOT NULL,
        etag TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        signature TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, check_in_list_id)
      );
    `);

    // Offline attendees cache
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manifest_id INTEGER NOT NULL,
        attendee_id TEXT NOT NULL,
        attendee_short_id TEXT NOT NULL,
        ticket_reference TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        product_name TEXT,
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at TEXT,
        qr_code_data TEXT,
        synced BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (manifest_id) REFERENCES offline_manifests(id),
        UNIQUE(manifest_id, attendee_id)
      );
    `);

    // Offline check-in queue (for when back online)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_checkin_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT NOT NULL UNIQUE,
        attendee_short_id TEXT NOT NULL,
        check_in_list_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('checkin', 'undo')),
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE,
        server_id TEXT,
        error TEXT
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_manifests_event_checkin 
      ON offline_manifests(event_id, check_in_list_id);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_attendees_manifest_short_id 
      ON offline_attendees(manifest_id, attendee_short_id);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_checkin_queue_synced 
      ON offline_checkin_queue(synced);
    `);
  }

  // Manifest management
  async downloadManifest(eventId: string, checkInListId: string, forceRefresh = false): Promise<TicketManifest> {
    if (!this.isInitialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if we have a cached manifest that's still valid
      if (!forceRefresh) {
        const cached = await this.getCachedManifest(eventId, checkInListId);
        if (cached && new Date(cached.expiresAt) > new Date()) {
          console.log('Using cached manifest');
          return cached;
        }
      }

      // Get current manifest etag for delta updates
      const currentManifest = await this.getCachedManifest(eventId, checkInListId);
      let manifest;

      if (currentManifest && !forceRefresh) {
        try {
          // Try delta update first
          manifest = await this.gatewayAuth.getDeltaManifest(eventId, currentManifest.etag);
          console.log('Downloaded delta manifest update');
        } catch (error) {
          // Delta update failed, download full manifest
          console.log('Delta update failed, downloading full manifest:', error);
          manifest = await this.gatewayAuth.getEventManifest(eventId);
        }
      } else {
        // Download full manifest
        manifest = await this.gatewayAuth.getEventManifest(eventId);
      }

      // Store in database
      await this.storeManifest(manifest);
      
      console.log(`Downloaded manifest for event ${eventId}, list ${checkInListId}`);
      return this.manifestToTicketManifest(manifest);
    } catch (error) {
      console.error('Failed to download manifest:', error);
      
      // Try to return cached version as fallback
      const cached = await this.getCachedManifest(eventId, checkInListId);
      if (cached) {
        console.log('Using expired cached manifest as fallback');
        return cached;
      }
      
      throw error;
    }
  }

  private async getCachedManifest(eventId: string, checkInListId: string): Promise<TicketManifest | null> {
    if (!this.db) return null;

    const result = await this.db.getFirstAsync<TicketManifest>(
      'SELECT * FROM offline_manifests WHERE event_id = ? AND check_in_list_id = ?',
      [eventId, checkInListId]
    );

    return result || null;
  }

  private async storeManifest(manifest: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('BEGIN TRANSACTION');

    try {
      // Insert or replace manifest
      const manifestResult = await this.db.runAsync(`
        INSERT OR REPLACE INTO offline_manifests 
        (event_id, check_in_list_id, version, etag, expires_at, signature, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        manifest.eventId,
        manifest.checkInListId,
        manifest.version,
        manifest.etag,
        manifest.expiresAt,
        manifest.signature
      ]);

      const manifestId = manifestResult.lastInsertRowId;

      // Clear existing attendees for this manifest
      await this.db.runAsync(
        'DELETE FROM offline_attendees WHERE manifest_id = ?',
        [manifestId]
      );

      // Insert attendees
      for (const attendee of manifest.attendees) {
        await this.db.runAsync(`
          INSERT INTO offline_attendees 
          (manifest_id, attendee_id, attendee_short_id, ticket_reference, first_name, last_name, 
           email, product_name, checked_in, checked_in_at, qr_code_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          manifestId,
          attendee.attendeeId,
          attendee.attendeeShortId,
          attendee.ticketReference,
          attendee.firstName,
          attendee.lastName,
          attendee.email,
          attendee.productName,
          attendee.checkedIn ? 1 : 0,
          attendee.checkedInAt,
          attendee.qrCodeData
        ]);
      }

      await this.db.runAsync('COMMIT');
      console.log(`Stored manifest with ${manifest.attendees.length} attendees`);
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      throw error;
    }
  }

  // Attendee operations
  async findAttendeeByShortId(checkInListId: string, attendeeShortId: string): Promise<ManifestAttendee | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<any>(`
      SELECT a.*, m.check_in_list_id, m.event_id
      FROM offline_attendees a
      JOIN offline_manifests m ON a.manifest_id = m.id
      WHERE m.check_in_list_id = ? AND a.attendee_short_id = ?
    `, [checkInListId, attendeeShortId]);

    return result ? this.dbRowToManifestAttendee(result) : null;
  }

  async findAttendeeByQRCode(qrCodeData: string): Promise<ManifestAttendee | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const qrData = JSON.parse(qrCodeData);
      if (qrData.type !== 'boleto_checkin') {
        throw new Error('Invalid QR code type');
      }

      const result = await this.db.getFirstAsync<any>(`
        SELECT a.*, m.check_in_list_id, m.event_id
        FROM offline_attendees a
        JOIN offline_manifests m ON a.manifest_id = m.id
        WHERE m.check_in_list_id = ? AND a.attendee_id = ?
      `, [qrData.checkInListId, qrData.attendeeId]);

      return result ? this.dbRowToManifestAttendee(result) : null;
    } catch (error) {
      console.error('Failed to parse QR code data:', error);
      return null;
    }
  }

  async searchAttendees(checkInListId: string, query: string, limit = 20): Promise<ManifestAttendee[]> {
    if (!this.db) throw new Error('Database not initialized');

    const searchQuery = `%${query.toLowerCase()}%`;
    const results = await this.db.getAllAsync<any>(`
      SELECT a.*, m.check_in_list_id, m.event_id
      FROM offline_attendees a
      JOIN offline_manifests m ON a.manifest_id = m.id
      WHERE m.check_in_list_id = ? 
      AND (
        LOWER(a.first_name) LIKE ? OR 
        LOWER(a.last_name) LIKE ? OR 
        LOWER(a.email) LIKE ? OR 
        LOWER(a.attendee_short_id) LIKE ?
      )
      ORDER BY a.first_name, a.last_name
      LIMIT ?
    `, [checkInListId, searchQuery, searchQuery, searchQuery, searchQuery, limit]);

    return results.map(this.dbRowToManifestAttendee);
  }

  // Check-in operations
  async performOfflineCheckIn(checkInListId: string, attendeeShortId: string): Promise<{ success: boolean; message: string; attendee?: ManifestAttendee }> {
    if (!this.db) throw new Error('Database not initialized');

    const attendee = await this.findAttendeeByShortId(checkInListId, attendeeShortId);
    if (!attendee) {
      return { success: false, message: 'Attendee not found' };
    }

    if (attendee.checkedIn) {
      return { success: false, message: 'Already checked in', attendee };
    }

    await this.db.runAsync('BEGIN TRANSACTION');

    try {
      const checkInTime = new Date().toISOString();
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update attendee status locally
      await this.db.runAsync(`
        UPDATE offline_attendees 
        SET checked_in = 1, checked_in_at = ?, synced = 0 
        WHERE id = ?
      `, [checkInTime, attendee.id]);

      // Add to sync queue
      await this.db.runAsync(`
        INSERT INTO offline_checkin_queue 
        (local_id, attendee_short_id, check_in_list_id, action, timestamp)
        VALUES (?, ?, ?, 'checkin', ?)
      `, [localId, attendeeShortId, checkInListId, checkInTime]);

      await this.db.runAsync('COMMIT');

      const updatedAttendee = { ...attendee, checkedIn: true, checkedInAt: checkInTime, synced: false };
      
      console.log(`Offline check-in completed for ${attendeeShortId}`);
      return { success: true, message: 'Check-in successful (offline)', attendee: updatedAttendee };
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Offline check-in failed:', error);
      return { success: false, message: 'Check-in failed' };
    }
  }

  async undoOfflineCheckIn(checkInListId: string, attendeeShortId: string): Promise<{ success: boolean; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    const attendee = await this.findAttendeeByShortId(checkInListId, attendeeShortId);
    if (!attendee || !attendee.checkedIn) {
      return { success: false, message: 'Attendee not checked in' };
    }

    await this.db.runAsync('BEGIN TRANSACTION');

    try {
      const localId = `local_undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update attendee status locally
      await this.db.runAsync(`
        UPDATE offline_attendees 
        SET checked_in = 0, checked_in_at = NULL, synced = 0 
        WHERE id = ?
      `, [attendee.id]);

      // Add to sync queue
      await this.db.runAsync(`
        INSERT INTO offline_checkin_queue 
        (local_id, attendee_short_id, check_in_list_id, action, timestamp)
        VALUES (?, ?, ?, 'undo', ?)
      `, [localId, attendeeShortId, checkInListId, new Date().toISOString()]);

      await this.db.runAsync('COMMIT');
      
      console.log(`Offline undo check-in completed for ${attendeeShortId}`);
      return { success: true, message: 'Check-in undone (offline)' };
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Offline undo check-in failed:', error);
      return { success: false, message: 'Undo failed' };
    }
  }

  // Sync operations
  async syncWithServer(): Promise<SyncResult> {
    if (!this.isInitialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return { success: false, syncedItems: 0, conflictCount: 0, errors: ['No network connection'] };
    }

    try {
      const queuedItems = await this.getQueuedCheckIns();
      
      if (queuedItems.length === 0) {
        console.log('No items to sync');
        return { success: true, syncedItems: 0, conflictCount: 0, errors: [] };
      }

      console.log(`Syncing ${queuedItems.length} queued check-ins`);

      // Sync check-ins with Gateway
      const syncResults = await this.syncCheckInsWithGateway(queuedItems);
      
      // Update local database with sync results
      await this.processSyncResults(syncResults.results);

      const successCount = syncResults.results.filter(r => r.success).length;
      const conflictCount = syncResults.conflicts?.length || 0;
      const errors = syncResults.results.filter(r => !r.success && r.error).map(r => r.error);

      console.log(`Sync completed: ${successCount} successful, ${conflictCount} conflicts`);
      
      return {
        success: errors.length === 0,
        syncedItems: successCount,
        conflictCount,
        errors
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return { 
        success: false, 
        syncedItems: 0, 
        conflictCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  private async getQueuedCheckIns(): Promise<OfflineCheckIn[]> {
    if (!this.db) return [];

    const results = await this.db.getAllAsync<any>(
      'SELECT * FROM offline_checkin_queue WHERE synced = 0 ORDER BY timestamp ASC'
    );

    return results.map(row => ({
      id: row.id,
      localId: row.local_id,
      attendeeShortId: row.attendee_short_id,
      checkInListId: row.check_in_list_id,
      action: row.action as 'checkin' | 'undo',
      timestamp: row.timestamp,
      synced: row.synced === 1,
      serverId: row.server_id,
      error: row.error
    }));
  }

  /**
   * Sync check-ins with Gateway service
   */
  private async syncCheckInsWithGateway(queuedItems: OfflineCheckIn[]): Promise<any> {
    try {
      // Group by check-in list for batch processing
      const groupedByList = queuedItems.reduce((groups, item) => {
        if (!groups[item.checkInListId]) {
          groups[item.checkInListId] = [];
        }
        groups[item.checkInListId].push(item);
        return groups;
      }, {} as Record<string, OfflineCheckIn[]>);

      const allResults: any[] = [];
      const allConflicts: any[] = [];

      // Process each check-in list group
      for (const [checkInListId, items] of Object.entries(groupedByList)) {
        try {
          const syncPayload = items.map(item => ({
            localId: item.localId,
            attendeeShortId: item.attendeeShortId,
            action: item.action,
            timestamp: item.timestamp,
          }));

          // Call Gateway sync endpoint
          const response = await this.gatewayAuth.client.request(
            `/checkins/${checkInListId}/sync`,
            {
              method: 'POST',
              body: JSON.stringify({
                operations: syncPayload
              }),
            }
          );

          const results = response.data?.results || [];
          const conflicts = response.data?.conflicts || [];

          allResults.push(...results);
          allConflicts.push(...conflicts);

        } catch (error) {
          console.error(`Failed to sync check-ins for list ${checkInListId}:`, error);
          
          // Mark all items in this group as failed
          items.forEach(item => {
            allResults.push({
              localId: item.localId,
              success: false,
              error: error instanceof Error ? error.message : 'Sync failed'
            });
          });
        }
      }

      return {
        results: allResults,
        conflicts: allConflicts
      };

    } catch (error) {
      console.error('Gateway sync failed:', error);
      
      // Mark all items as failed
      const results = queuedItems.map(item => ({
        localId: item.localId,
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));

      return {
        results,
        conflicts: []
      };
    }
  }

  private async processSyncResults(results: any[]): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync('BEGIN TRANSACTION');

    try {
      for (const result of results) {
        if (result.success) {
          // Mark as synced and store server ID
          await this.db.runAsync(`
            UPDATE offline_checkin_queue 
            SET synced = 1, server_id = ? 
            WHERE local_id = ?
          `, [result.serverId, result.localId]);

          // Mark corresponding attendee as synced
          await this.db.runAsync(`
            UPDATE offline_attendees 
            SET synced = 1 
            WHERE attendee_short_id = (
              SELECT attendee_short_id FROM offline_checkin_queue WHERE local_id = ?
            )
          `, [result.localId]);
        } else {
          // Store error for failed sync
          await this.db.runAsync(`
            UPDATE offline_checkin_queue 
            SET error = ? 
            WHERE local_id = ?
          `, [result.error, result.localId]);
        }
      }

      await this.db.runAsync('COMMIT');
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      throw error;
    }
  }

  // Status and utility methods
  async getOfflineStatus(checkInListId: string): Promise<{
    isOfflineReady: boolean;
    lastSync: string | null;
    queuedChanges: number;
    manifestExpiry: string | null;
  }> {
    if (!this.db) {
      return { isOfflineReady: false, lastSync: null, queuedChanges: 0, manifestExpiry: null };
    }

    const manifest = await this.db.getFirstAsync<any>(
      'SELECT expires_at, updated_at FROM offline_manifests WHERE check_in_list_id = ?',
      [checkInListId]
    );

    const queuedCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_checkin_queue WHERE check_in_list_id = ? AND synced = 0',
      [checkInListId]
    );

    return {
      isOfflineReady: !!manifest && new Date(manifest.expires_at) > new Date(),
      lastSync: manifest?.updated_at || null,
      queuedChanges: queuedCount?.count || 0,
      manifestExpiry: manifest?.expires_at || null
    };
  }

  async clearExpiredManifests(): Promise<void> {
    if (!this.db) return;

    const now = new Date().toISOString();
    
    // Get expired manifest IDs
    const expiredManifests = await this.db.getAllAsync<{ id: number }>(
      'SELECT id FROM offline_manifests WHERE expires_at < ?',
      [now]
    );

    if (expiredManifests.length === 0) return;

    await this.db.runAsync('BEGIN TRANSACTION');

    try {
      for (const manifest of expiredManifests) {
        // Delete attendees first (foreign key constraint)
        await this.db.runAsync(
          'DELETE FROM offline_attendees WHERE manifest_id = ?',
          [manifest.id]
        );
        
        // Delete manifest
        await this.db.runAsync(
          'DELETE FROM offline_manifests WHERE id = ?',
          [manifest.id]
        );
      }

      await this.db.runAsync('COMMIT');
      console.log(`Cleared ${expiredManifests.length} expired manifests`);
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      console.error('Failed to clear expired manifests:', error);
    }
  }

  // Helper methods
  private manifestToTicketManifest(manifest: any): TicketManifest {
    return {
      eventId: manifest.eventId,
      checkInListId: manifest.checkInListId,
      version: manifest.version,
      etag: manifest.etag,
      expiresAt: manifest.expiresAt,
      signature: manifest.signature,
      createdAt: manifest.createdAt || new Date().toISOString(),
      updatedAt: manifest.updatedAt || new Date().toISOString()
    };
  }

  private dbRowToManifestAttendee(row: any): ManifestAttendee {
    return {
      id: row.id,
      manifestId: row.manifest_id,
      attendeeId: row.attendee_id,
      attendeeShortId: row.attendee_short_id,
      ticketReference: row.ticket_reference,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      productName: row.product_name,
      checkedIn: row.checked_in === 1,
      checkedInAt: row.checked_in_at,
      qrCodeData: row.qr_code_data,
      synced: row.synced === 1
    };
  }
}

// Export singleton instance
export const offlineManifestService = OfflineManifestService.getInstance();