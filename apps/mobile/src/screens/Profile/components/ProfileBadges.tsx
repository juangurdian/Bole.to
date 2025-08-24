import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: string;
}

interface ProfileBadgesProps {
  badges?: Badge[];
}

const RARITY_GRADIENTS = {
  common: ["#9CA3AF", "#6B7280"],
  rare: ["#3B82F6", "#1D4ED8"],
  epic: ["#8B5CF6", "#7C3AED"],
  legendary: ["#F59E0B", "#D97706"],
};

export default function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (!badges || badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>No badges earned yet</Text>
      </View>
    );
  }

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={styles.badgeCard}>
      <LinearGradient
        colors={RARITY_GRADIENTS[item.rarity]}
        style={styles.badgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.badgeContent}>
          <Text style={styles.badgeIcon}>{item.icon}</Text>
          <Text style={styles.badgeTitle}>{item.title}</Text>
          <Text style={styles.badgeDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.badgeRarity}>
            <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
          </View>
          {item.unlockedAt && (
            <Text style={styles.unlockedDate}>
              Earned {item.unlockedAt}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <FlatList
      data={badges}
      renderItem={renderBadge}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  badgeCard: {
    width: "48%",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  badgeGradient: {
    padding: 1,
  },
  badgeContent: {
    backgroundColor: "#111623",
    borderRadius: theme.borderRadius.lg - 1,
    padding: theme.spacing.md,
    alignItems: "center",
    minHeight: 140,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  badgeTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  badgeDescription: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  badgeRarity: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  unlockedDate: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
});