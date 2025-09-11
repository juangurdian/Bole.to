import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import { theme } from "../../theme";
import { colors as v2Colors } from "../../theme/v2-neutral";
import { mockApi } from "../../mocks/api";
import NewHomeTopBarNeutral from "../../components/NewHomeTopBarNeutral";
import QuickActionsRowMuted from "../../components/QuickActionsRowMuted";
import UpcomingSection from "./components/UpcomingSection";
import EventsNearYouSection from "./components/EventsNearYouSection";
import ReleasedPhotosSection from "./components/ReleasedPhotosSection";
import SocialUpdatesSection from "./components/SocialUpdatesSection";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

const TOPBAR_H = theme.dimensions.topBarHeight;

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fetch home data using the comprehensive payload
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["home-payload"],
    queryFn: mockApi.getHomePayload,
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

  // Event handlers
  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventStack", {
      screen: "Event",
      params: { id: eventId },
    });
  };

  const handleGalleryPress = (eventId: string) => {
    navigation.navigate("EventStack", {
      screen: "Gallery",
      params: { eventId },
    });
  };

  const handleUpdatePress = (updateId: string) => {
    navigation.navigate("FeedStack", {
      screen: "Feed",
      params: { focusId: updateId },
    });
  };

  // Top bar handlers
  const openCityPicker = () => {
    console.log("Open city picker");
  };

  const setSearchOpen = (open: boolean) => {
    console.log("Set search open:", open);
  };

  const handleOpenNotifications = () => {
    navigation.navigate("Notifications");
  };

  // Quick actions handlers
  const handleMyTickets = () => {
    navigation.navigate("TicketsTab", { screen: "WalletScreen" });
  };

  const handleNearby = () => {
    navigation.navigate("Discover", { nearby: true });
  };

  const handlePromotions = () => {
    navigation.navigate("Promotions");
  };

  return (
    <LinearGradient
      colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={v2Colors.text.primary}
            titleColor={v2Colors.text.primary}
          />
        }
      >
        {/* Neutral Top Bar - Now scrolls with content */}
        <NewHomeTopBarNeutral
          style={{
            marginBottom: 12,
          }}
          city={data?.city ?? "Managua"}
          onSearch={() => setSearchOpen(true)}
          onNotifications={handleOpenNotifications}
        />
        
        <OfflineBanner />
        
        {/* Monochrome Quick Actions Row */}
        <QuickActionsRowMuted
          onTickets={handleMyTickets}
          onNearby={handleNearby}
          onPromos={handlePromotions}
        />

        {isLoading ? (
          <>
            <SkeletonRow kind="tiles" />
            <SkeletonRow kind="events" />
            <SkeletonRow kind="galleries" />
            <SkeletonRow kind="feed" />
          </>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <>
            <UpcomingSection items={data?.upcoming || []} />
            <EventsNearYouSection
              items={data?.nearby || []}
              onEventPress={handleEventPress}
            />
            <SocialUpdatesSection
              items={data?.socialDigest || []}
              onUpdatePress={handleUpdatePress}
            />
            <ReleasedPhotosSection
              items={data?.releasedGalleries || []}
              onGalleryPress={handleGalleryPress}
            />
          </>
        )}
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Styles removed since we're using LinearGradient wrapper
  // All styling now handled by v2-neutral theme components
});