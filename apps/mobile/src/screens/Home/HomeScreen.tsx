import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import { theme } from "../../theme";
import { mockApi } from "../../mocks/api";
import NewHomeTopBar from "./components/NewHomeTopBar";
import QuickActionsRow from "./components/QuickActionsRow";
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} />
      
      {/* Pinned Top Bar */}
      <NewHomeTopBar
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
        scrollY={scrollY}
        city={data?.city ?? "—"}
        unread={data?.notifications?.unread ?? 0}
        onPickCity={openCityPicker}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNotifications={handleOpenNotifications}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + TOPBAR_H + 12,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.text.primary}
            titleColor={theme.colors.text.primary}
          />
        }
      >
        <OfflineBanner />
        
        {/* Quick Actions Row */}
        <View style={{ paddingHorizontal: 16 }}>
          <QuickActionsRow
            onTickets={handleMyTickets}
            onNearby={handleNearby}
            onPromos={handlePromotions}
          />
        </View>

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
            <ReleasedPhotosSection
              items={data?.releasedGalleries || []}
              onGalleryPress={handleGalleryPress}
            />
            <SocialUpdatesSection
              items={data?.socialDigest || []}
              onUpdatePress={handleUpdatePress}
            />
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});