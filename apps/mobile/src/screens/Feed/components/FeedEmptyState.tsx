import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface FeedEmptyStateProps {
  scope: string;
  onDiscoverPress: () => void;
}

export default function FeedEmptyState({ scope, onDiscoverPress }: FeedEmptyStateProps) {
  const getEmptyConfig = () => {
    switch (scope) {
      case "mine":
        return {
          emoji: "🎫",
          title: "No activity yet",
          message: "Get tickets to events to see updates and connect with other attendees here.",
          buttonText: "Discover Events",
        };
      case "following":
        return {
          emoji: "👥",
          title: "Nothing from followed events",
          message: "Follow events you're interested in to see their updates and activity.",
          buttonText: "Discover Events",
        };
      case "nearby":
        return {
          emoji: "📍",
          title: "No nearby activity",
          message: "There's no recent activity from events in your area.",
          buttonText: "Explore All Events",
        };
      default:
        return {
          emoji: "🌟",
          title: "No updates yet",
          message: "Follow events to see activity from organizers and other attendees.",
          buttonText: "Discover Events",
        };
    }
  };

  const config = getEmptyConfig();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.message}>{config.message}</Text>
      <TouchableOpacity style={styles.discoverButton} onPress={onDiscoverPress}>
        <Text style={styles.discoverText}>{config.buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  discoverButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});