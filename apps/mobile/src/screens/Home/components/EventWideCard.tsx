import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
            colors={["transparent", "rgba(10, 13, 20, 0.8)"]}
            style={styles.overlay}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={theme.colors.gradient.dark}
          style={styles.placeholderBackground}
        >
          <Text style={styles.placeholderIcon}>🎵</Text>
        </LinearGradient>
      )}

      <View style={styles.content}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(event.startsAt)}</Text>
          <Text style={styles.time}>{formatTime(event.startsAt)}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.venue} numberOfLines={1}>
            {event.venue.name} • {event.venue.city}
          </Text>
        </View>

        {getMinPrice() && (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{getMinPrice()}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 160, // 16:9 aspect ratio
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.surface.card,
    ...theme.shadows.md,
  },
  imageBackground: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
  },
  dateContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 224, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 255, 0.3)",
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: "#00E0FF",
    textAlign: "center",
  },
  time: {
    fontSize: theme.typography.sizes.xs,
    color: "#00E0FF",
    textAlign: "center",
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  eventTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  venue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  priceContainer: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  price: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
});