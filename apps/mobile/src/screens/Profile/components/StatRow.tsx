import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
    backgroundColor: "white",
    paddingVertical: 16,
    marginBottom: 8,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statContainer: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  // Skeleton styles
  statNumberSkeleton: {
    width: 40,
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabelSkeleton: {
    width: 60,
    height: 14,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
});