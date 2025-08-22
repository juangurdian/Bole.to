import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    coverUrl?: string | null;
    startsAt: string;
    venue: { name: string; city: string };
    priceFrom?: number;
    isFree?: boolean;
    badges?: string[];
    categories?: string[];
  };
  onPress: (eventId: string) => void;
  size?: "small" | "medium" | "large";
}

export default function EventCard({ event, onPress, size = "medium" }: EventCardProps) {
  const cardStyles = {
    small: { width: 160, imageHeight: 90 },
    medium: { width: 200, imageHeight: 120 },
    large: { width: "100%", imageHeight: 160 }
  };

  const currentStyle = cardStyles[size];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = now.toDateString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (date.toDateString() === today) {
      return "Today";
    } else if (date.toDateString() === tomorrow) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric" 
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(undefined, { 
      hour: "numeric", 
      minute: "2-digit" 
    });
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { width: currentStyle.width },
        size === "large" && styles.largeContainer
      ]}
      onPress={() => onPress(event.id)}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}, ${formatDate(event.startsAt)}, ${event.venue.name}`}
    >
      {/* Cover Image */}
      <View style={[
        styles.coverImage,
        { height: currentStyle.imageHeight }
      ]}>
        <Text style={styles.coverPlaceholder}>🎪</Text>
        
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
        
        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {event.isFree ? "Free" : `From $${event.priceFrom}`}
          </Text>
        </View>
        
        {/* Micro Badges */}
        {event.badges && event.badges.length > 0 && (
          <View style={styles.microBadges}>
            {event.badges.map(badge => (
              <View key={badge} style={[
                styles.microBadge,
                badge === "TODAY" && styles.todayBadge,
                badge === "LOW_STOCK" && styles.lowStockBadge,
                badge === "NEW" && styles.newBadge
              ]}>
                <Text style={styles.microBadgeText}>
                  {badge === "TODAY" ? "Today" : 
                   badge === "LOW_STOCK" ? "Low stock" : 
                   badge === "NEW" ? "New" : badge}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={[
          styles.eventTitle,
          size === "small" && styles.smallTitle
        ]} numberOfLines={2}>
          {event.title}
        </Text>
        
        <Text style={[
          styles.venueText,
          size === "small" && styles.smallVenue
        ]} numberOfLines={1}>
          {event.venue.name} • {event.venue.city}
        </Text>
        
        <View style={styles.dateTimeContainer}>
          <Text style={[
            styles.dateChip,
            size === "small" && styles.smallDateChip
          ]}>
            {formatDate(event.startsAt)} at {formatTime(event.startsAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  coverImage: {
    position: "relative",
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholder: {
    fontSize: 32,
    opacity: 0.5,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  priceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  microBadges: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  microBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadge: {
    backgroundColor: "#ff3b30",
  },
  lowStockBadge: {
    backgroundColor: "#ff9500",
  },
  newBadge: {
    backgroundColor: "#007AFF",
  },
  microBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  eventInfo: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  smallTitle: {
    fontSize: 14,
  },
  venueText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  smallVenue: {
    fontSize: 12,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateChip: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  smallDateChip: {
    fontSize: 11,
  },
});