import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { theme } from "../../theme";
import { mockApi } from "../../mocks/api";

// Profile Components
import ProfileHeaderNew from "./components/ProfileHeaderNew";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import ProfileOverview from "./components/ProfileOverview";
import ProfileEvents from "./components/ProfileEvents";
import ProfilePhotos from "./components/ProfilePhotos";
import ProfileBadges from "./components/ProfileBadges";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

export type ProfileTab = "overview" | "events" | "photos" | "badges";

export default function NewProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ProfileTab>("overview");

  // Fetch profile data using mock API
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile-payload"],
    queryFn: mockApi.getProfilePayload,
    refetchOnMount: true,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Navigation handlers
  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  const handleShareProfile = () => {
    console.log("Share profile");
  };

  const handleFollowersPress = () => {
    navigation.navigate("FollowersList", { type: "followers" });
  };

  const handleFollowingPress = () => {
    navigation.navigate("FollowersList", { type: "following" });
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventScreen", { id: eventId });
  };

  const handlePhotoPress = (photoId: string) => {
    navigation.navigate("PhotoViewerScreen", { id: photoId });
  };

  const renderTabContent = () => {
    if (!data) return null;

    switch (selectedTab) {
      case "overview":
        return (
          <ProfileOverview
            data={data.overview}
            onEventPress={handleEventPress}
            navigation={navigation}
          />
        );
      case "events":
        return (
          <ProfileEvents
            events={data.events}
            onEventPress={handleEventPress}
          />
        );
      case "photos":
        return (
          <ProfilePhotos
            photos={data.photos}
            onPhotoPress={handlePhotoPress}
          />
        );
      case "badges":
        return (
          <ProfileBadges
            badges={data.badges}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} translucent />
      
      {/* Atmosphere Gradient */}
      <LinearGradient
        colors={["rgba(124,92,255,0.3)", "rgba(0,224,255,0.2)", "transparent"]}
        style={styles.atmosphereGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 90 + 24
        }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text.primary}
            titleColor={theme.colors.text.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <OfflineBanner />
        
        {/* Profile Header with Avatar, Name, Bio */}
        <ProfileHeaderNew
          profile={data?.profile}
          onEditPress={handleEditProfile}
          onSettingsPress={handleSettings}
          onSharePress={handleShareProfile}
          isLoading={isLoading}
        />

        {/* Stats Section */}
        <ProfileStats
          stats={data?.stats}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
          isLoading={isLoading}
        />

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
            <View style={styles.actionSecondary}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionSecondaryText}>Share</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("QRCode")}>
            <View style={styles.actionSecondary}>
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionSecondaryText}>QR</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ProfileTabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          counts={{
            events: data?.events?.length || 0,
            photos: data?.photos?.length || 0,
            badges: data?.badges?.length || 0,
          }}
        />

        {/* Tab Content */}
        {isLoading ? (
          <>
            <SkeletonRow kind="tiles" />
            <SkeletonRow kind="events" />
          </>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  atmosphereGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Dynamic padding is applied inline
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionSecondaryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  tabContent: {
    paddingTop: theme.spacing.md,
  },
});