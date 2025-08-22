import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface ActionRowProps {
  onSharePress: () => void;
  onSettingsPress: () => void;
}

export default function ActionRow({ onSharePress, onSettingsPress }: ActionRowProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
        <Text style={styles.actionIcon}>📤</Text>
        <Text style={styles.actionText}>Share Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
        <Text style={styles.actionIcon}>📱</Text>
        <Text style={styles.actionText}>QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
        <Text style={styles.actionIcon}>⚙️</Text>
        <Text style={styles.actionText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
});