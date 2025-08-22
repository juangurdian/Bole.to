import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface AnnouncementCardProps {
  item: any;
  onPress: () => void;
}

export default function AnnouncementCard({ item, onPress }: AnnouncementCardProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>📣</Text>
        <Text style={styles.bannerText}>Announcement</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <View style={styles.eventAvatar}>
            <Text style={styles.eventAvatarText}>{item.eventName.charAt(0)}</Text>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{item.eventName}</Text>
            <Text style={styles.timestamp}>
              From Organizer • {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.announcementText}>{item.text}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>View Event</Text>
          <Text style={styles.ctaArrow}>→</Text>
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
    borderWidth: 2,
    borderColor: "#FFC107",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  banner: {
    backgroundColor: "#FFC107",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
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
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  announcementText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    fontWeight: "500",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
  },
  ctaButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  ctaArrow: {
    fontSize: 16,
    color: "white",
  },
});