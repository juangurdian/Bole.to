import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";

interface SectionHeaderModernProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  showCount?: number;
}

export default function SectionHeaderModern({
  title,
  subtitle,
  onSeeAll,
  showCount,
}: SectionHeaderModernProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
          {showCount !== undefined && (
            <View style={styles.countBadge}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.countGradient}
              >
                <Text style={styles.countText}>{showCount}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
        
        {/* Enhanced gradient underline */}
        <LinearGradient
          colors={[
            theme.colors.gradient.primary[0] + "60",
            theme.colors.gradient.primary[1] + "60",
            "transparent"
          ]}
          style={styles.underline}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>

      {onSeeAll && (
        <TouchableOpacity
          style={styles.seeAllContainer}
          onPress={onSeeAll}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="dark" style={styles.seeAllButton}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.15)",
                "rgba(255,255,255,0.05)"
              ]}
              style={styles.seeAllGradient}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Text style={styles.seeAllArrow}>→</Text>
            </LinearGradient>
            
            {/* Subtle glow effect */}
            <LinearGradient
              colors={[
                theme.colors.gradient.primary[0] + "20",
                "transparent"
              ]}
              style={styles.seeAllGlow}
            />
          </BlurView>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  titleSection: {
    flex: 1,
    position: "relative",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    opacity: 0.8,
  },
  countBadge: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  countGradient: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.md,
  },
  countText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  underline: {
    height: 3,
    width: 40,
    borderRadius: 2,
    opacity: 0.8,
  },
  seeAllContainer: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  seeAllButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  seeAllGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  seeAllText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  seeAllArrow: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  seeAllGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.borderRadius.lg + 2,
    zIndex: -1,
  },
});