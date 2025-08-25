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

interface QuickActionsRowModernProps {
  onTickets?: () => void;
  onNearby?: () => void;
  onPromos?: () => void;
}

export default function QuickActionsRowModern({
  onTickets,
  onNearby,
  onPromos,
}: QuickActionsRowModernProps) {
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
            activeOpacity={0.85}
          >
            <View style={styles.actionCard}>
              {/* Enhanced triple-layer gradient border with glow */}
              <LinearGradient
                colors={[
                  action.gradient[0] + "60",
                  action.gradient[1] + "60", 
                  action.gradient[0] + "30",
                  "transparent"
                ]}
                style={styles.outerGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              <LinearGradient
                colors={[...action.gradient, action.gradient[0] + "20"]}
                style={styles.rimGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              {/* Premium glass background */}
              <BlurView
                intensity={60}
                tint="dark"
                style={styles.glassBackground}
              >
                {/* Top atmospheric gradient */}
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.12)",
                    "rgba(255,255,255,0.04)",
                    "transparent"
                  ]}
                  style={styles.atmosphericTop}
                />
                
                <View style={styles.actionContent}>
                  {/* Enhanced gradient icon with shadow */}
                  <View style={styles.iconWrapper}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.iconContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.iconInner}>
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                      </View>
                    </LinearGradient>
                    
                    {/* Icon glow effect */}
                    <LinearGradient
                      colors={[action.gradient[0] + "40", "transparent"]}
                      style={styles.iconGlow}
                    />
                  </View>
                  
                  <View style={styles.textContent}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                  
                  {/* Subtle bottom accent line */}
                  <LinearGradient
                    colors={[action.gradient[0] + "30", action.gradient[1] + "30"]}
                    style={styles.bottomAccent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
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
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    width: 160,
    height: 120,
  },
  firstAction: {
    marginLeft: 0,
  },
  actionCard: {
    flex: 1,
    position: "relative",
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  outerGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: theme.borderRadius.xl + 8,
    zIndex: -2,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: theme.borderRadius.xl + 1,
    zIndex: -1,
  },
  glassBackground: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  atmosphericTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  actionContent: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  iconWrapper: {
    position: "relative",
    alignSelf: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    padding: 1,
    ...theme.shadows.md,
  },
  iconInner: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: theme.borderRadius.md - 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.md + 4,
    zIndex: -1,
  },
  actionIcon: {
    fontSize: 24,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    paddingTop: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
    opacity: 0.9,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
});