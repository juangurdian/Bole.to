import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";

interface CreateEventFABProps {
  onPress: () => void;
}

export default function CreateEventFAB({ onPress }: CreateEventFABProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.fabIcon}>✨</Text>
      <Text style={styles.fabText}>Create Event</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});