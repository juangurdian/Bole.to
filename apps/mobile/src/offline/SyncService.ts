import NetInfo from '@react-native-community/netinfo';
import { offlineManifestService, SyncResult } from './OfflineManifestService';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync-checkins';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  errors: string[];
}

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private lastSyncAttempt: string | null = null;
  private lastSuccessfulSync: string | null = null;
  private syncErrors: string[] = [];
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.initializeBackgroundSync();
    this.setupNetworkListener();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize background sync task
   */
  private async initializeBackgroundSync(): Promise<void> {
    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          console.log('Background sync task started');
          await this.performSync(true); // Silent sync
          return BackgroundFetch.Result.NewData;
        } catch (error) {
          console.error('Background sync failed:', error);
          return BackgroundFetch.Result.Failed;
        }
      });

      // Register background fetch
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.Status.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // 15 minutes minimum
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Background sync registered successfully');
      } else {
        console.warn('Background fetch not available:', status);
      }
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      console.log('Network state changed:', state.isConnected);
      
      // If we just came back online, attempt sync
      if (state.isConnected && !this.syncInProgress) {
        setTimeout(() => this.performSync(), 2000); // Wait 2s for stable connection
      }
      
      this.notifyListeners();
    });
  }

  /**
   * Perform manual sync
   */
  async performSync(silent = false): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return { success: false, syncedItems: 0, conflictCount: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = new Date().toISOString();
    this.syncErrors = [];
    
    if (!silent) {
      this.notifyListeners();
    }

    try {
      console.log('Starting sync operation...');
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No network connection available');
      }

      // Perform the actual sync
      const result = await offlineManifestService.syncWithServer();
      
      if (result.success) {
        this.lastSuccessfulSync = new Date().toISOString();
        console.log(`Sync completed successfully: ${result.syncedItems} items synced`);
      } else {
        this.syncErrors = result.errors;
        console.warn('Sync completed with errors:', result.errors);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.syncErrors = [errorMessage];
      console.error('Sync failed:', error);
      
      return {
        success: false,
        syncedItems: 0,
        conflictCount: 0,
        errors: [errorMessage]
      };
    } finally {
      this.syncInProgress = false;
      
      if (!silent) {
        this.notifyListeners();
      }
    }
  }

  /**
   * Schedule periodic sync
   */
  async schedulePeriodicSync(intervalMinutes = 30): Promise<void> {
    try {
      // Update background fetch configuration
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: intervalMinutes * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      console.log(`Periodic sync scheduled every ${intervalMinutes} minutes`);
    } catch (error) {
      console.error('Failed to schedule periodic sync:', error);
    }
  }

  /**
   * Cancel scheduled sync
   */
  async cancelPeriodicSync(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('Periodic sync cancelled');
    } catch (error) {
      console.error('Failed to cancel periodic sync:', error);
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const netInfo = await NetInfo.fetch();
    
    // Get pending changes count (this would need to be implemented in OfflineManifestService)
    let pendingChanges = 0;
    try {
      // This is a placeholder - would need actual implementation
      const status = await offlineManifestService.getOfflineStatus('current_checkin_list');
      pendingChanges = status.queuedChanges;
    } catch (error) {
      console.warn('Failed to get pending changes count:', error);
    }

    return {
      isOnline: netInfo.isConnected || false,
      lastSyncAttempt: this.lastSyncAttempt,
      lastSuccessfulSync: this.lastSuccessfulSync,
      pendingChanges,
      syncInProgress: this.syncInProgress,
      errors: this.syncErrors
    };
  }

  /**
   * Force sync for specific check-in list
   */
  async forceSyncCheckInList(checkInListId: string): Promise<SyncResult> {
    console.log(`Force syncing check-in list: ${checkInListId}`);
    
    // This would involve refreshing the manifest and syncing changes
    try {
      // Download fresh manifest
      await offlineManifestService.downloadManifest('current_event', checkInListId, true);
      
      // Perform regular sync
      return await this.performSync();
    } catch (error) {
      console.error('Force sync failed:', error);
      return {
        success: false,
        syncedItems: 0,
        conflictCount: 0,
        errors: [error instanceof Error ? error.message : 'Force sync failed']
      };
    }
  }

  /**
   * Add sync status listener
   */
  addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync status listener
   */
  removeSyncListener(listener: (status: SyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Check if we should sync automatically
   */
  async shouldAutoSync(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected || this.syncInProgress) {
      return false;
    }

    // Don't auto-sync too frequently
    if (this.lastSyncAttempt) {
      const timeSinceLastSync = Date.now() - new Date(this.lastSyncAttempt).getTime();
      const minInterval = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceLastSync < minInterval) {
        return false;
      }
    }

    // Check if there are pending changes
    try {
      const status = await offlineManifestService.getOfflineStatus('current_checkin_list');
      return status.queuedChanges > 0;
    } catch (error) {
      console.warn('Failed to check if auto-sync needed:', error);
      return false;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    lastSyncDuration: number;
  }> {
    // This would be implemented with persistent storage
    // For now, return mock data
    return {
      totalSyncs: 15,
      successfulSyncs: 13,
      failedSyncs: 2,
      averageSyncTime: 3500, // milliseconds
      lastSyncDuration: 2800
    };
  }

  /**
   * Clear sync history and reset
   */
  clearSyncHistory(): void {
    this.lastSyncAttempt = null;
    this.lastSuccessfulSync = null;
    this.syncErrors = [];
    this.notifyListeners();
  }

  /**
   * Test sync connectivity
   */
  async testSyncConnectivity(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        return {
          success: false,
          latency: 0,
          error: 'No network connection'
        };
      }

      // Simple connectivity test - could ping the Gateway
      const response = await fetch('https://gateway.bole.to/health', {
        method: 'GET',
        timeout: 5000
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { success: true, latency };
      } else {
        return {
          success: false,
          latency,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();