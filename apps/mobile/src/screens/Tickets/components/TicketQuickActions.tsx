import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";
import { colors as v2Colors } from "../../../theme/v2-neutral";

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
}

export default function TicketQuickActions({
  onAddToWallet,
  onShare,
  onScanner,
  onSettings,
}: TicketQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: "wallet",
      title: "Add to Wallet",
      icon: "📱",
      gradient: [v2Colors.accent, v2Colors.accent2],
      onPress: onAddToWallet || (() => console.log("Add to Wallet")),
    },
    {
      id: "share",
      title: "Share",
      icon: "📤",
      gradient: [v2Colors.accent2, v2Colors.accent],
      onPress: onShare || (() => console.log("Share")),
    },
    {
      id: "scanner",
      title: "Staff Mode",
      icon: "👥",
      gradient: ["#667EEA", "#764BA2"],
      onPress: onScanner || (() => console.log("Scanner")),
    },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙️",
      gradient: ["#43E97B", "#38F9D7"],
      onPress: onSettings || (() => console.log("Settings")),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: theme.spacing.xs / 2,
    borderRadius: 16,
    overflow: "visible",
  },
  actionCard: {
    flex: 1,
    backgroundColor: v2Colors.surface1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
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
    color: v2Colors.text.primary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xs,
  },
});