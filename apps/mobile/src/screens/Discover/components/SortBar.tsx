import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  sortText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 6,
  },
  sortChevron: {
    fontSize: 10,
    color: "#666",
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    position: "relative",
  },
  filtersIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filtersText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  filtersDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultsText: {
    fontSize: 12,
    color: "#666",
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
});