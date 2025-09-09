// Offline System Exports
export { OfflineManifestService, offlineManifestService } from './OfflineManifestService';
export { QRValidationService, qrValidationService } from './QRValidationService';
export { SyncService, syncService } from './SyncService';

export type {
  TicketManifest,
  ManifestAttendee,
  OfflineCheckIn,
  SyncResult
} from './OfflineManifestService';

export type {
  BoletoQRData,
  QRValidationResult,
  CheckInResult
} from './QRValidationService';

export type {
  SyncStatus
} from './SyncService';

// Initialization function for the offline system
export const initializeOfflineSystem = async (): Promise<void> => {
  console.log('Initializing offline system...');
  
  try {
    // Initialize the offline manifest service (creates DB if needed)
    await offlineManifestService.initialize();
    
    // Clean up expired manifests on startup
    await offlineManifestService.clearExpiredManifests();
    
    // The sync service initializes automatically when imported
    console.log('Offline system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline system:', error);
    throw error;
  }
};

// Utility function to check if offline mode is ready for an event
export const isOfflineReady = async (eventId: string, checkInListId: string): Promise<boolean> => {
  try {
    const status = await offlineManifestService.getOfflineStatus(checkInListId);
    return status.isOfflineReady;
  } catch (error) {
    console.error('Error checking offline readiness:', error);
    return false;
  }
};

// Utility function to get offline system status
export const getOfflineSystemStatus = async () => {
  try {
    const syncStatus = await syncService.getSyncStatus();
    const syncStats = await syncService.getSyncStatistics();
    
    return {
      sync: syncStatus,
      statistics: syncStats
    };
  } catch (error) {
    console.error('Error getting offline system status:', error);
    return null;
  }
};