import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";
import { colors as v2Colors } from "../../../theme/v2-neutral";

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
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />
        
        {/* Rim Light Gradient */}
        <View style={styles.rimLight} />
        
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
    backgroundColor: v2Colors.surface1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    overflow: "hidden",
    marginHorizontal: theme.spacing.sm,
    ...theme.shadows.md,
  },
  largeContainer: {
    marginHorizontal: 0,
    marginBottom: theme.spacing.lg,
  },
  coverImage: {
    position: "relative",
    backgroundColor: v2Colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholder: {
    fontSize: 32,
    opacity: 0.3,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  rimLight: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    background: "linear-gradient(45deg, rgba(124,92,255,0.3), rgba(0,224,255,0.3))",
    zIndex: -1,
  },
  priceBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
  },
  priceText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.white,
  },
  microBadges: {
    position: "absolute",
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  microBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  todayBadge: {
    backgroundColor: "rgba(255,59,48,0.9)",
    borderColor: "rgba(255,59,48,0.3)",
  },
  lowStockBadge: {
    backgroundColor: "rgba(255,149,0,0.9)",
    borderColor: "rgba(255,149,0,0.3)",
  },
  newBadge: {
    backgroundColor: "rgba(0,122,255,0.9)",
    borderColor: "rgba(0,122,255,0.3)",
  },
  microBadgeText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.white,
  },
  eventInfo: {
    padding: theme.spacing.md,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: v2Colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
  },
  smallTitle: {
    fontSize: theme.typography.sizes.sm,
  },
  venueText: {
    fontSize: theme.typography.sizes.sm,
    color: v2Colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  smallVenue: {
    fontSize: theme.typography.sizes.xs,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateChip: {
    fontSize: theme.typography.sizes.xs,
    color: v2Colors.accent,
    fontWeight: theme.typography.weights.medium,
  },
  smallDateChip: {
    fontSize: 10,
  },
});