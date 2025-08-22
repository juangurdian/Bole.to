import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface DiscoverHeaderProps {
  city: string;
  onCityChange: (city: string) => void;
  onSearchPress: () => void;
}

export default function DiscoverHeader({ city, onCityChange, onSearchPress }: DiscoverHeaderProps) {
  return (
    <View style={styles.container}>
      {/* City Selector */}
      <TouchableOpacity style={styles.citySelector} onPress={() => {}}>
        <Text style={styles.cityIcon}>📍</Text>
        <Text style={styles.cityText}>{city}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={onSearchPress}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search events...</Text>
      </TouchableOpacity>

      {/* Bell Icon */}
      <TouchableOpacity style={styles.bellButton}>
        <Text style={styles.bellIcon}>🔔</Text>
      </TouchableOpacity>
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
    marginRight: 12,
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
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#666",
  },
  bellButton: {
    padding: 8,
  },
  bellIcon: {
    fontSize: 20,
  },
});