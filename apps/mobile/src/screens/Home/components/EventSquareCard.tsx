import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";

interface EventSquareCardProps {
  event: {
    id: string;
    name: string;
    date: string;
    time: string;
    venue: string;
    imageUrl?: string;
    price?: {
      min: number;
      max: number;
    };
    attendeeCount?: number;
    status?: "upcoming" | "live" | "ended";
  };
  onPress: (eventId: string) => void;
}

export default function EventSquareCard({ event, onPress }: EventSquareCardProps) {
  // Early return if event is not properly defined
  if (!event || !event.id) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={[styles.placeholderBackground, { backgroundColor: theme.colors.surface.secondary }]}>
            <Text style={styles.placeholderIcon}>{"🎉"}</Text>
          </View>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date TBD";
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        });
      }
    } catch (error) {
      return "Date TBD";
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Time TBD";
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) return "Time TBD";
      
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Time TBD";
    }
  };

  const formatPrice = () => {
    if (!event?.price) return "Free";
    if (typeof event.price.min !== 'number' || typeof event.price.max !== 'number') return "Free";
    if (event.price.min === event.price.max) {
      return `$${event.price.min}`;
    }
    return `$${event.price.min}-${event.price.max}`;
  };

  const getStatusColor = () => {
    if (!event?.status) return theme.colors.success;
    switch (event.status) {
      case "live":
        return theme.colors.error;
      case "ended":
        return theme.colors.text.tertiary;
      default:
        return theme.colors.success;
    }
  };

  const getStatusText = () => {
    if (!event?.status) return formatDate(event?.date || "");
    switch (event.status) {
      case "live":
        return "LIVE NOW";
      case "ended":
        return "ENDED";
      default:
        return formatDate(event?.date || "");
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event.id)}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Main background with image or gradient */}
        {event.imageUrl ? (
          <ImageBackground
            source={{ uri: event.imageUrl }}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={theme.effects.gradientOverlays.cardBottom}
              style={styles.imageOverlay}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={theme.colors.gradient.accent}
            style={styles.placeholderBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.placeholderIcon}>{"🎉"}</Text>
          </LinearGradient>
        )}

        {/* Glassmorphism overlay for depth */}
        <LinearGradient
          colors={theme.effects.gradientOverlays.cardTop}
          style={styles.glassOverlay}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <BlurView
              intensity={80}
              tint="dark"
              style={[styles.statusBadge, { borderColor: getStatusColor() }]}
            >
              <LinearGradient
                colors={[getStatusColor() + "40", getStatusColor() + "20"]}
                style={styles.statusGradient}
              >
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {String(getStatusText())}
                </Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.footer}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.infoContainer}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={2}>
                  {String(event.name || "Event")}
                </Text>
                <View style={styles.timeVenueRow}>
                  <Text style={styles.eventTime}>
                    {String(event.time ? formatTime(event.time) : "TBD")}
                  </Text>
                  <Text style={styles.separator}>{" • "}</Text>
                  <Text style={styles.eventVenue} numberOfLines={1}>
                    {String(event.venue || "Venue TBD").split(" • ")[0]}
                  </Text>
                </View>
              </View>

              <View style={styles.metadata}>
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  style={styles.priceGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.eventPrice}>{String(formatPrice())}</Text>
                </LinearGradient>
                {event.attendeeCount && event.attendeeCount > 0 && (
                  <Text style={styles.attendeeCount}>
                    {String(event.attendeeCount)} going
                  </Text>
                )}
              </View>
            </BlurView>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: theme.dimensions.eventCardSize,
    height: theme.dimensions.eventCardSize,
    marginRight: theme.spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.effects.glass.secondary,
    overflow: "hidden",
    backgroundColor: theme.colors.surface.card,
    ...theme.shadows.xl,
  },
  imageBackground: {
    flex: 1,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    zIndex: 1,
  },
  placeholderBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: theme.spacing.md,
    justifyContent: "space-between",
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: theme.effects.backdrop.dark,
  },
  statusGradient: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    justifyContent: "flex-end",
  },
  infoContainer: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.effects.backdrop.dark,
    overflow: "hidden",
  },
  eventInfo: {
    marginBottom: theme.spacing.sm,
  },
  timeVenueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  separator: {
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
  },
  eventName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  eventVenue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    flex: 1,
    fontWeight: theme.typography.weights.medium,
  },
  metadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceGradient: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  eventPrice: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  attendeeCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
    opacity: 0.9,
  },
});