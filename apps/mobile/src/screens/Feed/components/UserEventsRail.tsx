import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../../theme";

interface UserEvent {
  id: string;
  eventName: string;
  eventDate: string;
  eventImage?: string;
  venueShort: string;
  isToday?: boolean;
  isPast?: boolean;
  daysUntil?: number;
}

interface UserEventsRailProps {
  events: UserEvent[];
  onEventPress: (eventId: string) => void;
  onExplorePress: () => void;
}

export default function UserEventsRail({ 
  events, 
  onEventPress,
  onExplorePress 
}: UserEventsRailProps) {
  const formatEventDate = (event: UserEvent) => {
    if (event.isToday) return "Today";
    if (event.daysUntil === 1) return "Tomorrow";
    if (event.daysUntil && event.daysUntil <= 7) return `${event.daysUntil}d`;
    return event.eventDate;
  };

  const getEventBadgeColor = (event: UserEvent) => {
    if (event.isToday) return theme.colors.gradient.warm;
    if (event.isPast) return ["#666", "#555"];
    return theme.colors.gradient.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Events</Text>
        {events.length > 0 && (
          <TouchableOpacity onPress={() => onEventPress("all")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Explore Events Button - Always First */}
        <TouchableOpacity 
          style={styles.eventItem}
          onPress={onExplorePress}
        >
          <View style={styles.exploreContainer}>
            <LinearGradient
              colors={theme.colors.gradient.accent}
              style={styles.exploreGradient}
            >
              <Feather name="search" size={24} color={theme.colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.eventLabel}>Explore</Text>
          <Text style={styles.eventVenue}>Find Events</Text>
        </TouchableOpacity>

        {/* User's Events */}
        {events.length > 0 ? (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventItem}
              onPress={() => onEventPress(event.id)}
            >
              <View style={styles.eventImageContainer}>
                {event.eventImage ? (
                  <Image
                    source={{ uri: event.eventImage }}
                    style={styles.eventImage}
                  />
                ) : (
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.eventImagePlaceholder}
                  >
                    <Feather name="calendar" size={24} color={theme.colors.white} />
                  </LinearGradient>
                )}
                
                {/* Date Badge */}
                <View style={styles.dateBadge}>
                  <LinearGradient
                    colors={getEventBadgeColor(event)}
                    style={styles.dateBadgeGradient}
                  >
                    <Text style={styles.dateText}>{formatEventDate(event)}</Text>
                  </LinearGradient>
                </View>

                {/* Live Indicator for Today's Events */}
                {event.isToday && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                  </View>
                )}
              </View>
              
              <Text style={styles.eventLabel} numberOfLines={1}>
                {event.eventName}
              </Text>
              <Text style={styles.eventVenue} numberOfLines={1}>
                {event.venueShort}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          /* Empty State - Show suggested events */
          <>
            <TouchableOpacity style={styles.eventItem}>
              <View style={styles.emptyEventContainer}>
                <LinearGradient
                  colors={["#333", "#222"]}
                  style={styles.eventImagePlaceholder}
                >
                  <Feather name="plus" size={24} color="#666" />
                </LinearGradient>
              </View>
              <Text style={styles.eventLabel}>No Events</Text>
              <Text style={styles.eventVenue}>Get Tickets</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  eventItem: {
    alignItems: "center",
    width: 72,
  },
  exploreContainer: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.xs,
  },
  exploreGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eventImageContainer: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.xs,
    position: "relative",
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  eventImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emptyEventContainer: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.xs,
  },
  eventLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.primary,
    textAlign: "center",
    fontWeight: theme.typography.weights.medium,
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  dateBadge: {
    position: "absolute",
    bottom: -2,
    right: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  dateBadgeGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  liveIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
});