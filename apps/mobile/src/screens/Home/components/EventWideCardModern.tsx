import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";

interface EventWideCardModernProps {
  event: {
    id: string;
    name: string;
    date: string;
    time: string;
    venue: string;
    city: string;
    imageUrl?: string;
    price?: {
      min: number;
      max: number;
    };
    attendeeCount?: number;
    status?: "upcoming" | "live" | "ended" | "today";
  };
  onPress: (eventId: string) => void;
}

export default function EventWideCardModern({ event, onPress }: EventWideCardModernProps) {
  const formatDateTime = () => {
    if (!event.date) return { date: "TBD", time: event.time || "" };
    
    try {
      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) return { date: "TBD", time: event.time || "" };
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dateStr = "";
      if (eventDate.toDateString() === today.toDateString()) {
        dateStr = "Today";
      } else if (eventDate.toDateString() === tomorrow.toDateString()) {
        dateStr = "Tomorrow";
      } else {
        dateStr = eventDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric",
          weekday: "short"
        });
      }
      
      return { date: dateStr, time: event.time || "" };
    } catch (error) {
      return { date: "TBD", time: event.time || "" };
    }
  };

  const formatPrice = () => {
    if (!event.price || event.price.min === 0) return "Free";
    if (event.price.min === event.price.max) return `$${event.price.min}`;
    return `$${event.price.min} - $${event.price.max}`;
  };

  const getStatusGradient = () => {
    switch (event.status) {
      case "live":
        return theme.colors.gradient.warm;
      case "today":
        return theme.colors.gradient.accent;
      case "ended":
        return ["#6B7280", "#374151"];
      default:
        return theme.colors.gradient.primary;
    }
  };

  const { date, time } = formatDateTime();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event.id)}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Enhanced outer glow effect */}
        <LinearGradient
          colors={[
            ...getStatusGradient(),
            getStatusGradient()[0] + "20",
            "transparent"
          ]}
          style={styles.outerGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Premium gradient border */}
        <LinearGradient
          colors={getStatusGradient()}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardInner}>
          {/* Background with enhanced overlays */}
          {event.imageUrl ? (
            <ImageBackground
              source={{ uri: event.imageUrl }}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              {/* Multi-layer overlay for better text readability */}
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.2)",
                  "rgba(0,0,0,0.6)",
                  "rgba(0,0,0,0.9)"
                ]}
                style={styles.imageOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              {/* Atmospheric color overlay */}
              <LinearGradient
                colors={[
                  getStatusGradient()[0] + "15",
                  "transparent",
                  getStatusGradient()[1] + "25"
                ]}
                style={styles.atmosphericOverlay}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.placeholderBackground}
            >
              <Text style={styles.placeholderIcon}>🎪</Text>
            </LinearGradient>
          )}

          {/* Enhanced status indicator */}
          {(event.status === "live" || event.status === "today") && (
            <View style={styles.statusContainer}>
              <BlurView intensity={100} tint="dark" style={styles.statusBadge}>
                <LinearGradient
                  colors={getStatusGradient()}
                  style={styles.statusGradient}
                >
                  <View style={styles.statusContent}>
                    <View style={styles.pulseIndicator} />
                    <Text style={styles.statusText}>
                      {event.status === "live" ? "LIVE NOW" : "TODAY"}
                    </Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </View>
          )}

          {/* Premium glassmorphism content panel */}
          <BlurView intensity={120} tint="dark" style={styles.contentPanel}>
            {/* Top atmospheric gradient */}
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.1)",
                "rgba(255,255,255,0.03)",
                "transparent"
              ]}
              style={styles.contentTop}
            />
            
            <View style={styles.eventContent}>
              {/* Enhanced date/time display */}
              <View style={styles.dateTimeContainer}>
                <BlurView intensity={80} tint="dark" style={styles.dateChip}>
                  <LinearGradient
                    colors={[
                      getStatusGradient()[0] + "40",
                      getStatusGradient()[1] + "30"
                    ]}
                    style={styles.dateGradient}
                  >
                    <Text style={styles.dateText}>{date}</Text>
                  </LinearGradient>
                </BlurView>
                
                {time && (
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                )}
              </View>

              {/* Event information */}
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.name}
                </Text>
                
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.venue} • {event.city}
                  </Text>
                </View>
              </View>

              {/* Enhanced footer with price and attendees */}
              <View style={styles.eventFooter}>
                <View style={styles.priceContainer}>
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.2)",
                      "rgba(255,255,255,0.1)"
                    ]}
                    style={styles.priceBackground}
                  >
                    <Text style={styles.priceText}>{formatPrice()}</Text>
                  </LinearGradient>
                </View>
                
                {event.attendeeCount && event.attendeeCount > 0 && (
                  <View style={styles.attendeeContainer}>
                    <Text style={styles.attendeeIcon}>👥</Text>
                    <Text style={styles.attendeeText}>
                      {event.attendeeCount} attending
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Bottom accent line */}
            <LinearGradient
              colors={[...getStatusGradient(), "transparent"]}
              style={styles.bottomAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </BlurView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  card: {
    height: 140,
    borderRadius: theme.borderRadius.xl,
    position: "relative",
    overflow: "hidden",
  },
  outerGlow: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: theme.borderRadius.xl + 6,
    zIndex: -2,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: theme.borderRadius.xl + 1,
    zIndex: -1,
  },
  cardInner: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.surface.secondary,
  },
  imageBackground: {
    flex: 1,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  atmosphericOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.7,
  },
  statusContainer: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  statusBadge: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  statusGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  contentTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  eventContent: {
    padding: theme.spacing.md,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dateChip: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  dateGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  eventInfo: {
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  priceBackground: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  priceText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  attendeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  attendeeIcon: {
    fontSize: 12,
  },
  attendeeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
});