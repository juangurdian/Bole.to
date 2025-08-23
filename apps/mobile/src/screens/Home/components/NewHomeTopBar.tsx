import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface HomeTopBarProps {
  style?: ViewStyle;
  scrollY?: any; // Keep for compatibility but not used
  city: string;
  unread: number;
  onPickCity: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

export default function NewHomeTopBar({
  style,
  scrollY, // Not used anymore
  city,
  unread,
  onPickCity,
  onOpenSearch,
  onOpenNotifications,
}: HomeTopBarProps) {
  return (
    <View style={[styles.container, style]}>

      <View style={styles.content}>
        {/* Left: Location Pill */}
        <TouchableOpacity style={styles.locationPill} onPress={onPickCity}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{city}</Text>
        </TouchableOpacity>

        {/* Center: Bole.to Label */}
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>Bole.to</Text>
          </LinearGradient>
        </View>

        {/* Right: Search Chip + Bell */}
        <View style={styles.rightContainer}>
          <TouchableOpacity style={styles.searchChip} onPress={onOpenSearch}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellButton} onPress={onOpenNotifications}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unread > 99 ? "99+" : unread.toString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: theme.dimensions.topBarHeight,
    paddingHorizontal: theme.dimensions.screenPadding,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
  },
  logoGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  logoText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  searchChip: {
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
    position: "relative",
  },
  bellIcon: {
    fontSize: 14,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.round,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
});