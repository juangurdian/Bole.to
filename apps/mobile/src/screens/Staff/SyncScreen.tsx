import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import { offlineManifestService, syncService } from "../../offline";

export default function SyncScreen({ route, navigation }: any) {
  const { eventId, eventTitle } = route.params;
  const api = useApi();
  const [syncing, setSyncing] = useState(false);
  const [syncSteps, setSyncSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Load event check-in lists
  const q = useQuery({
    queryKey: ["event-checkin-lists", eventId],
    queryFn: () => api.getEventCheckInLists(eventId),
    staleTime: 5 * 60 * 1000,
  });
  
  useEffect(() => {
    navigation.setOptions({
      title: `${eventTitle || 'Event'} - Sync`
    });
  }, [navigation, eventTitle]);
  
  useEffect(() => {
    if (q.data && q.data.length > 0) {
      const steps = q.data.map((list: any) => ({
        id: list.id,
        name: list.name,
        status: 'pending', // pending, syncing, completed, failed
        message: 'Waiting to sync...',
        attendeeCount: list.attendeeCount
      }));
      setSyncSteps(steps);
    }
  }, [q.data]);

  const handleSync = async () => {
    if (!q.data || q.data.length === 0) {
      Alert.alert('Error', 'No check-in lists found for this event');
      return;
    }
    
    setSyncing(true);
    setCurrentStep(0);
    
    try {
      for (let i = 0; i < syncSteps.length; i++) {
        const step = syncSteps[i];
        setCurrentStep(i);
        
        // Update step status to syncing
        setSyncSteps(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'syncing', message: 'Downloading attendee list...' } : s
        ));
        
        try {
          // Download manifest for this check-in list
          await offlineManifestService.downloadManifest(eventId, step.id, true);
          
          // Update step status to completed
          setSyncSteps(prev => prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'completed', 
              message: `${step.attendeeCount} attendees ready offline` 
            } : s
          ));
          
        } catch (error) {
          console.error(`Failed to sync check-in list ${step.id}:`, error);
          
          // Update step status to failed
          setSyncSteps(prev => prev.map((s, idx) => 
            idx === i ? { 
              ...s, 
              status: 'failed', 
              message: 'Sync failed - will retry later' 
            } : s
          ));
        }
        
        // Small delay between syncs
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check if any syncs were successful
      const completedSteps = syncSteps.filter(s => s.status === 'completed');
      
      if (completedSteps.length > 0) {
        Alert.alert(
          'Sync Complete',
          `${completedSteps.length} of ${syncSteps.length} check-in lists synced successfully. You can now scan tickets offline.`,
          [
            { text: 'OK', onPress: () => navigateToCheckInLists() }
          ]
        );
      } else {
        Alert.alert(
          'Sync Failed', 
          'Failed to sync any check-in lists. Please check your connection and try again.'
        );
      }
      
    } catch (error) {
      console.error('Sync process failed:', error);
      Alert.alert('Sync Error', 'An unexpected error occurred during sync.');
    } finally {
      setSyncing(false);
    }
  };
  
  const navigateToCheckInLists = () => {
    navigation.navigate('StaffCheckInListsScreen', { 
      eventId, 
      eventTitle 
    });
  };
  
  const handleSkipSync = () => {
    Alert.alert(
      'Skip Sync?',
      'Without syncing, you won\'t be able to check in attendees offline. You can sync later from the check-in lists screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: navigateToCheckInLists }
      ]
    );
  };

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={100} />
          <Skeleton h={150} />
          <Skeleton h={60} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (q.isError || !q.data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card>
            <View style={styles.errorState}>
              <Text style={styles.errorIcon}>❌</Text>
              <Text style={styles.errorTitle}>Failed to Load Event</Text>
              <Text style={styles.errorMessage}>
                Unable to load check-in lists for this event.
              </Text>
              <Button title="Retry" onPress={() => q.refetch()} />
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>🔄</Text>
            <Text style={styles.title}>Sync for Offline Check-in</Text>
            <Text style={styles.subtitle}>
              Download attendee lists to enable offline ticket scanning
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Check-in Lists ({q.data.length})
          </Text>
          
          {q.data.map((list: any, index: number) => {
            const step = syncSteps[index] || { status: 'pending', message: 'Ready to sync' };
            return (
              <View key={list.id} style={styles.syncItem}>
                <View style={styles.syncItemHeader}>
                  <Text style={styles.syncItemName}>{list.name}</Text>
                  <View style={[
                    styles.syncStatus, 
                    step.status === 'completed' && styles.syncStatusCompleted,
                    step.status === 'syncing' && styles.syncStatusSyncing,
                    step.status === 'failed' && styles.syncStatusFailed,
                  ]}>
                    <Text style={styles.syncStatusText}>
                      {step.status === 'pending' && '⏳'}
                      {step.status === 'syncing' && '🔄'}
                      {step.status === 'completed' && '✅'}
                      {step.status === 'failed' && '❌'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.syncItemDetails}>
                  {list.attendeeCount} attendees • {step.message}
                </Text>
                
                {syncing && currentStep === index && (
                  <View style={styles.syncProgress}>
                    <View style={styles.progressBar}>
                      <View style={styles.progressBarFill} />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        <View style={styles.actions}>
          <Button
            title={syncing ? "Syncing..." : "Start Sync"}
            onPress={handleSync}
            loading={syncing}
            style={styles.primaryButton}
          />
          
          <Button
            title="Skip Sync"
            onPress={handleSkipSync}
            style={styles.secondaryButton}
            disabled={syncing}
          />
        </View>

        <Card>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>📱 Offline Check-in</Text>
            <Text style={styles.infoDescription}>
              • Sync downloads attendee lists for offline use{"\n"}
              • Check in attendees without internet connection{"\n"}
              • Changes sync automatically when back online{"\n"}
              • You can re-sync anytime to get updates
            </Text>
          </View>
        </Card>
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#333",
  },
  actions: {
    paddingVertical: 20,
    gap: 12,
  },
  errorState: {
    alignItems: "center",
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  syncItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  syncItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  syncItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  syncStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  syncStatusCompleted: {
    backgroundColor: "#d4edda",
  },
  syncStatusSyncing: {
    backgroundColor: "#cce5ff",
  },
  syncStatusFailed: {
    backgroundColor: "#f8d7da",
  },
  syncStatusText: {
    fontSize: 12,
  },
  syncItemDetails: {
    fontSize: 13,
    color: "#666",
  },
  syncProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#e0e0e0",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    width: "100%",
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  infoSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});