import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "../../../components/Skeleton";

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardSkeleton}>
          {/* Header skeleton */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Skeleton h={40} w={40} borderRadius={20} />
              <View style={styles.headerText}>
                <Skeleton h={16} w={120} />
                <Skeleton h={12} w={80} />
              </View>
            </View>
            <Skeleton h={20} w={20} />
          </View>
          
          {/* Body skeleton */}
          <View style={styles.body}>
            <Skeleton h={16} w="100%" />
            <Skeleton h={16} w="80%" />
            <Skeleton h={16} w="60%" />
            <Skeleton h={120} w="100%" borderRadius={8} />
          </View>
          
          {/* Actions skeleton */}
          <View style={styles.actions}>
            <Skeleton h={32} w={60} borderRadius={16} />
            <Skeleton h={32} w={60} borderRadius={16} />
            <Skeleton h={32} w={60} borderRadius={16} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  cardSkeleton: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    gap: 4,
  },
  body: {
    gap: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
});