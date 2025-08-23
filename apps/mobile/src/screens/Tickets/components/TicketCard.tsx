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

interface TicketCardProps {
  ticket: TicketSummary;
  onPress: (ticketId: string) => void;
}

export default function TicketCard({ ticket, onPress }: TicketCardProps) {
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

  const getTimeUntilEvent = () => {
    const eventDate = new Date(ticket.startsAt);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24 && diffHours > 0) {
      return `${diffHours}h until event`;
    }
    return null;
  };

  const timeUntil = getTimeUntilEvent();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(ticket.id)}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Background Image or Placeholder */}
        {ticket.coverUrl ? (
          <ImageBackground
            source={{ uri: ticket.coverUrl }}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.placeholderBackground}
          >
            <Text style={styles.placeholderIcon}>🎫</Text>
          </LinearGradient>
        )}

        {/* Holographic Overlay */}
        <LinearGradient
          colors={[
            "rgba(0,224,255,0.3)",
            "rgba(124,92,255,0.3)", 
            "rgba(255,122,89,0.3)"
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.holoOverlay}
        />

        {/* Grain/Noise Effect */}
        <View style={styles.grainOverlay} />

        {/* Content Overlay */}
        <View style={styles.content}>
          {/* Top Section - QR Button */}
          <View style={styles.header}>
            {ticket.hasQr && (
              <TouchableOpacity style={styles.qrButton}>
                <Text style={styles.qrIcon}>📱</Text>
              </TouchableOpacity>
            )}
            
            {timeUntil && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{timeUntil}</Text>
              </View>
            )}
          </View>

          {/* Bottom Section - Info */}
          <View style={styles.footer}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {ticket.title}
              </Text>
              
              <View style={styles.datePill}>
                <Text style={styles.dateText}>{formatDate(ticket.startsAt)}</Text>
              </View>
              
              <Text style={styles.venueText} numberOfLines={1}>
                {ticket.venue} • {ticket.city}
              </Text>
              
              {ticket.seatInfo && (
                <Text style={styles.seatText}>{ticket.seatInfo}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.openButton}>
              <Text style={styles.openButtonText}>Open Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    aspectRatio: 0.75,
    marginBottom: theme.spacing.lg,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111623",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...theme.shadows.lg,
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  placeholderBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.6,
  },
  holoOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.12,
    // Add grain texture effect
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  qrButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  qrIcon: {
    fontSize: 16,
  },
  countdownBadge: {
    backgroundColor: "rgba(255,122,89,0.9)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,122,89,0.3)",
  },
  countdownText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  footer: {
    justifyContent: "flex-end",
  },
  eventInfo: {
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
    marginBottom: theme.spacing.xs,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  datePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,224,255,0.9)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 11,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0,224,255,0.3)",
  },
  dateText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  venueText: {
    fontSize: theme.typography.sizes.xs,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seatText: {
    fontSize: theme.typography.sizes.xs,
    color: "rgba(255,255,255,0.7)",
    fontWeight: theme.typography.weights.medium,
  },
  openButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  openButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});