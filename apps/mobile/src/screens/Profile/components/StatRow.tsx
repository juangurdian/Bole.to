import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface StatRowProps {
  profile: any;
  isLoading: boolean;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
}

export default function StatRow({ profile, isLoading, onFollowersPress, onFollowingPress }: StatRowProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statContainer}>
            <View style={styles.statNumberSkeleton} />
            <View style={styles.statLabelSkeleton} />
          </View>
        ))}
      </View>
    );
  }

  if (!profile) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.statContainer} onPress={onFollowingPress}>
        <Text style={styles.statNumber}>
          {formatNumber(profile.following || 0)}
        </Text>
        <Text style={styles.statLabel}>Following</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statContainer} onPress={onFollowersPress}>
        <Text style={styles.statNumber}>
          {formatNumber(profile.followers || 0)}
        </Text>
        <Text style={styles.statLabel}>Followers</Text>
      </TouchableOpacity>

      <View style={styles.statContainer}>
        <Text style={styles.statNumber}>
          {formatNumber(profile.attendedCount || 0)}
        </Text>
        <Text style={styles.statLabel}>Attended</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: v2Colors.surface1,
    paddingVertical: spacing(4),
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    justifyContent: "space-around",
  },
  statContainer: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: v2Colors.text.primary,
    marginBottom: spacing(1),
  },
  statLabel: {
    fontSize: 14,
    color: v2Colors.text.secondary,
    fontWeight: '500',
  },
  // Skeleton styles
  statNumberSkeleton: {
    width: 48,
    height: 24,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
    marginBottom: spacing(2),
  },
  statLabelSkeleton: {
    width: 70,
    height: 14,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
  },
});