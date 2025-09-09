import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { syncService, offlineManifestService } from "../../offline";
import { SyncStatus } from "../../offline/SyncService";

interface StaffSyncScreenProps {
  route: {
    params: {
      checkInListId: string;
      eventId?: string;
    };
  };
  navigation: any;
}

export default function StaffSyncScreen({ route, navigation }: StaffSyncScreenProps) {
  const { checkInListId, eventId } = route.params;
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    navigation.setOptions({
      title: 'Sync Status'
    });
  }, [navigation]);

  useEffect(() => {
    loadStatuses();
    
    // Set up sync status listener
    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status);
      setLastUpdateTime(new Date());
    };
    
    syncService.addSyncListener(statusListener);
    
    return () => {
      syncService.removeSyncListener(statusListener);
    };
  }, [checkInListId]);

  const loadStatuses = async () => {
    try {
      // Load sync status
      const syncStat = await syncService.getSyncStatus();
      setSyncStatus(syncStat);
      
      // Load offline status for the check-in list
      const offlineStat = await offlineManifestService.getOfflineStatus(checkInListId);
      setOfflineStatus(offlineStat);
    } catch (error) {
      console.error('Failed to load statuses:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    
    try {
      const result = await syncService.performSync();
      
      if (result.success) {
        Alert.alert(
          'Sync Successful',
          `${result.syncedItems} items synced successfully.`
        );
      } else {
        Alert.alert(
          'Sync Issues',
          result.errors.length > 0 
            ? `Sync completed with ${result.errors.length} errors:\n${result.errors.join('\n')}`
            : 'Sync completed with some issues.'
        );
      }
      
      // Refresh statuses
      await loadStatuses();
    } catch (error) {
      console.error('Manual sync failed:', error);
      Alert.alert('Sync Failed', 'Failed to sync. Please check your connection and try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleForceRefresh = async () => {
    Alert.alert(
      'Force Refresh Manifest',
      'This will download a fresh copy of the attendee list. Any pending changes will be synced first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refresh',
          onPress: async () => {
            setSyncing(true);
            try {
              await syncService.forceSyncCheckInList(checkInListId);
              Alert.alert('Success', 'Manifest refreshed successfully');
              await loadStatuses();
            } catch (error) {
              console.error('Force refresh failed:', error);
              Alert.alert('Error', 'Failed to refresh manifest');
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  const handleTestConnection = async () => {
    setSyncing(true);
    
    try {
      const result = await syncService.testSyncConnectivity();
      
      Alert.alert(
        result.success ? 'Connection OK' : 'Connection Failed',
        result.success 
          ? `Connected successfully (${result.latency}ms)`
          : result.error || 'Failed to connect to server'
      );
    } catch (error) {
      Alert.alert('Test Failed', 'Failed to test connection');
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getConnectionStatusColor = (): string => {
    if (!syncStatus) return '#999';
    return syncStatus.isOnline ? '#28a745' : '#dc3545';
  };

  const getOfflineStatusColor = (): string => {
    if (!offlineStatus) return '#999';
    return offlineStatus.isOfflineReady ? '#28a745' : '#ffc107';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={loadStatuses} />
        }
      >
        {/* Connection Status */}
        <Card>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Connection Status</Text>
            <View 
              style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} 
            />
          </View>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>
                {syncStatus?.isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={styles.statusLabel}>Network</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>
                {syncStatus?.syncInProgress ? 'Syncing...' : 'Ready'}
              </Text>
              <Text style={styles.statusLabel}>Sync Status</Text>
            </View>
          </View>
        </Card>

        {/* Offline Status */}
        <Card>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Offline Readiness</Text>
            <View 
              style={[styles.statusDot, { backgroundColor: getOfflineStatusColor() }]} 
            />
          </View>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>
                {offlineStatus?.isOfflineReady ? 'Ready' : 'Not Ready'}
              </Text>
              <Text style={styles.statusLabel}>Offline Mode</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>
                {offlineStatus?.queuedChanges || 0}
              </Text>
              <Text style={styles.statusLabel}>Queued Changes</Text>
            </View>
          </View>
          
          {offlineStatus?.manifestExpiry && (
            <View style={styles.expiryInfo}>
              <Text style={styles.expiryLabel}>Manifest expires:</Text>
              <Text style={styles.expiryTime}>
                {new Date(offlineStatus.manifestExpiry).toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Sync History */}
        <Card>
          <Text style={styles.sectionTitle}>Sync History</Text>
          
          <View style={styles.syncHistoryItem}>
            <Text style={styles.syncHistoryLabel}>Last Attempt:</Text>
            <Text style={styles.syncHistoryValue}>
              {formatTime(syncStatus?.lastSyncAttempt)}
            </Text>
          </View>
          
          <View style={styles.syncHistoryItem}>
            <Text style={styles.syncHistoryLabel}>Last Success:</Text>
            <Text style={[
              styles.syncHistoryValue,
              { color: syncStatus?.lastSuccessfulSync ? '#28a745' : '#999' }
            ]}>
              {formatTime(syncStatus?.lastSuccessfulSync)}
            </Text>
          </View>
          
          <View style={styles.syncHistoryItem}>
            <Text style={styles.syncHistoryLabel}>Last Updated:</Text>
            <Text style={styles.syncHistoryValue}>
              {formatTime(offlineStatus?.lastSync)}
            </Text>
          </View>
        </Card>

        {/* Errors */}
        {syncStatus?.errors && syncStatus.errors.length > 0 && (
          <Card>
            <Text style={[styles.sectionTitle, { color: '#dc3545' }]}>Recent Errors</Text>
            {syncStatus.errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <Text style={styles.errorText}>• {error}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        <Card>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            <Button
              title={syncing ? 'Syncing...' : 'Manual Sync'}
              onPress={handleManualSync}
              loading={syncing}
              disabled={!syncStatus?.isOnline}
            />
            
            <Button
              title="Refresh Manifest"
              onPress={handleForceRefresh}
              style={styles.secondaryButton}
              disabled={!syncStatus?.isOnline || syncing}
            />
            
            <Button
              title="Test Connection"
              onPress={handleTestConnection}
              style={styles.secondaryButton}
              loading={syncing}
            />
          </View>
        </Card>

        {/* Status Information */}
        <Card>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ Sync Information</Text>
            <Text style={styles.infoText}>
              • Manual sync uploads pending check-ins{'\n'}
              • Manifest refresh downloads latest attendee list{'\n'}
              • Offline mode works without internet connection{'\n'}
              • Changes are queued automatically when offline
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
  },
  expiryInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
  },
  expiryLabel: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "500",
  },
  expiryTime: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "600",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  syncHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  syncHistoryLabel: {
    fontSize: 14,
    color: "#666",
  },
  syncHistoryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  errorItem: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: "#dc3545",
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  infoSection: {
    backgroundColor: "#e7f3ff",
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066cc",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#0066cc",
    lineHeight: 18,
  },
});