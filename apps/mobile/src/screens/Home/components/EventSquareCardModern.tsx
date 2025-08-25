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

interface EventSquareCardModernProps {
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

export default function EventSquareCardModern({ event, onPress }: EventSquareCardModernProps) {
  if (!event || !event.id) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.placeholderBackground}
          >
            <Text style={styles.placeholderIcon}>🎉</Text>
          </LinearGradient>
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
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        return `${month} ${day}`;
      }
    } catch (error) {
      return "Date TBD";
    }
  };

  const formatPrice = () => {
    if (!event.price) return "Free";
    if (event.price.min === 0) return "Free";
    if (event.price.min === event.price.max) return `$${event.price.min}`;
    return `$${event.price.min} - $${event.price.max}`;
  };

  const getStatusColor = () => {
    switch (event.status) {
      case "live":
        return theme.colors.gradient.warm;
      case "ended":
        return ["#6B7280", "#374151"];
      default:
        return theme.colors.gradient.accent;
    }
  };

  const getStatusText = () => {
    switch (event.status) {
      case "live":
        return "LIVE NOW";
      case "ended":
        return "ENDED";
      default:
        return formatDate(event.date);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event.id)}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Premium gradient border with glow */}
        <LinearGradient
          colors={[
            ...getStatusColor(),
            getStatusColor()[0] + "40",
            "transparent"
          ]}
          style={styles.glowBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <LinearGradient
          colors={getStatusColor()}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardInner}>
          {/* Background Image with enhanced overlay */}
          {event.imageUrl ? (
            <ImageBackground
              source={{ uri: event.imageUrl }}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              {/* Multi-layer atmospheric overlay */}
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.1)",
                  "rgba(0,0,0,0.4)",
                  "rgba(0,0,0,0.8)"
                ]}
                style={styles.imageOverlay}
              />
              
              {/* Additional atmospheric depth */}
              <LinearGradient
                colors={[
                  getStatusColor()[0] + "20",
                  "transparent",
                  getStatusColor()[1] + "30"
                ]}
                style={styles.atmosphericOverlay}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.placeholderBackground}
            >
              <View style={styles.placeholderPattern}>
                <Text style={styles.placeholderIcon}>🎪</Text>
              </View>
            </LinearGradient>
          )}

          {/* Enhanced status badge */}
          <View style={styles.statusContainer}>
            <BlurView intensity={80} tint="dark" style={styles.statusBadge}>
              <LinearGradient
                colors={getStatusColor()}
                style={styles.statusGradient}
              >
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </LinearGradient>
            </BlurView>
          </View>

          {/* Premium content overlay */}
          <BlurView intensity={100} tint="dark" style={styles.contentOverlay}>
            {/* Top atmospheric gradient */}
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.08)",
                "rgba(255,255,255,0.02)",
                "transparent"
              ]}
              style={styles.contentTop}
            />
            
            <View style={styles.eventContent}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.name}
                </Text>
                
                <View style={styles.eventMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>📍</Text>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {event.venue}
                    </Text>
                  </View>
                  
                  {event.time && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>🕐</Text>
                      <Text style={styles.metaText}>{event.time}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.eventFooter}>
                {/* Enhanced price display */}
                <View style={styles.priceContainer}>
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.15)",
                      "rgba(255,255,255,0.05)"
                    ]}
                    style={styles.priceBackground}
                  >
                    <Text style={styles.priceText}>{formatPrice()}</Text>
                  </LinearGradient>
                </View>
                
                {/* Attendee count with glass effect */}
                {event.attendeeCount && event.attendeeCount > 0 && (
                  <View style={styles.attendeeContainer}>
                    <Text style={styles.attendeeIcon}>👥</Text>
                    <Text style={styles.attendeeText}>{event.attendeeCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </BlurView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 200,
    marginRight: theme.spacing.md,
  },
  card: {
    flex: 1,
    position: "relative",
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  glowBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.xl + 4,
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
    justifyContent: "flex-end",
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
  placeholderPattern: {
    opacity: 0.7,
  },
  placeholderIcon: {
    fontSize: 48,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusContainer: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  statusBadge: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  statusGradient: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentOverlay: {
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
    height: "30%",
  },
  eventContent: {
    padding: theme.spacing.md,
  },
  eventInfo: {
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.sizes.md * 1.2,
    marginBottom: theme.spacing.xs,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventMeta: {
    gap: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaIcon: {
    fontSize: 11,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  priceText: {
    fontSize: theme.typography.sizes.sm,
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
});