import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../../theme";

interface SortBarProps {
  sort: string;
  onSortChange: (sort: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  resultsCount: number;
}

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "soonest", label: "Soonest" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "popular", label: "Most Popular" },
  { id: "new", label: "Just Added" },
];

export default function SortBar({
  sort,
  onSortChange,
  hasFilters,
  onClearFilters,
  resultsCount
}: SortBarProps) {
  
  const currentSortLabel = SORT_OPTIONS.find(opt => opt.id === sort)?.label || "Recommended";

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort: {currentSortLabel}</Text>
          <Text style={styles.sortChevron}>▼</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.filtersButton}>
          <Text style={styles.filtersIcon}>⚙️</Text>
          <Text style={styles.filtersText}>Filters</Text>
          {hasFilters && <View style={styles.filtersDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.resultsText}>
          {resultsCount} event{resultsCount !== 1 ? 's' : ''}
        </Text>
        {hasFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  sortText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  sortChevron: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    position: "relative",
  },
  filtersIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  filtersText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  filtersDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.info,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  resultsText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
  },
  clearText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.info,
    fontWeight: theme.typography.weights.medium,
  },
});