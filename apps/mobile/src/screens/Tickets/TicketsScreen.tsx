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
import { mockApi } from "../../mocks/api";
import NewHomeTopBar from "../Home/components/NewHomeTopBar";
import TicketSegmented from "./components/TicketSegmented";
import TicketQuickActions from "./components/TicketQuickActions";
import UpcomingSection from "./components/UpcomingSection";
import PastSection from "./components/PastSection";
import MyEventsHeader from "./components/MyEventsHeader";
import MyEventsList from "./components/MyEventsList";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

const TOPBAR_H = 56;
const SEGMENT_H = 48;

export type TicketsTab = "tickets" | "events";

export default function TicketsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TicketsTab>("tickets");

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fetch tickets data using mock API
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tickets-payload"],
    queryFn: mockApi.getTicketsPayload,
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
  const handleTicketPress = (ticketId: string) => {
    navigation.navigate("TicketScreen", { id: ticketId });
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventPreviewScreen", { id: eventId });
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
  const handleAddToWallet = () => {
    console.log("Add to Wallet");
  };

  const handleShare = () => {
    console.log("Share");
  };

  const handleScanner = () => {
    navigation.navigate("ScannerScreen");
  };

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  const handleHelp = () => {
    console.log("Help");
  };

  const handleCreateEvent = () => {
    navigation.navigate("EventEditorWizard");
  };

  const renderTabContent = () => {
    if (selectedTab === "tickets") {
      return (
        <>
          <UpcomingSection 
            items={data?.upcoming || []} 
            onTicketPress={handleTicketPress}
          />
          <PastSection 
            items={data?.past || []} 
            onTicketPress={handleTicketPress}
          />
        </>
      );
    } else {
      return (
        <>
          <MyEventsHeader onCreateEvent={handleCreateEvent} />
          <MyEventsList 
            items={data?.myEvents || []} 
            onEventPress={handleEventPress}
          />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} translucent />
      
      {/* Atmosphere Gradient */}
      <LinearGradient
        colors={["rgba(124,92,255,0.25)", "rgba(0,224,255,0.15)", "transparent"]}
        style={styles.atmosphereGradient}
      />

      {/* Header - Absolutely Positioned */}
      <View style={[styles.headerContainer, { top: insets.top }]}>
        <NewHomeTopBar
          city={data?.city ?? "—"}
          unread={data?.notifications?.unread ?? 0}
          onPickCity={openCityPicker}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={handleOpenNotifications}
        />
      </View>
      
      {/* Sticky Segmented Control */}
      <View style={[styles.segmentedContainer, { top: insets.top + TOPBAR_H }]}>
        <TicketSegmented
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
      </View>
      
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { 
          paddingTop: insets.top + TOPBAR_H + SEGMENT_H + 12,
          paddingBottom: insets.bottom + 90 + 24
        }]}
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
          <TicketQuickActions
            onAddToWallet={handleAddToWallet}
            onShare={handleShare}
            onScanner={handleScanner}
            onSettings={handleSettings}
            onHelp={handleHelp}
          />
        </View>

        {isLoading ? (
          <>
            <SkeletonRow kind="tiles" />
            <SkeletonRow kind="events" />
            <SkeletonRow kind="galleries" />
          </>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          renderTabContent()
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
  atmosphereGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  headerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  segmentedContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: "rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
  },
  scrollContent: {
    // Dynamic padding is applied inline
  },
});