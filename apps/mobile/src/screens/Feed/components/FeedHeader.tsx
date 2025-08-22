import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface FeedHeaderProps {
  onSearchPress: () => void;
  onNotificationsPress: () => void;
}

export default function FeedHeader({ onSearchPress, onNotificationsPress }: FeedHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity style={styles.citySelector}>
          <Text style={styles.cityText}>Managua</Text>
          <Text style={styles.cityIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
          <Text style={styles.icon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
          <Text style={styles.icon}>🔔</Text>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginRight: 16,
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 4,
  },
  cityIcon: {
    fontSize: 14,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    position: "relative",
  },
  icon: {
    fontSize: 20,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
});