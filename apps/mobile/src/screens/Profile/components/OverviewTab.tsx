import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";
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
          <View style={styles.emptyIcon}>
            <Feather name="star" size={48} color={v2Colors.accent} />
          </View>
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
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: v2Colors.text.primary,
    marginBottom: spacing(3),
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(8),
    backgroundColor: v2Colors.surface1,
    marginTop: spacing(10),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  emptyIcon: {
    marginBottom: spacing(4),
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: v2Colors.text.primary,
    marginBottom: spacing(2),
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: v2Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  // Skeleton styles
  sectionTitleSkeleton: {
    width: 140,
    height: 20,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
    marginBottom: spacing(3),
  },
  railSkeleton: {
    height: 140,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
  },
  contentSkeleton: {
    height: 100,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
  },
  gridSkeleton: {
    height: 220,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
  },
});