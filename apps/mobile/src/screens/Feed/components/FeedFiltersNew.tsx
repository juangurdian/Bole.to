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

export type FeedScope = "all" | "following" | "nearby" | "trending";

interface FeedFiltersNewProps {
  selectedScope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
}

export default function FeedFiltersNew({ 
  selectedScope, 
  onScopeChange 
}: FeedFiltersNewProps) {
  const filters: { id: FeedScope; label: string; icon: string }[] = [
    { id: "all", label: "For You", icon: "✨" },
    { id: "following", label: "Following", icon: "👥" },
    { id: "nearby", label: "Nearby", icon: "📍" },
    { id: "trending", label: "Trending", icon: "🔥" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedScope === filter.id && styles.activeFilter
            ]}
            onPress={() => onScopeChange(filter.id)}
            activeOpacity={0.8}
          >
            {selectedScope === filter.id ? (
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.filterIcon}>{filter.icon}</Text>
                <Text style={[styles.filterText, styles.activeText]}>
                  {filter.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterContent}>
                <Text style={styles.filterIcon}>{filter.icon}</Text>
                <Text style={styles.filterText}>{filter.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  activeFilter: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  filterContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  activeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  filterText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  activeText: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
});