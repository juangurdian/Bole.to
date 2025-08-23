import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { theme } from "../../../theme";

interface HomeTopBarProps {
  style?: ViewStyle;
  scrollY: SharedValue<number>;
  city: string;
  unread: number;
  onPickCity: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

export default function NewHomeTopBar({
  style,
  scrollY,
  city,
  unread,
  onPickCity,
  onOpenSearch,
  onOpenNotifications,
}: HomeTopBarProps) {
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [24, 40],
      [0, 1],
      Extrapolation.CLAMP
    );
    
    return { opacity };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={theme.colors.gradient.dark}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

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
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.dimensions.screenPadding,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
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
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 16,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bellIcon: {
    fontSize: 16,
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