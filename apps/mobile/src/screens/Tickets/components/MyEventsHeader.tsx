import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";
import SectionHeader from "../../Home/components/SectionHeader";

interface MyEventsHeaderProps {
  onCreateEvent?: () => void;
}

export default function MyEventsHeader({ onCreateEvent }: MyEventsHeaderProps) {
  const tips = [
    { id: "promoters", label: "Invite promoters", icon: "👥" },
    { id: "pricing", label: "Set price tiers", icon: "💰" },
    { id: "photos", label: "Enable photo reveal", icon: "📸" },
  ];

  return (
    <View style={styles.container}>
      <SectionHeader title="My Events" />
      
      {/* Create Event CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.createButton} onPress={onCreateEvent}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.createGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.createContent}>
              <View style={styles.createIcon}>
                <Text style={styles.createIconText}>🎪</Text>
              </View>
              <View style={styles.createText}>
                <Text style={styles.createTitle}>Create Event</Text>
                <Text style={styles.createSubtitle}>
                  Host with offline scanning, payouts, analytics
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Organizer Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Quick Tips</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tipsScroll}
        >
          {tips.map((tip) => (
            <TouchableOpacity key={tip.id} style={styles.tipChip}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <Text style={styles.tipLabel}>{tip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  ctaContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  createGradient: {
    padding: theme.spacing.lg,
  },
  createContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  createIconText: {
    fontSize: 24,
  },
  createText: {
    flex: 1,
  },
  createTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs / 2,
  },
  createSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: "rgba(255,255,255,0.9)",
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  tipsContainer: {
    paddingVertical: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  tipsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tipIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  tipLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
});