import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
            activeOpacity={0.9}
          >
            <View style={styles.actionCard}>
              {/* Enhanced rim gradient with glow effect */}
              <LinearGradient
                colors={[...action.gradient, action.gradient[0] + "40"]}
                style={styles.rimGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              {/* Glass overlay for depth */}
              <LinearGradient
                colors={theme.effects.gradientOverlays.cardTop}
                style={styles.glassTopOverlay}
              />
              
              <BlurView
                intensity={40}
                tint="dark"
                style={styles.actionContent}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </LinearGradient>
                
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                
                {/* Bottom accent line */}
                <LinearGradient
                  colors={["transparent", action.gradient[0] + "60", "transparent"]}
                  style={styles.bottomAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </BlurView>
            </View>
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
    paddingLeft: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 140,
    height: 120,
    borderRadius: 24,
    overflow: "visible",
  },
  firstAction: {
    marginLeft: 0,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.effects.glass.secondary,
    position: "relative",
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  rimGradient: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 27,
    zIndex: -1,
    opacity: 0.6,
  },
  glassTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    zIndex: 1,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: theme.spacing.md,
    backgroundColor: theme.effects.backdrop.dark,
    position: "relative",
    zIndex: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 18,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionText: {
    alignSelf: "stretch",
  },
  actionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    opacity: 0.9,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});