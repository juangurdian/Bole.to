import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface HomeTopBarProps {
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
}

export default function HomeTopBar({
  onSearchPress,
  onNotificationsPress,
  onProfilePress,
}: HomeTopBarProps) {
  const insets = useSafeAreaInsets();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const headerHeight = theme.dimensions.topBarHeight + insets.top;


  const handleSearchToggle = () => {
    setSearchVisible(!searchVisible);
    if (onSearchPress) onSearchPress();
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      // Handle search submission
      console.log("Searching for:", searchText);
    }
  };

  if (searchVisible) {
    return (
      <View style={[styles.container, { height: headerHeight }]}>
        <LinearGradient
          colors={theme.colors.gradient.primary}
          style={styles.background}
        />
        <View style={[styles.content, { paddingTop: insets.top }]}>
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchBackButton}
              onPress={() => setSearchVisible(false)}
            >
              <Text style={styles.searchBackText}>‹</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, people, places..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchClearButton}
              onPress={() => setSearchText("")}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: headerHeight }]}>
      <View style={[styles.background]}>
        <LinearGradient
          colors={theme.colors.gradient.primary}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.greeting}>Good evening</Text>
            <Text style={styles.title}>Bole.to</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSearchToggle}
            >
              <Text style={styles.actionIcon}>🔍</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onNotificationsPress}
            >
              <Text style={styles.actionIcon}>🔔</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onProfilePress}
            >
              <LinearGradient
                colors={theme.colors.gradient.accent}
                style={styles.profileAvatar}
              >
                <Text style={styles.profileInitials}>JD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  titleContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  actionButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 18,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  profileButton: {
    marginLeft: theme.spacing.xs,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
  },
  profileInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchBackButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBackText: {
    fontSize: 24,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.sm,
    height: "100%",
  },
  searchClearButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  searchClearText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
  },
});