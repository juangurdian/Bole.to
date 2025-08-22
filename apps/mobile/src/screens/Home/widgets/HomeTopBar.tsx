import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface HomeTopBarProps {
  city: string | null;
  unreadCount: number;
  onSearchPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export default function HomeTopBar({ 
  city, 
  unreadCount, 
  onSearchPress, 
  onNotificationsPress, 
  onProfilePress 
}: HomeTopBarProps) {
  return (
    <View style={styles.container}>
      {/* Left: City selector */}
      <TouchableOpacity style={styles.citySelector}>
        <Text style={styles.cityIcon}>📍</Text>
        <Text style={styles.cityText}>{city || "Choose city"}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {/* Center: Search input */}
      <TouchableOpacity style={styles.searchInput} onPress={onSearchPress}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search events...</Text>
      </TouchableOpacity>

      {/* Right: Notifications & Profile */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.avatar} onPress={onProfilePress}>
          <Text style={styles.avatarText}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minWidth: 80,
  },
  cityIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  cityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 4,
  },
  chevron: {
    fontSize: 10,
    color: "#666",
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#666",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    position: "relative",
    padding: 8,
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    color: "white",
  },
});