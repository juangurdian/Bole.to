import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <LinearGradient
          colors={theme.colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.underline}
        />
      </View>
      
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllChip} onPress={onSeeAll} activeOpacity={0.8}>
          <BlurView intensity={60} tint="dark" style={styles.seeAllBlur}>
            <LinearGradient
              colors={theme.colors.gradient.accent}
              style={styles.seeAllGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </LinearGradient>
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
    alignItems: "center",
    paddingHorizontal: theme.dimensions.screenPadding,
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    position: "relative",
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  underline: {
    height: 3,
    width: "70%",
    borderRadius: 2,
    opacity: 0.8,
  },
  seeAllChip: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  seeAllBlur: {
    backgroundColor: theme.effects.backdrop.darker,
    overflow: "hidden",
  },
  seeAllGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});