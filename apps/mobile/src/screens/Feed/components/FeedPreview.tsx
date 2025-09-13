import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
          <Feather name="lock" size={32} color={v2Colors.text.tertiary} />
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
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    padding: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
  },
  viewAllText: {
    fontSize: 16,
    color: v2Colors.accent,
    fontWeight: '500' as const,
  },
  lockedContainer: {
    alignItems: "center",
    padding: spacing(8),
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(2),
    marginTop: spacing(4),
  },
  lockedMessage: {
    fontSize: 16,
    color: v2Colors.text.secondary,
    textAlign: "center",
  },
  feedItem: {
    padding: spacing(3),
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
    marginBottom: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  feedText: {
    fontSize: 15,
    color: v2Colors.text.primary,
    marginBottom: spacing(1),
  },
  feedMeta: {
    fontSize: 12,
    color: v2Colors.text.tertiary,
  },
});