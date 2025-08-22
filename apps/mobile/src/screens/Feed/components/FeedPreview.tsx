import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface FeedPreviewProps {
  items: any[];
  mode: "visitor" | "attendee";
  onOpen: () => void;
}

export default function FeedPreview({ items, mode, onOpen }: FeedPreviewProps) {
  if (mode === "visitor") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Event Feed</Text>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Join the conversation</Text>
          <Text style={styles.lockedMessage}>
            Buy tickets to see posts, polls, and updates from other attendees
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Feed</Text>
        <TouchableOpacity onPress={onOpen}>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>
      
      {items.slice(0, 3).map((item) => (
        <View key={item.id} style={styles.feedItem}>
          <Text style={styles.feedText}>{item.text || item.question}</Text>
          <Text style={styles.feedMeta}>
            {item.type} • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 8,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  viewAllText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  lockedContainer: {
    alignItems: "center",
    padding: 32,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  lockedMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  feedItem: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  feedText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  feedMeta: {
    fontSize: 12,
    color: "#666",
  },
});