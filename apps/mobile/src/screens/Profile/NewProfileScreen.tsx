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
import { colors as v2Colors, spacing, radii } from "../../theme/v2-neutral";
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
            tintColor={v2Colors.text.primary}
            titleColor={v2Colors.text.primary}
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
              <Feather name="share-2" size={18} color={v2Colors.accent} />
              <Text style={styles.actionSecondaryText}>Share</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("QRCode")}>
            <View style={styles.actionSecondary}>
              <Feather name="smartphone" size={18} color={v2Colors.accent} />
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
    paddingHorizontal: spacing(4),
    marginBottom: spacing(4),
    gap: spacing(3),
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.bg,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: v2Colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    borderRadius: radii.md,
    gap: spacing(2),
  },
  actionSecondaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
  },
  tabContent: {
    paddingTop: spacing(4),
  },
});