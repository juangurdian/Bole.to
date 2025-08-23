import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface StickyFilterBarProps {
  selectedCategories: string[];
  dateRange: string;
  isFree: boolean;
  sort: string;
  hasFilters: boolean;
  resultsCount: number;
  onToggleCategory: (category: string) => void;
  onToggleDateRange: (range: "all" | "tonight" | "weekend") => void;
  onToggleFree: (free: boolean) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

const FILTER_CHIPS = [
  { id: "tonight", label: "Tonight", type: "date", gradient: theme.colors.gradient.warm },
  { id: "weekend", label: "Weekend", type: "date", gradient: theme.colors.gradient.accent },
  { id: "free", label: "Free", type: "price", gradient: ["#4FACFE", "#00F2FE"] },
  { id: "vip", label: "VIP", type: "category", emoji: "⭐", gradient: ["#FFD700", "#FFA500"] },
  { id: "music", label: "Music", type: "category", emoji: "🎵", gradient: ["#FF6B6B", "#4ECDC4"] },
  { id: "sports", label: "Sports", type: "category", emoji: "⚽", gradient: ["#667EEA", "#764BA2"] },
];

export default function StickyFilterBar({
  selectedCategories,
  dateRange,
  isFree,
  sort,
  hasFilters,
  resultsCount,
  onToggleCategory,
  onToggleDateRange,
  onToggleFree,
  onSortChange,
  onClearFilters
}: StickyFilterBarProps) {

  const handleChipPress = (chip: typeof FILTER_CHIPS[0]) => {
    switch (chip.type) {
      case "date":
        onToggleDateRange(dateRange === chip.id ? "all" : chip.id as any);
        break;
      case "price":
        onToggleFree(!isFree);
        break;
      case "category":
        onToggleCategory(chip.id);
        break;
    }
  };

  const isChipSelected = (chip: typeof FILTER_CHIPS[0]) => {
    switch (chip.type) {
      case "date":
        return dateRange === chip.id;
      case "price":
        return isFree;
      case "category":
        return selectedCategories.includes(chip.id);
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Chips */}
        {FILTER_CHIPS.map(chip => {
          const isSelected = isChipSelected(chip);
          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => handleChipPress(chip)}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={chip.gradient || theme.colors.gradient.primary}
                  style={styles.chip}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {chip.emoji && (
                    <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  )}
                  <Text style={[styles.chipText, styles.chipTextSelected]}>
                    {chip.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.chip, styles.chipInactive]}>
                  {chip.emoji && (
                    <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                  )}
                  <Text style={styles.chipText}>
                    {chip.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Sort & Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortIcon}>⤓</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
            {hasFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
          
          {hasFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {resultsCount} event{resultsCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
    marginRight: theme.spacing.xs,
    height: 32,
  },
  chipInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chipEmoji: {
    fontSize: 12,
    marginRight: theme.spacing.xs / 2,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  sortButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortIcon: {
    fontSize: 12,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterIcon: {
    fontSize: 12,
  },
  filterDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.info,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  clearText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.info,
    fontWeight: theme.typography.weights.medium,
  },
  resultsContainer: {
    paddingRight: theme.spacing.lg,
  },
  resultsText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
  },
});