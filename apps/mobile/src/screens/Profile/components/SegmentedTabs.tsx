import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";
import type { ProfileTab } from "../ProfileScreen";

interface SegmentedTabsProps {
  selectedTab: ProfileTab;
  onTabPress: (tab: ProfileTab) => void;
}

const TABS: Array<{ key: ProfileTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "events", label: "Events" },
  { key: "photos", label: "Photos" },
  { key: "posts", label: "Posts" },
  { key: "badges", label: "Badges" },
];

export default function SegmentedTabs({ selectedTab, onTabPress }: SegmentedTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v2Colors.border,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  scrollContainer: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(1),
  },
  tab: {
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: spacing(6),
  },
  activeTab: {
    borderBottomColor: v2Colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: v2Colors.text.secondary,
  },
  activeTabText: {
    color: v2Colors.accent,
    fontWeight: "600",
  },
});