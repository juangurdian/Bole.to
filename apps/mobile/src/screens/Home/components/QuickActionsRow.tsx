import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  onPress: () => void;
}

interface QuickActionsRowProps {
  onTickets?: () => void;
  onNearby?: () => void;
  onPromos?: () => void;
}

export default function QuickActionsRow({
  onTickets,
  onNearby,
  onPromos,
}: QuickActionsRowProps) {
  const quickActions: QuickAction[] = [
    {
      id: "tickets",
      title: "My Tickets",
      subtitle: "Your events",
      icon: "🎫",
      gradient: theme.colors.gradient.primary,
      onPress: onTickets || (() => console.log("My Tickets")),
    },
    {
      id: "nearby",
      title: "Find Nearby",
      subtitle: "Discover events",
      icon: "📍",
      gradient: theme.colors.gradient.accent,
      onPress: onNearby || (() => console.log("Find Nearby")),
    },
    {
      id: "promos",
      title: "Promotions",
      subtitle: "Special deals",
      icon: "🎁",
      gradient: theme.colors.gradient.warm,
      onPress: onPromos || (() => console.log("Promotions")),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, index === 0 && styles.firstAction]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.gradient}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    width: 140,
    height: theme.dimensions.quickActionHeight,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  firstAction: {
    marginLeft: 0,
  },
  actionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    alignSelf: "stretch",
  },
  actionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xs,
  },
});