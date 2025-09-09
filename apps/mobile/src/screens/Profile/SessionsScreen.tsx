import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";

interface Session {
  id: string;
  deviceInfo: {
    platform: string;
    appVersion: string;
    osVersion: string;
    deviceId: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  createdAt: string;
  lastActiveAt: string;
  isCurrentSession: boolean;
}

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getSessions, revokeSession, revokeAllSessions } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionData = await getSessions();
      setSessions(sessionData);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      Alert.alert("Error", "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(
      "Revoke Session",
      "Are you sure you want to revoke this session? The device will need to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeSession(sessionId);
              await loadSessions(); // Refresh the list
              Alert.alert("Success", "Session has been revoked");
            } catch (error) {
              Alert.alert("Error", "Failed to revoke session");
            }
          },
        },
      ]
    );
  };

  const handleRevokeAllSessions = async () => {
    Alert.alert(
      "Sign Out All Devices",
      "Are you sure you want to sign out from all devices? This will end all active sessions except the current one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out All",
          style: "destructive",
          onPress: async () => {
            try {
              await revokeAllSessions();
              await loadSessions(); // Refresh the list
              Alert.alert("Success", "All other sessions have been ended");
            } catch (error) {
              Alert.alert("Error", "Failed to sign out from all devices");
            }
          },
        },
      ]
    );
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getPlatformIcon = (platform: string) => {
      switch (platform.toLowerCase()) {
        case 'ios':
          return '📱';
        case 'android':
          return '🤖';
        case 'web':
          return '💻';
        default:
          return '📱';
      }
    };

    const getLocationText = (location?: { country?: string; city?: string }) => {
      if (!location) return 'Unknown location';
      if (location.city && location.country) {
        return `${location.city}, ${location.country}`;
      }
      return location.country || location.city || 'Unknown location';
    };

    return (
      <View style={styles.sessionItem}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionIcon}>{getPlatformIcon(item.deviceInfo.platform)}</Text>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionPlatform}>
              {item.deviceInfo.platform} {item.deviceInfo.appVersion}
            </Text>
            <Text style={styles.sessionDetails}>
              OS: {item.deviceInfo.osVersion}
            </Text>
            <Text style={styles.sessionDetails}>
              {getLocationText(item.location)}
            </Text>
            <Text style={styles.sessionDate}>
              Last active: {formatDate(item.lastActiveAt)}
            </Text>
          </View>
          {item.isCurrentSession && (
            <View style={styles.currentSessionBadge}>
              <Text style={styles.currentSessionText}>Current</Text>
            </View>
          )}
        </View>
        
        {!item.isCurrentSession && (
          <Button
            title="Revoke"
            onPress={() => handleRevokeSession(item.id)}
            style={styles.revokeButton}
            textStyle={styles.revokeButtonText}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Sessions</Text>
        <Text style={styles.subtitle}>
          Manage devices that are signed in to your account
        </Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? "Loading sessions..." : "No active sessions found"}
            </Text>
          </View>
        }
        style={styles.sessionsList}
      />

      {sessions.length > 1 && (
        <View style={styles.footer}>
          <Button
            title="Sign Out All Other Devices"
            onPress={handleRevokeAllSessions}
            style={styles.signOutAllButton}
            textStyle={styles.signOutAllButtonText}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  sessionsList: {
    flex: 1,
  },
  sessionItem: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionPlatform: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  currentSessionBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentSessionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  revokeButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  revokeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  signOutAllButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutAllButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});