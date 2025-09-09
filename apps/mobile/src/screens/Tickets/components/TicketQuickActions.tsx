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
  icon: string;
  gradient: string[];
  onPress: () => void;
}

interface TicketQuickActionsProps {
  onAddToWallet?: () => void;
  onShare?: () => void;
  onScanner?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

export default function TicketQuickActions({
  onAddToWallet,
  onShare,
  onScanner,
  onSettings,
  onHelp,
}: TicketQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: "wallet",
      title: "Add to Wallet",
      icon: "📱",
      gradient: theme.colors.gradient.primary,
      onPress: onAddToWallet || (() => console.log("Add to Wallet")),
    },
    {
      id: "share",
      title: "Share",
      icon: "📤",
      gradient: theme.colors.gradient.accent,
      onPress: onShare || (() => console.log("Share")),
    },
    {
      id: "scanner",
      title: "Staff Mode",
      icon: "👥",
      gradient: theme.colors.gradient.warm,
      onPress: onScanner || (() => console.log("Scanner")),
    },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙️",
      gradient: ["#667EEA", "#764BA2"],
      onPress: onSettings || (() => console.log("Settings")),
    },
    {
      id: "help",
      title: "Help",
      icon: "❓",
      gradient: ["#43E97B", "#38F9D7"],
      onPress: onHelp || (() => console.log("Help")),
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
            <View style={styles.actionCard}>
              {/* Rim light gradient */}
              <LinearGradient
                colors={action.gradient}
                style={styles.rimGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              <View style={styles.actionContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </View>
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
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "visible",
  },
  firstAction: {
    marginLeft: 0,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#111623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    ...theme.shadows.md,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    zIndex: -1,
    opacity: 0.6,
  },
  actionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xs,
  },
});