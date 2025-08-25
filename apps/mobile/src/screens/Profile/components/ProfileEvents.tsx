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

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  coverUrl?: string;
  attendees: number;
}

interface ProfileEventsProps {
  events?: Event[];
  onEventPress: (eventId: string) => void;
}

export default function ProfileEvents({ events, onEventPress }: ProfileEventsProps) {
  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎪</Text>
        <Text style={styles.emptyText}>No events attended yet</Text>
      </View>
    );
  }

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onEventPress(item.id)}
    >
      <View style={styles.eventContent}>
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} style={styles.eventImage} />
        ) : (
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.eventPlaceholder}
          >
            <Text style={styles.placeholderIcon}>🎪</Text>
          </LinearGradient>
        )}
        
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.eventDate}>{item.date}</Text>
          <Text style={styles.eventVenue} numberOfLines={1}>
            {item.venue}
          </Text>
          <View style={styles.attendeesRow}>
            <Text style={styles.attendeesIcon}>👥</Text>
            <Text style={styles.attendeesText}>{item.attendees} attended</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {events.map((item) => renderEvent({ item }))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "#111623",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  eventContent: {
    flexDirection: "row",
    padding: theme.spacing.md,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
  },
  eventPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.6,
  },
  eventInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  eventDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  attendeesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  attendeesIcon: {
    fontSize: 12,
  },
  attendeesText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
});