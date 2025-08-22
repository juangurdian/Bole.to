import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
          <Text style={styles.mapIcon}>🗺️</Text>
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueAddress}>
            {venue.address}, {venue.city}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📍 Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>🚗 Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📅 Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  venueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mapPreview: {
    width: 60,
    height: 60,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mapIcon: {
    fontSize: 24,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 14,
    color: "#666",
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
});