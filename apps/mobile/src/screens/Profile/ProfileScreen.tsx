import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import ProfileHeader from "./components/ProfileHeader";
import StatRow from "./components/StatRow";
import ActionRow from "./components/ActionRow";
import SegmentedTabs from "./components/SegmentedTabs";
import OverviewTab from "./components/OverviewTab";
import EventsTab from "./components/EventsTab";
import PhotosTab from "./components/PhotosTab";
import PostsTab from "./components/PostsTab";
import BadgesTab from "./components/BadgesTab";

const { width } = Dimensions.get("window");

export type ProfileTab = "overview" | "events" | "photos" | "posts" | "badges";

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [selectedTab, setSelectedTab] = useState<ProfileTab>("overview");
  const api = useApi();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getMyProfile(),
  });

  const showcaseQuery = useQuery({
    queryKey: ["profile-showcase"],
    queryFn: () => api.getMyShowcase(),
  });

  const handleRefresh = () => {
    profileQuery.refetch();
    showcaseQuery.refetch();
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  const handleShareProfile = () => {
    navigation.navigate("ShareProfile");
  };

  const handleFollowersPress = () => {
    navigation.navigate("FollowersList", { type: "followers" });
  };

  const handleFollowingPress = () => {
    navigation.navigate("FollowersList", { type: "following" });
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "overview":
        return (
          <OverviewTab
            showcase={showcaseQuery.data}
            isLoading={showcaseQuery.isLoading}
            navigation={navigation}
          />
        );
      case "events":
        return (
          <EventsTab
            profile={profileQuery.data}
            showcase={showcaseQuery.data}
            isLoading={showcaseQuery.isLoading}
            navigation={navigation}
          />
        );
      case "photos":
        return (
          <PhotosTab
            profile={profileQuery.data}
            isLoading={showcaseQuery.isLoading}
            navigation={navigation}
          />
        );
      case "posts":
        return (
          <PostsTab
            profile={profileQuery.data}
            isLoading={showcaseQuery.isLoading}
            navigation={navigation}
          />
        );
      case "badges":
        return (
          <BadgesTab
            profile={profileQuery.data}
            isLoading={profileQuery.isLoading}
            navigation={navigation}
          />
        );
      default:
        return null;
    }
  };

  const isLoading = profileQuery.isLoading || showcaseQuery.isLoading;
  const profile = profileQuery.data;
  const showcase = showcaseQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header Section */}
        <ProfileHeader
          profile={profile}
          isLoading={profileQuery.isLoading}
          onEditPress={handleEditProfile}
        />

        {/* Stats Row */}
        <StatRow
          profile={profile}
          isLoading={profileQuery.isLoading}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
        />

        {/* Action Row */}
        <ActionRow
          onSharePress={handleShareProfile}
          onSettingsPress={handleSettings}
        />

        {/* Segmented Tabs */}
        <SegmentedTabs
          selectedTab={selectedTab}
          onTabPress={setSelectedTab}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    minHeight: 400,
  },
});