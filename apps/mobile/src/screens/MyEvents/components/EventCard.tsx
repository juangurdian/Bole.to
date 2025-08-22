import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform
} from "react-native";

interface EventCardProps {
  event: any;
  onPress: () => void;
  onAction: (action: string) => void;
}

export default function EventCard({ event, onPress, onAction }: EventCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date TBD";
    
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = () => {
    switch (event.status) {
      case "DRAFT": return "#6c757d";
      case "SCHEDULED": return "#ffc107";
      case "PUBLISHED": return "#28a745";
      case "ENDED": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusLabel = () => {
    switch (event.status) {
      case "DRAFT": return "Draft";
      case "SCHEDULED": return "Scheduled";
      case "PUBLISHED": return "Live";
      case "ENDED": return "Ended";
      default: return event.status;
    }
  };

  const handleMorePress = () => {
    const actions = ["Edit", "Preview", "Manage Tickets", "Check-in Lists", "Promote", "Duplicate", "Share", "Cancel"];
    
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: actions,
          cancelButtonIndex: actions.length - 1,
          title: event.title,
        },
        (buttonIndex) => {
          if (buttonIndex < actions.length - 1) {
            const actionMap = {
              0: "edit",
              1: "preview", 
              2: "products",
              3: "checkin",
              4: "promote",
              5: "duplicate",
              6: "share"
            };
            onAction(actionMap[buttonIndex] || "");
          }
        }
      );
    } else {
      // Android fallback - show simple alert for now
      Alert.alert(
        "Event Actions",
        "Choose an action",
        [
          { text: "Edit", onPress: () => onAction("edit") },
          { text: "Preview", onPress: () => onAction("preview") },
          { text: "Manage Tickets", onPress: () => onAction("products") },
          { text: "Promote", onPress: () => onAction("promote") },
          { text: "Share", onPress: () => onAction("share") },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const capacity = event.products?.reduce((sum, p) => sum + p.capacity, 0) || 0;
  const sold = event.metrics?.sold || 0;
  const revenue = event.metrics?.revenue || 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Cover Image Placeholder */}
      <View style={[styles.cover, { backgroundColor: event.themeColor || "#e0e0e0" }]}>
        <Text style={styles.coverIcon}>🎵</Text>
      </View>

      {/* Event Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title || "Untitled Event"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusLabel()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={handleMorePress}>
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>{formatDate(event.startsAt)}</Text>
        
        {event.venue?.name && (
          <Text style={styles.venue} numberOfLines={1}>
            📍 {event.venue.name}
          </Text>
        )}

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{sold}/{capacity}</Text>
            <Text style={styles.metricLabel}>Sold</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatCurrency(revenue)}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{event.metrics?.views || 0}</Text>
            <Text style={styles.metricLabel}>Views</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  coverIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 16,
    color: "#666",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});