import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import HoloFoilOverlay from "./HoloFoilOverlay";

interface TicketCardProps {
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
      holographicEffects: {
        pattern: string;
        metallic: boolean;
        rainbow: boolean;
      };
    };
    seatInfo: {
      section: string;
      row: string;
      seat: string;
    };
    status: string;
    price: number;
    holographicData: {
      serialNumber: string;
      securityPattern: string;
      microtext: string;
      reflectiveElements: string[];
      colorShift: {
        angle0: string;
        angle45: string;
        angle90: string;
      };
    };
  };
  onPress: () => void;
  isPast: boolean;
}

export default function TicketCard({ ticket, onPress, isPast }: TicketCardProps) {
  const formatDateTime = () => {
    const date = new Date(ticket.event.startsAt);
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const getSeatDisplay = () => {
    if (ticket.seatInfo.seat === "Standing") {
      return `${ticket.seatInfo.section}`;
    }
    return `${ticket.seatInfo.section} • ${ticket.seatInfo.row}${ticket.seatInfo.seat}`;
  };

  const getStatusColor = () => {
    switch (ticket.status) {
      case "valid":
        return "#00C851";
      case "used":
        return "#FF8800";
      default:
        return "#FF4444";
    }
  };

  const getStatusText = () => {
    switch (ticket.status) {
      case "valid":
        return "VALID";
      case "used":
        return "USED";
      default:
        return "INVALID";
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isPast && styles.containerPast]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <HoloFoilOverlay
        primaryColor={ticket.event.holographicTheme.primaryColor}
        secondaryColor={ticket.event.holographicTheme.secondaryColor}
        pattern={ticket.event.holographicTheme.foilPattern}
        intensity={isPast ? 0.3 : ticket.event.holographicTheme.shimmerIntensity}
      />

      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, isPast && styles.textPast]} numberOfLines={1}>
            {ticket.event.shortTitle || ticket.event.title}
          </Text>
          <Text style={[styles.venue, isPast && styles.textPast]}>
            {ticket.event.venue.name}
          </Text>
          <Text style={[styles.dateTime, isPast && styles.textPast]}>
            {formatDateTime()}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={[styles.price, isPast && styles.textPast]}>
            ${ticket.price.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Holographic Strip */}
      <View style={styles.holoStrip}>
        <View style={styles.securityElements}>
          {ticket.holographicData.reflectiveElements.map((element, index) => (
            <View 
              key={element}
              style={[
                styles.securityDot,
                { 
                  backgroundColor: index % 2 === 0 
                    ? ticket.holographicData.colorShift.angle0 
                    : ticket.holographicData.colorShift.angle45,
                  opacity: isPast ? 0.4 : 0.8
                }
              ]} 
            />
          ))}
        </View>
        <Text style={[styles.microtext, isPast && styles.textPast]}>
          {ticket.holographicData.microtext}
        </Text>
        <Text style={[styles.serialNumber, isPast && styles.textPast]}>
          {ticket.holographicData.serialNumber}
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.tierInfo}>
          <View style={[
            styles.tierBadge, 
            { backgroundColor: ticket.tier.color },
            isPast && styles.tierBadgePast
          ]}>
            <Text style={styles.tierText}>{ticket.tier.shortName}</Text>
          </View>
          <Text style={[styles.tierName, isPast && styles.textPast]}>
            {ticket.tier.name}
          </Text>
        </View>

        <View style={styles.seatInfo}>
          <Text style={[styles.seatLabel, isPast && styles.textPast]}>
            SEAT
          </Text>
          <Text style={[styles.seatValue, isPast && styles.textPast]}>
            {getSeatDisplay()}
          </Text>
        </View>
      </View>

      {/* Ticket Perforation Effect */}
      <View style={styles.perforation}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.perforationHole} />
        ))}
      </View>

      {/* QR Code Hint */}
      <View style={styles.qrHint}>
        <View style={styles.qrPlaceholder}>
          <Text style={[styles.qrIcon, isPast && styles.textPast]}>⬛</Text>
        </View>
        <Text style={[styles.qrLabel, isPast && styles.textPast]}>
          Tap to scan
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  containerPast: {
    opacity: 0.7,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: "#BBB",
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  holoStrip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  securityElements: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  microtext: {
    fontSize: 8,
    color: "#666",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  serialNumber: {
    fontSize: 8,
    color: "#999",
    fontFamily: "monospace",
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 16,
  },
  tierInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  tierBadgePast: {
    opacity: 0.6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tierName: {
    fontSize: 14,
    color: "#CCC",
    fontWeight: "500",
  },
  seatInfo: {
    alignItems: "flex-end",
  },
  seatLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
  },
  seatValue: {
    fontSize: 14,
    color: "white",
    fontFamily: "monospace",
    fontWeight: "600",
  },
  perforation: {
    position: "absolute",
    right: 80,
    top: 0,
    bottom: 0,
    width: 1,
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  perforationHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0A0A0A",
    borderWidth: 0.5,
    borderColor: "#444",
  },
  qrHint: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -20,
    alignItems: "center",
  },
  qrPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  qrIcon: {
    fontSize: 20,
    color: "#666",
  },
  qrLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  textPast: {
    opacity: 0.6,
  },
});