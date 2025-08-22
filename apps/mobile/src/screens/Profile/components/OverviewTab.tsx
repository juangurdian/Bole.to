import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import UpcomingRail from "./UpcomingRail";
import RecentPostsList from "./RecentPostsList";
import RecentPhotosGrid from "./RecentPhotosGrid";
import PinnedEvents from "./PinnedEvents";

interface OverviewTabProps {
  showcase: any;
  isLoading: boolean;
  navigation: any;
}

export default function OverviewTab({ showcase, isLoading, navigation }: OverviewTabProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.railSkeleton} />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.contentSkeleton} />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.gridSkeleton} />
        </View>
      </View>
    );
  }

  if (!showcase) return null;

  const hasUpcoming = showcase.upcoming?.length > 0;
  const hasRecentPosts = showcase.recentPosts?.length > 0;
  const hasRecentPhotos = showcase.recentPhotos?.length > 0;
  const hasPinnedEvents = showcase.pinnedEvents?.length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Upcoming Tickets */}
      {hasUpcoming && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <UpcomingRail 
            tickets={showcase.upcoming} 
            navigation={navigation}
          />
        </View>
      )}

      {/* Pinned Events */}
      {hasPinnedEvents && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pinned Events</Text>
          <PinnedEvents 
            pinnedEventIds={showcase.pinnedEvents}
            pastEvents={showcase.pastEvents}
            navigation={navigation}
          />
        </View>
      )}

      {/* Recent Posts */}
      {hasRecentPosts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          <RecentPostsList 
            posts={showcase.recentPosts} 
            navigation={navigation}
          />
        </View>
      )}

      {/* Recent Photos */}
      {hasRecentPhotos && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <RecentPhotosGrid 
            photos={showcase.recentPhotos.slice(0, 6)} 
            navigation={navigation}
          />
        </View>
      )}

      {/* Empty State */}
      {!hasUpcoming && !hasRecentPosts && !hasRecentPhotos && !hasPinnedEvents && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyTitle}>Welcome to your profile!</Text>
          <Text style={styles.emptyMessage}>
            Get tickets to events and start sharing your experiences with the community.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: "white",
    marginBottom: 8,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // Skeleton styles
  sectionTitleSkeleton: {
    width: 120,
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  railSkeleton: {
    height: 120,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  contentSkeleton: {
    height: 80,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  gridSkeleton: {
    height: 200,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
    borderRadius: 8,
  },
});