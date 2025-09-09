import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { offlineManifestService } from "../../offline";

interface CheckInListsScreenProps {
  route: {
    params: {
      eventId: string;
      eventTitle: string;
    };
  };
  navigation: any;
}

export default function CheckInListsScreen({ route, navigation }: CheckInListsScreenProps) {
  const { eventId, eventTitle } = route.params;
  const api = useApi();
  const [offlineStatuses, setOfflineStatuses] = useState<{ [key: string]: any }>({});

  const q = useQuery({
    queryKey: ["event-checkin-lists", eventId],
    queryFn: () => api.getEventCheckInLists(eventId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true
  });

  // Load offline status for each check-in list
  useEffect(() => {
    if (q.data) {
      const loadOfflineStatuses = async () => {
        const statuses: { [key: string]: any } = {};
        for (const list of q.data) {
          try {
            const status = await offlineManifestService.getOfflineStatus(list.id);
            statuses[list.id] = status;
          } catch (error) {
            console.warn(`Failed to get offline status for ${list.id}:`, error);
            statuses[list.id] = {
              isOfflineReady: false,
              lastSync: null,
              queuedChanges: 0,
              manifestExpiry: null
            };
          }
        }
        setOfflineStatuses(statuses);
      };

      loadOfflineStatuses();
    }
  }, [q.data]);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `${eventTitle} - Check-in Lists`
    });
  }, [navigation, eventTitle]);

  const handleSyncList = async (checkInListId: string, listName: string) => {
    try {
      Alert.alert(
        "Sync Check-in List",
        `Download ${listName} for offline use?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sync",
            onPress: async () => {
              try {
                await offlineManifestService.downloadManifest(eventId, checkInListId, true);
                
                // Refresh offline status
                const status = await offlineManifestService.getOfflineStatus(checkInListId);
                setOfflineStatuses(prev => ({
                  ...prev,
                  [checkInListId]: status
                }));
                
                Alert.alert("Success", "Check-in list synced successfully");
              } catch (error) {
                console.error("Sync failed:", error);
                Alert.alert("Sync Failed", "Failed to sync check-in list. Please try again.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Sync preparation failed:", error);
    }
  };

  const handleStartCheckIn = (list: any) => {
    const offlineStatus = offlineStatuses[list.id];
    
    if (!offlineStatus?.isOfflineReady) {
      Alert.alert(
        "Sync Required",
        "This check-in list needs to be synced before you can start checking in attendees.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sync Now", onPress: () => handleSyncList(list.id, list.name) }
        ]
      );
      return;
    }

    navigation.navigate("ScannerScreen", {
      eventId,
      checkInListId: list.id,
      checkInListName: list.name,
      eventTitle
    });
  };

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={100} />
          <Skeleton h={100} />
          <Skeleton h={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (q.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState 
          title="Failed to Load Check-in Lists"
          message="Unable to load check-in lists for this event"
          onRetry={() => q.refetch()} 
        />
      </SafeAreaView>
    );
  }

  const data = q.data ?? [];

  if (!data.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState 
          text="No check-in lists available for this event" 
          onRetry={() => q.refetch()} 
        />
      </SafeAreaView>
    );
  }

  const renderCheckInList = ({ item }: { item: any }) => {
    const offlineStatus = offlineStatuses[item.id];
    const checkInPercentage = item.attendeeCount > 0 
      ? Math.round((item.checkedInCount / item.attendeeCount) * 100) 
      : 0;

    return (
      <Card>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <View style={styles.statusBadges}>
            {offlineStatus?.isOfflineReady ? (
              <View style={[styles.statusBadge, styles.offlineReadyBadge]}>
                <Text style={styles.statusBadgeText}>📱 Offline Ready</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.syncNeededBadge]}>
                <Text style={styles.statusBadgeText}>⚠️ Sync Needed</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.listStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.checkedInCount}</Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.attendeeCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{checkInPercentage}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${checkInPercentage}%` }
              ]} 
            />
          </View>
        </View>

        {offlineStatus && (
          <View style={styles.offlineInfo}>
            {offlineStatus.lastSync && (
              <Text style={styles.offlineInfoText}>
                Last sync: {new Date(offlineStatus.lastSync).toLocaleString()}
              </Text>
            )}
            {offlineStatus.queuedChanges > 0 && (
              <Text style={styles.queuedChangesText}>
                {offlineStatus.queuedChanges} changes pending sync
              </Text>
            )}
            {offlineStatus.manifestExpiry && (
              <Text style={styles.expiryText}>
                Expires: {new Date(offlineStatus.manifestExpiry).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.listActions}>
          <Button
            title="Start Check-in"
            onPress={() => handleStartCheckIn(item)}
            style={[styles.actionButton, styles.primaryButton]}
          />
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleSyncList(item.id, item.name)}
          >
            <Text style={styles.secondaryButtonText}>
              {offlineStatus?.isOfflineReady ? "Re-sync" : "Sync"}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Check-in List</Text>
        <Text style={styles.headerSubtitle}>Choose which list you'll be managing</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderCheckInList}
        refreshControl={
          <RefreshControl 
            refreshing={q.isFetching} 
            onRefresh={() => q.refetch()} 
          />
        }
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  statusBadges: {
    flexDirection: "column",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  offlineReadyBadge: {
    backgroundColor: "#28a745",
  },
  syncNeededBadge: {
    backgroundColor: "#ffc107",
  },
  statusBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  listStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  offlineInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineInfoText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  queuedChangesText: {
    fontSize: 12,
    color: "#ff6b35",
    fontWeight: "500",
  },
  expiryText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  listActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});