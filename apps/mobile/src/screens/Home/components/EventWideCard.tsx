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

interface EventWideCardProps {
  event: {
    id: string;
    title: string;
    startsAt: string;
    venue: {
      name: string;
      city: string;
    };
    coverUrl?: string;
    tiers?: Array<{
      price: {
        amount: number;
      };
    }>;
  };
  onPress: (eventId: string) => void;
}

export default function EventWideCard({ event, onPress }: EventWideCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMinPrice = () => {
    if (!event.tiers || event.tiers.length === 0) return null;
    const minPrice = Math.min(...event.tiers.map(tier => tier.price.amount));
    return minPrice === 0 ? "Free" : `$${minPrice}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event.id)}
      activeOpacity={0.9}
    >
      {event.coverUrl ? (
        <ImageBackground
          source={{ uri: event.coverUrl }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={theme.effects.gradientOverlays.cardBottom}
            style={styles.overlay}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={theme.colors.gradient.accent}
          style={styles.placeholderBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.placeholderIcon}>🎵</Text>
        </LinearGradient>
      )}

      {/* Glass overlay for depth */}
      <LinearGradient
        colors={theme.effects.gradientOverlays.cardTop}
        style={styles.glassOverlay}
      />

      <View style={styles.content}>
        <BlurView
          intensity={60}
          tint="dark"
          style={styles.dateContainer}
        >
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.dateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.date}>{formatDate(event.startsAt)}</Text>
            <Text style={styles.time}>{formatTime(event.startsAt)}</Text>
          </LinearGradient>
        </BlurView>

        <BlurView
          intensity={80}
          tint="dark"
          style={styles.eventInfoContainer}
        >
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.venue} numberOfLines={1}>
              {event.venue.name} {" • "} {event.venue.city}
            </Text>
          </View>

          {getMinPrice() && (
            <LinearGradient
              colors={theme.colors.gradient.warm}
              style={styles.priceContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.price}>{getMinPrice()}</Text>
            </LinearGradient>
          )}
        </BlurView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 160, // 16:9 aspect ratio
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: theme.effects.glass.secondary,
    overflow: "hidden",
    backgroundColor: theme.colors.surface.card,
    ...theme.shadows.xl,
  },
  imageBackground: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
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
    padding: theme.spacing.lg,
    justifyContent: "space-between",
    zIndex: 2,
  },
  dateContainer: {
    alignSelf: "flex-start",
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    backgroundColor: theme.effects.backdrop.darker,
  },
  dateGradient: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  time: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginTop: 2,
    fontWeight: theme.typography.weights.medium,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventInfoContainer: {
    backgroundColor: theme.effects.backdrop.darker,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    overflow: "hidden",
  },
  eventInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  venue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    opacity: 0.9,
  },
  priceContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    minWidth: 50,
    alignItems: "center",
  },
  price: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});