import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

type FeedScope = "all" | "mine" | "following" | "nearby";

interface FeedFiltersProps {
  selectedScope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
}

const FILTER_OPTIONS = [
  { id: "all", label: "All", icon: "🌟" },
  { id: "mine", label: "My Events", icon: "🎫" },
  { id: "following", label: "Following", icon: "👥" },
  { id: "nearby", label: "Nearby", icon: "📍" },
] as const;

export default function FeedFilters({ selectedScope, onScopeChange }: FeedFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterChip,
              selectedScope === option.id && styles.filterChipSelected
            ]}
            onPress={() => onScopeChange(option.id as FeedScope)}
          >
            <Text style={styles.filterIcon}>{option.icon}</Text>
            <Text style={[
              styles.filterText,
              selectedScope === option.id && styles.filterTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  filterTextSelected: {
    color: "white",
  },
});