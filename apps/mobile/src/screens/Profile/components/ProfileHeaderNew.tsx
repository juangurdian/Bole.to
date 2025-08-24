import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

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
          <Text style={styles.topIcon}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton} onPress={onSettingsPress}>
          <Text style={styles.topIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.avatarRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInner}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={theme.colors.gradient.warm}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>
                    {profile.name[0].toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>
          
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <LinearGradient
                colors={theme.colors.gradient.accent}
                style={styles.verifiedGradient}
              >
                <Text style={styles.verifiedIcon}>✓</Text>
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
              colors={theme.colors.gradient.accent}
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
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          )}
          
          {profile.joinedDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  topButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  topIcon: {
    fontSize: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
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
    backgroundColor: theme.colors.bg,
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
  avatarText: {
    fontSize: 36,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
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
    borderColor: theme.colors.bg,
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
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  verifiedPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.md,
  },
  verifiedPillText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  username: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  bio: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
  },
  loadingAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    width: 150,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
  },
});