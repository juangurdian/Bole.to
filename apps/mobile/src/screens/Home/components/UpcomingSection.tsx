import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { theme } from "../../../theme";
import SectionHeader from "./SectionHeader";
import EventSquareCardV3 from "../../../components/EventSquareCardV3";

interface UpcomingEvent {
  eventId: string;
  eventTitle: string;
  startsAt: string;
  coverUrl?: string;
  hasTicket: boolean;
  venue: {
    name: string;
    city: string;
  };
  isToday: boolean;
  isTomorrow: boolean;
  hoursUntil: number;
}

interface UpcomingSectionProps {
  items: UpcomingEvent[];
  onEventPress?: (eventId: string) => void;
  onViewAllPress?: () => void;
}

export default function UpcomingSection({
  items,
  onEventPress = () => {},
  onViewAllPress,
}: UpcomingSectionProps) {
  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Your Upcoming" />
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎪</Text>
          <Text style={styles.emptyTitle}>No upcoming events</Text>
          <Text style={styles.emptySubtitle}>
            Explore events to add to your calendar
          </Text>
          <TouchableOpacity style={styles.exploreButton} onPress={onViewAllPress}>
            <Text style={styles.exploreButtonText}>Explore Events</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const visibleItems = items.slice(0, 6);

  // Convert format for EventSquareCard
  const convertedEvents = visibleItems.map(item => {
    const timeString = item.startsAt ? item.startsAt.split('T')[1]?.substring(0, 5) : null;
    return {
      id: item.eventId,
      name: item.eventTitle || "Event",
      date: item.startsAt || new Date().toISOString(),
      time: timeString || "00:00",
      venue: item.venue ? `${item.venue.name || "Venue"} • ${item.venue.city || "City"}` : "Venue TBD",
      imageUrl: item.coverUrl,
      attendeeCount: 0,
      status: item.isToday ? "live" : "upcoming" as const,
    };
  });

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Your Upcoming"
        onSeeAll={items.length > 6 ? onViewAllPress : undefined}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {convertedEvents.map((event) => (
          <EventSquareCardV3
            key={event.id}
            event={event}
            onPress={onEventPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.info,
    fontWeight: theme.typography.weights.medium,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  skeletonCard: {
    width: theme.dimensions.eventCardSize,
    height: theme.dimensions.eventCardSize,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.secondary,
    overflow: "hidden",
  },
  skeletonContent: {
    flex: 1,
    backgroundColor: theme.colors.surface.tertiary,
    opacity: 0.3,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
    marginBottom: theme.spacing.lg,
  },
  exploreButton: {
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  exploreButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  viewMoreCard: {
    width: theme.dimensions.eventCardSize,
    height: theme.dimensions.eventCardSize,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface.secondary,
  },
  viewMoreContent: {
    alignItems: "center",
  },
  viewMoreIcon: {
    fontSize: 24,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  viewMoreText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
});