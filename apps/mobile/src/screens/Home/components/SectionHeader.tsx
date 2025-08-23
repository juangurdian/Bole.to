import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        <TouchableOpacity style={styles.seeAllChip} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See all</Text>
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
  },
  underline: {
    height: 2,
    width: "60%",
    borderRadius: 1,
  },
  seeAllChip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    minHeight: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
});