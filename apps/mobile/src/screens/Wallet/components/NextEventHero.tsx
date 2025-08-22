import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import HoloFoilOverlay from "./HoloFoilOverlay";

interface NextEventHeroProps {
  ticket: {
    id: string;
    event: {
      title: string;
      shortTitle: string;
      startsAt: string;
      venue: {
        name: string;
        city: string;
      };
      holographicTheme: {
        primaryColor: string;
        secondaryColor: string;
        foilPattern: string;
        shimmerIntensity: number;
      };
    };
    tier: {
      name: string;
      shortName: string;
      color: string;
    };
    seatInfo: {
      section: string;
      row: string;
      seat: string;
    };
  };
  onPress: () => void;
}

export default function NextEventHero({ ticket, onPress }: NextEventHeroProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventTime = new Date(ticket.event.startsAt).getTime();
      const difference = eventTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [ticket.event.startsAt]);

  const formatDateTime = () => {
    const date = new Date(ticket.event.startsAt);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let dateStr = "";
    if (date.toDateString() === today.toDateString()) {
      dateStr = "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = "Tomorrow";
    } else {
      dateStr = date.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }

    const timeStr = date.toLocaleTimeString(undefined, { 
      hour: "numeric", 
      minute: "2-digit" 
    });

    return `${dateStr} at ${timeStr}`;
  };

  const getSeatDisplay = () => {
    if (ticket.seatInfo.seat === "Standing") {
      return `${ticket.seatInfo.section} • ${ticket.seatInfo.seat}`;
    }
    return `${ticket.seatInfo.section} • Row ${ticket.seatInfo.row} • Seat ${ticket.seatInfo.seat}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <HoloFoilOverlay
        primaryColor={ticket.event.holographicTheme.primaryColor}
        secondaryColor={ticket.event.holographicTheme.secondaryColor}
        pattern={ticket.event.holographicTheme.foilPattern}
        intensity={ticket.event.holographicTheme.shimmerIntensity}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Next Event</Text>
        <View style={[styles.tierBadge, { backgroundColor: ticket.tier.color }]}>
          <Text style={styles.tierText}>{ticket.tier.shortName}</Text>
        </View>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {ticket.event.title}
        </Text>
        <Text style={styles.venue}>
          {ticket.event.venue.name} • {ticket.event.venue.city}
        </Text>
        <Text style={styles.dateTime}>{formatDateTime()}</Text>
        <Text style={styles.seatInfo}>{getSeatDisplay()}</Text>
      </View>

      {/* Countdown */}
      {timeLeft && (
        <View style={styles.countdown}>
          <Text style={styles.countdownLabel}>Event starts in</Text>
          <View style={styles.countdownRow}>
            {timeLeft.days > 0 && (
              <>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownNumber}>{timeLeft.days}</Text>
                  <Text style={styles.countdownUnit}>{timeLeft.days === 1 ? "day" : "days"}</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
              </>
            )}
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{timeLeft.hours.toString().padStart(2, "0")}</Text>
              <Text style={styles.countdownUnit}>hrs</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{timeLeft.minutes.toString().padStart(2, "0")}</Text>
              <Text style={styles.countdownUnit}>min</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{timeLeft.seconds.toString().padStart(2, "0")}</Text>
              <Text style={styles.countdownUnit}>sec</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Hint */}
      <View style={styles.actionHint}>
        <Text style={styles.actionText}>Tap for full ticket</Text>
        <Text style={styles.actionArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    lineHeight: 28,
  },
  venue: {
    fontSize: 16,
    color: "#BBB",
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  seatInfo: {
    fontSize: 14,
    color: "#888",
    fontFamily: "monospace",
  },
  countdown: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  countdownLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
    textAlign: "center",
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownItem: {
    alignItems: "center",
    minWidth: 40,
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    fontFamily: "monospace",
  },
  countdownUnit: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  countdownSeparator: {
    fontSize: 18,
    color: "#555",
    marginHorizontal: 8,
    fontFamily: "monospace",
  },
  actionHint: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  actionText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginRight: 8,
  },
  actionArrow: {
    fontSize: 16,
    color: "#007AFF",
  },
});