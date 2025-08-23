import React from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import BoletoTabItem from "./BoletoTabItem";
import { theme } from "../../theme";

export default function BoletoTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const getIconType = (routeName: string) => {
    switch (routeName.toLowerCase()) {
      case "home":
        return "home" as const;
      case "search":
      case "discover":
        return "search" as const;
      case "tickets":
      case "wallet":
        return "tickets" as const;
      case "feed":
        return "feed" as const;
      case "profile":
        return "profile" as const;
      default:
        return "home" as const;
    }
  };

  const getLabel = (routeName: string) => {
    switch (routeName.toLowerCase()) {
      case "home":
        return "Home";
      case "search":
      case "discover":
        return "Search";
      case "tickets":
      case "wallet":
        return "Tickets";
      case "feed":
        return "Feed";
      case "profile":
        return "Profile";
      default:
        return routeName;
    }
  };

  const handleTabPress = (route: any, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 8,
        },
      ]}
    >
      <BlurView
        intensity={12}
        tint="dark"
        style={styles.blurContainer}
      >
        <View style={styles.tabBarOverlay}>
          <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
              const isActive = state.index === index;
              const iconType = getIconType(route.name);
              const label = getLabel(route.name);

              return (
                <BoletoTabItem
                  key={route.key}
                  label={label}
                  iconType={iconType}
                  active={isActive}
                  onPress={() => handleTabPress(route, index)}
                  testID={`tab-${route.name.toLowerCase()}`}
                />
              );
            })}
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  blurContainer: {
    borderRadius: theme.borderRadius.nav,
    overflow: "hidden",
    ...theme.shadows.nav,
  },
  tabBarOverlay: {
    backgroundColor: theme.colors.nav.bg,
    borderRadius: theme.borderRadius.nav,
    borderWidth: 1,
    borderColor: theme.colors.nav.border,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: 64,
  },
});