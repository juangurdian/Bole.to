import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

export type ProfileTab = "overview" | "events" | "photos" | "badges";

interface ProfileTabsProps {
  selectedTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  counts?: {
    events: number;
    photos: number;
    badges: number;
  };
}

export default function ProfileTabs({
  selectedTab,
  onTabChange,
  counts,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTab; label: string; iconName: keyof typeof Feather.glyphMap }[] = [
    { id: "overview", label: "Overview", iconName: "bar-chart" },
    { id: "events", label: "Events", iconName: "calendar" },
    { id: "photos", label: "Photos", iconName: "camera" },
    { id: "badges", label: "Badges", iconName: "award" },
  ];

  const getTabCount = (tabId: ProfileTab) => {
    if (!counts) return null;
    switch (tabId) {
      case "events":
        return counts.events;
      case "photos":
        return counts.photos;
      case "badges":
        return counts.badges;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          const count = getTabCount(tab.id);
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={[v2Colors.accent, v2Colors.accent2]}
                  style={styles.activeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Feather name={tab.iconName} size={16} color={v2Colors.bg} />
                  <Text style={[styles.tabText, styles.activeText]}>
                    {tab.label}
                  </Text>
                  {count !== null && count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.tabContent}>
                  <Feather name={tab.iconName} size={16} color={v2Colors.text.secondary} />
                  <Text style={styles.tabText}>{tab.label}</Text>
                  {count !== null && count > 0 && (
                    <View style={[styles.countBadge, styles.inactiveCountBadge]}>
                      <Text style={[styles.countText, styles.inactiveCountText]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v2Colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing(4),
    gap: spacing(2),
    paddingBottom: spacing(3),
  },
  tab: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  activeTab: {
    shadowColor: v2Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    backgroundColor: v2Colors.surface1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    gap: spacing(2),
  },
  activeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    gap: spacing(2),
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: v2Colors.text.secondary,
  },
  activeText: {
    color: v2Colors.bg,
    fontWeight: '600' as const,
  },
  countBadge: {
    backgroundColor: `${v2Colors.bg}30`,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
    marginLeft: spacing(1),
  },
  inactiveCountBadge: {
    backgroundColor: v2Colors.surface2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: v2Colors.bg,
  },
  inactiveCountText: {
    color: v2Colors.text.secondary,
  },
});