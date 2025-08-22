import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

interface FilterChipsProps {
  selectedCategories: string[];
  dateRange: string;
  isFree: boolean;
  onToggleCategory: (category: string) => void;
  onToggleDateRange: (range: "all" | "tonight" | "weekend") => void;
  onToggleFree: (free: boolean) => void;
}

const CHIPS = [
  { id: "tonight", label: "Tonight", type: "date" },
  { id: "weekend", label: "This weekend", type: "date" },
  { id: "free", label: "Free", type: "price" },
  { id: "vip", label: "VIP", type: "category", emoji: "⭐" },
  { id: "music", label: "Music", type: "category", emoji: "🎵" },
  { id: "sports", label: "Sports", type: "category", emoji: "⚽" },
  { id: "comedy", label: "Comedy", type: "category", emoji: "😂" },
  { id: "family", label: "Family", type: "category", emoji: "👨‍👩‍👧‍👦" },
  { id: "food", label: "Food", type: "category", emoji: "🍽️" },
  { id: "art", label: "Art", type: "category", emoji: "🎨" },
];

export default function FilterChips({
  selectedCategories,
  dateRange,
  isFree,
  onToggleCategory,
  onToggleDateRange,
  onToggleFree
}: FilterChipsProps) {
  
  const handleChipPress = (chip: typeof CHIPS[0]) => {
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

  const isChipSelected = (chip: typeof CHIPS[0]) => {
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
        {CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={[
              styles.chip,
              isChipSelected(chip) && styles.chipSelected
            ]}
            onPress={() => handleChipPress(chip)}
          >
            {chip.emoji && (
              <Text style={styles.chipEmoji}>{chip.emoji}</Text>
            )}
            <Text style={[
              styles.chipText,
              isChipSelected(chip) && styles.chipTextSelected
            ]}>
              {chip.label}
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  chipTextSelected: {
    color: "white",
  },
});