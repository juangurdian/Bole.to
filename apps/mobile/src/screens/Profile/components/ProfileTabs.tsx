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
  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "events", label: "Events", icon: "🎪" },
    { id: "photos", label: "Photos", icon: "📸" },
    { id: "badges", label: "Badges", icon: "🏆" },
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
                  colors={theme.colors.gradient.primary}
                  style={styles.activeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
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
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
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
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  tab: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  activeTab: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: theme.spacing.xs,
  },
  activeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  activeText: {
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  inactiveCountBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  countText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  inactiveCountText: {
    color: theme.colors.text.secondary,
  },
});