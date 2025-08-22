import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface UpdateCardProps {
  item: any;
  onOpen: () => void;
}

export default function UpdateCard({ item, onOpen }: UpdateCardProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const getUpdateConfig = () => {
    switch (item.kind) {
      case "doors_open":
        return {
          icon: "🚪",
          title: "Doors are open!",
          color: "#00C851",
          bgColor: "#E8F8ED",
        };
      case "price_drop":
        return {
          icon: "💰",
          title: "Price drop alert!",
          color: "#FF9500",
          bgColor: "#FFF4E8",
        };
      case "low_stock":
        return {
          icon: "⚠️",
          title: "Limited tickets remaining",
          color: "#FF3B30",
          bgColor: "#FEE8E6",
        };
      default:
        return {
          icon: "ℹ️",
          title: "Event update",
          color: "#007AFF",
          bgColor: "#E8F4FD",
        };
    }
  };

  const config = getUpdateConfig();

  return (
    <TouchableOpacity style={styles.container} onPress={onOpen} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <View style={[styles.eventAvatar, { backgroundColor: config.color }]}>
            <Text style={styles.eventAvatarText}>{item.eventName.charAt(0)}</Text>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{item.eventName}</Text>
            <Text style={styles.timestamp}>
              Event Update • {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.typeIcon}>
          <Text style={styles.typeEmoji}>{config.icon}</Text>
        </View>
      </View>

      {/* Update Body */}
      <View style={[styles.updateBanner, { backgroundColor: config.bgColor }]}>
        <View style={styles.updateContent}>
          <Text style={styles.updateIcon}>{config.icon}</Text>
          <View style={styles.updateText}>
            <Text style={[styles.updateTitle, { color: config.color }]}>
              {config.title}
            </Text>
            {item.details && (
              <Text style={styles.updateDetails}>{item.details}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: config.color }]}>
          <Text style={styles.actionText}>
            {item.kind === "doors_open" ? "Get Directions" :
             item.kind === "price_drop" ? "Buy Now" :
             item.kind === "low_stock" ? "Buy Now" :
             "View Event"}
          </Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  typeIcon: {
    marginLeft: 12,
  },
  typeEmoji: {
    fontSize: 20,
  },
  updateBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
  },
  updateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  updateText: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  updateDetails: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  actionArrow: {
    fontSize: 16,
    color: "white",
  },
});