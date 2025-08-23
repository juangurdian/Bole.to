import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface DiscoverHeaderProps {
  city: string;
  onCityChange: (city: string) => void;
  onSearchPress: () => void;
}

export default function DiscoverHeader({ city, onCityChange, onSearchPress }: DiscoverHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left Section - Location */}
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.citySelector} onPress={() => {}}>
            <Text style={styles.cityIcon}>📍</Text>
            <Text style={styles.cityText}>{city}</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Center - Bole.to */}
        <View style={styles.centerSection}>
          <Text style={styles.logo}>Bole.to</Text>
        </View>

        {/* Right Actions */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellButton}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    zIndex: 100,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    height: 56,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  rightSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  logo: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  cityIcon: {
    fontSize: 12,
    marginRight: theme.spacing.xs / 2,
  },
  cityText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs / 2,
  },
  chevron: {
    fontSize: 8,
    color: theme.colors.text.secondary,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 14,
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  bellIcon: {
    fontSize: 14,
  },
});