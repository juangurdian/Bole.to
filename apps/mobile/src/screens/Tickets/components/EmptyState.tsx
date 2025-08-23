import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../../theme";

interface EmptyStateProps {
  type: "tickets" | "events";
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  type,
  title,
  subtitle,
  buttonText,
  onButtonPress
}: EmptyStateProps) {
  const getEmoji = () => {
    return type === "tickets" ? "🎟️" : "🎪";
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{getEmoji()}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        
        {onButtonPress && (
          <TouchableOpacity style={styles.button} onPress={onButtonPress}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  card: {
    backgroundColor: "#111623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
    opacity: 0.7,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  buttonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
});