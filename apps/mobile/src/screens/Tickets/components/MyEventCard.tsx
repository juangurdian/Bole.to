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

interface MyEventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  coverUrl?: string;
  stats: { sold: number; revenue: number; checkins: number };
}

interface MyEventCardProps {
  event: MyEventSummary;
  onPress: (eventId: string) => void;
}

export default function MyEventCard({ event, onPress }: MyEventCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    } catch (error) {
      return "Date TBD";
    }
  };

  const formatRevenue = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(event.id)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* Rim light gradient */}
        <LinearGradient
          colors={["rgba(124,92,255,0.3)", "rgba(0,224,255,0.3)", "transparent"]}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          {/* Poster */}
          <View style={styles.posterContainer}>
            {event.coverUrl ? (
              <Image
                source={{ uri: event.coverUrl }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={theme.colors.gradient.warm}
                style={styles.placeholderPoster}
              >
                <Text style={styles.placeholderIcon}>🎪</Text>
              </LinearGradient>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.date}>
              {formatDate(event.startsAt)}
            </Text>
            <Text style={styles.venue} numberOfLines={1}>
              {event.venue} • {event.city}
            </Text>

            {/* Mini Stats */}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{event.stats.sold}</Text>
                <Text style={styles.statLabel}>Sold</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatRevenue(event.stats.revenue)}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{event.stats.checkins}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📱</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📤</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#111623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    overflow: "hidden",
    ...theme.shadows.md,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    zIndex: -1,
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    padding: theme.spacing.md,
    alignItems: "flex-start",
  },
  posterContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: theme.spacing.md,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  placeholderPoster: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.8,
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
  },
  date: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  venue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.sm,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: theme.spacing.xs,
  },
  actions: {
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionIcon: {
    fontSize: 14,
  },
});