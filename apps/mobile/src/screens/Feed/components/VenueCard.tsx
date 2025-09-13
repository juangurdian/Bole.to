import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface VenueCardProps {
  venue: any;
  onOpenMaps: () => void;
}

export default function VenueCard({ venue, onOpenMaps }: VenueCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location</Text>
      <TouchableOpacity style={styles.venueButton} onPress={onOpenMaps}>
        <View style={styles.mapPreview}>
          <Feather name="map-pin" size={24} color={v2Colors.accent} />
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueAddress}>
            {venue.address}, {venue.city}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={v2Colors.text.tertiary} />
      </TouchableOpacity>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="navigation" size={16} color={v2Colors.accent} />
          <Text style={styles.actionText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="car" size={16} color={v2Colors.accent} />
          <Text style={styles.actionText}>Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="calendar" size={16} color={v2Colors.accent} />
          <Text style={styles.actionText}>Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    padding: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(3),
  },
  venueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
    padding: spacing(4),
    marginBottom: spacing(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  mapPreview: {
    width: 60,
    height: 60,
    backgroundColor: `${v2Colors.accent}15`,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.accent}30`,
  },
  mapIcon: {
    fontSize: 24,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(1),
  },
  venueAddress: {
    fontSize: 14,
    color: v2Colors.text.secondary,
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing(3),
  },
  actionButton: {
    flex: 1,
    backgroundColor: v2Colors.surface2,
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing(1.5),
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: v2Colors.text.primary,
  },
});