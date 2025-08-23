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

interface TicketSummary {
  id: string;
  eventId: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  coverUrl?: string;
  seatInfo?: string;
  hasQr: boolean;
  photosReleased?: boolean;
}

interface TicketMiniProps {
  ticket: TicketSummary;
  onPress: (ticketId: string) => void;
}

export default function TicketMini({ ticket, onPress }: TicketMiniProps) {
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(ticket.id)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* Subtle rim gradient */}
        <LinearGradient
          colors={["rgba(124,92,255,0.2)", "rgba(0,224,255,0.2)", "transparent"]}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {ticket.coverUrl ? (
              <Image
                source={{ uri: ticket.coverUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Text style={styles.placeholderIcon}>🎫</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {ticket.title}
            </Text>
            <Text style={styles.date}>
              {formatDate(ticket.startsAt)}
            </Text>
            <Text style={styles.venue} numberOfLines={1}>
              {ticket.venue} • {ticket.city}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {ticket.photosReleased && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>Photos</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Reorder</Text>
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
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: "#111623",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    overflow: "hidden",
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    zIndex: -1,
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: theme.spacing.md,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholderThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  info: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  venue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
});