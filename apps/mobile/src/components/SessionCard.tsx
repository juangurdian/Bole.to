import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Button from "./Button";

interface SessionData {
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

interface SessionCardProps {
  session: SessionData;
  onRevoke?: (sessionId: string) => Promise<void>;
  showRevokeButton?: boolean;
}

export default function SessionCard({ 
  session, 
  onRevoke, 
  showRevokeButton = true 
}: SessionCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Active now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
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

  const getPlatformName = (platform: string, deviceInfo?: any) => {
    switch (platform.toLowerCase()) {
      case 'ios':
        return deviceInfo?.deviceName || 'iPhone';
      case 'android':
        return deviceInfo?.deviceName || 'Android Device';
      case 'web':
        return getBrowserName(deviceInfo?.userAgent) || 'Web Browser';
      default:
        return platform;
    }
  };

  const getBrowserName = (userAgent?: string) => {
    if (!userAgent) return 'Web Browser';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Web Browser';
  };

  const getLocationText = (location?: { country?: string; city?: string }) => {
    if (!location) return 'Unknown location';
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return location.country || location.city || 'Unknown location';
  };

  const handleRevoke = () => {
    if (!onRevoke) return;

    Alert.alert(
      "End Session",
      "Are you sure you want to end this session? The device will need to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => onRevoke(session.id),
        },
      ]
    );
  };

  const getTrustIndicator = () => {
    // This could be enhanced to show trust levels based on various factors
    const isRecent = new Date(session.lastActiveAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    return isRecent ? '🟢' : '🟡';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <Text style={styles.platformIcon}>{getPlatformIcon(session.deviceInfo.platform)}</Text>
          <View style={styles.details}>
            <View style={styles.titleRow}>
              <Text style={styles.platformName}>
                {getPlatformName(session.deviceInfo.platform, session.deviceInfo)}
              </Text>
              {session.isCurrentSession && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentText}>This device</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.appVersion}>
              App version {session.deviceInfo.appVersion}
            </Text>
            
            <Text style={styles.location}>
              {getLocationText(session.location)}
            </Text>
            
            <View style={styles.statusRow}>
              <Text style={styles.trustIndicator}>{getTrustIndicator()}</Text>
              <Text style={styles.lastActive}>
                {formatDate(session.lastActiveAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {showRevokeButton && !session.isCurrentSession && (
        <View style={styles.actions}>
          <Button
            title="End Session"
            onPress={handleRevoke}
            style={styles.revokeButton}
            textStyle={styles.revokeButtonText}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  platformIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  details: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  platformName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  currentBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  appVersion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustIndicator: {
    fontSize: 12,
    marginRight: 6,
  },
  lastActive: {
    fontSize: 14,
    color: "#888",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  revokeButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  revokeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});