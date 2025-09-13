import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface ProfileData {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
  verified?: boolean;
  location?: string;
  joinedDate?: string;
}

interface ProfileHeaderNewProps {
  profile?: ProfileData;
  onEditPress: () => void;
  onSettingsPress: () => void;
  onSharePress: () => void;
  isLoading?: boolean;
}

export default function ProfileHeaderNew({
  profile,
  onEditPress,
  onSettingsPress,
  onSharePress,
  isLoading,
}: ProfileHeaderNewProps) {
  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingAvatar} />
        <View style={styles.loadingText} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Actions */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.topButton} onPress={onSharePress}>
          <Feather name="share-2" size={18} color={v2Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton} onPress={onSettingsPress}>
          <Feather name="settings" size={18} color={v2Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[v2Colors.accent, v2Colors.accent2]}
            style={styles.avatarRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInner}>
              <LinearGradient
                colors={[v2Colors.accent, v2Colors.accent2]}
                style={styles.avatarPlaceholder}
              >
                <View style={styles.monkeyContainer}>
                  <Feather name="smile" size={48} color={v2Colors.bg} />
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
          
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <LinearGradient
                colors={[v2Colors.accent, v2Colors.accent2]}
                style={styles.verifiedGradient}
              >
                <Feather name="check" size={14} color={v2Colors.bg} />
              </LinearGradient>
            </View>
          )}
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.verified && (
            <LinearGradient
              colors={[v2Colors.accent, v2Colors.accent2]}
              style={styles.verifiedPill}
            >
              <Text style={styles.verifiedPillText}>Verified</Text>
            </LinearGradient>
          )}
        </View>
        
        <Text style={styles.username}>@{profile.username}</Text>
        
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}
        
        <View style={styles.metaRow}>
          {profile.location && (
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={14} color={v2Colors.text.tertiary} />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          )}
          
          {profile.joinedDate && (
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={v2Colors.text.tertiary} />
              <Text style={styles.metaText}>Joined {profile.joinedDate}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4),
    backgroundColor: v2Colors.surface1,
    marginHorizontal: spacing(4),
    marginBottom: spacing(2),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing(2),
    marginBottom: spacing(3),
    paddingTop: spacing(2),
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v2Colors.surface2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  topIcon: {
    fontSize: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing(4),
  },
  avatarContainer: {
    position: "relative",
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: v2Colors.surface1,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  monkeyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  verifiedGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: v2Colors.surface1,
    borderRadius: 14,
  },
  verifiedIcon: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.bold,
  },
  infoSection: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    marginBottom: spacing(1),
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
  },
  verifiedPill: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: v2Colors.bg,
  },
  username: {
    fontSize: 16,
    color: v2Colors.text.secondary,
    marginBottom: spacing(2),
    fontWeight: '500' as const,
  },
  bio: {
    fontSize: 16,
    color: v2Colors.text.primary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing(3),
    paddingHorizontal: spacing(4),
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing(4),
    alignItems: "center",
    justifyContent: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
  },
  metaText: {
    fontSize: 14,
    color: v2Colors.text.tertiary,
    fontWeight: '500' as const,
  },
  loadingAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: v2Colors.surface2,
    alignSelf: "center",
    marginBottom: spacing(3),
  },
  loadingText: {
    width: 150,
    height: 20,
    borderRadius: radii.sm,
    backgroundColor: v2Colors.surface2,
    alignSelf: "center",
  },
});