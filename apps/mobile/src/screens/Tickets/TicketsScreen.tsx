import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { theme } from "../../theme";
import { colors as v2Colors } from "../../theme/v2-neutral";
import { mockApi } from "../../mocks/api";
import NewHomeTopBarNeutral from "../../components/NewHomeTopBarNeutral";
import TicketSegmented from "./components/TicketSegmented";
import TicketQuickActions from "./components/TicketQuickActions";
import UpcomingSection from "./components/UpcomingSection";
import PastSection from "./components/PastSection";
import MyEventsHeader from "./components/MyEventsHeader";
import MyEventsList from "./components/MyEventsList";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

// Constants removed - now using simpler inline layout

export type TicketsTab = "tickets" | "events";

export default function TicketsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TicketsTab>("tickets");


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
    navigation.navigate("StaffEntryScreen");
  };

  const handleSettings = () => {
    navigation.navigate("Settings");
  };

  // Help action removed to fit 4 actions design

  const handleCreateEvent = () => {
    navigation.navigate("CreateEvent");
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
    <LinearGradient
      colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />
      
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 90 + 24,
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
        {/* New Home Top Bar - matches home page design */}
        <NewHomeTopBarNeutral
          style={{
            marginBottom: 4,
          }}
          city={data?.city ?? "Managua"}
          onSearch={() => setSearchOpen(true)}
          onNotifications={handleOpenNotifications}
        />
        
        {/* Segmented Control */}
        <TicketSegmented
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
        
        <OfflineBanner />
        
        {/* Quick Actions Row */}
        <View style={{ paddingHorizontal: 16 }}>
          <TicketQuickActions
            onAddToWallet={handleAddToWallet}
            onShare={handleShare}
            onScanner={handleScanner}
            onSettings={handleSettings}
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
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Styles are now minimal since we moved to inline styling with v2-neutral design
});