import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface StatsData {
  followers: number;
  following: number;
  events: number;
  photos: number;
  points: number;
  level: string;
}

interface ProfileStatsProps {
  stats?: StatsData;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
  isLoading?: boolean;
}

export default function ProfileStats({
  stats,
  onFollowersPress,
  onFollowingPress,
  isLoading,
}: ProfileStatsProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.statsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.loadingCard} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={onFollowersPress}>
          <View style={styles.statCardBg}>
            <LinearGradient
              colors={["rgba(124,92,255,0.15)", "rgba(0,224,255,0.15)"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.statValue}>{formatCount(stats.followers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={onFollowingPress}>
          <View style={styles.statCardBg}>
            <LinearGradient
              colors={["rgba(255,122,89,0.15)", "rgba(255,154,0,0.15)"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.statValue}>{formatCount(stats.following)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={styles.statCardBg}>
            <LinearGradient
              colors={["rgba(0,224,255,0.15)", "rgba(124,92,255,0.15)"]}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.statValue}>{formatCount(stats.events)}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStats}>
        <View style={styles.secondaryCard}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.secondaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.secondaryContent}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelIcon}>⭐</Text>
                <Text style={styles.levelText}>{stats.level}</Text>
              </View>
              <View style={styles.pointsSection}>
                <Text style={styles.pointsValue}>{formatCount(stats.points)}</Text>
                <Text style={styles.pointsLabel}>Points</Text>
              </View>
              <View style={styles.photosSection}>
                <Text style={styles.photosIcon}>📸</Text>
                <Text style={styles.photosValue}>{formatCount(stats.photos)}</Text>
                <Text style={styles.photosLabel}>Photos</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardBg: {
    position: "relative",
    backgroundColor: "#111623",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: theme.spacing.md,
    alignItems: "center",
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  statGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secondaryStats: {
    marginTop: theme.spacing.xs,
  },
  secondaryCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  secondaryGradient: {
    padding: 1,
  },
  secondaryContent: {
    backgroundColor: "#111623",
    borderRadius: theme.borderRadius.lg - 1,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  levelIcon: {
    fontSize: 16,
  },
  levelText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  pointsSection: {
    alignItems: "center",
  },
  pointsValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  pointsLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  photosSection: {
    alignItems: "center",
  },
  photosIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  photosValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  photosLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  loadingCard: {
    height: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.borderRadius.lg,
  },
});