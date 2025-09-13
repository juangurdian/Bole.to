import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { theme } from "../../theme";
import { colors as v2Colors } from "../../theme/v2-neutral";
import { mockApi } from "../../mocks/api";
import NewHomeTopBarNeutral from "../../components/NewHomeTopBarNeutral";
import FeedEventCircles from "./components/FeedEventCircles";
import FeedFiltersNew from "./components/FeedFiltersNew";
import FeedPost from "./components/FeedPost";
import FeedComposerButton from "./components/FeedComposerButton";
import PostComposerSheet from "./components/PostComposerSheet";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

const TOPBAR_H = 56;

export type FeedScope = "all" | "following" | "nearby" | "trending";

export default function NewFeedScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScope, setSelectedScope] = useState<FeedScope>("all");
  const [showComposer, setShowComposer] = useState(false);


  // Fetch feed data using mock API
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["feed-payload", selectedScope],
    queryFn: () => mockApi.getFeedPayload(selectedScope),
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
  const handlePostPress = (postId: string) => {
    navigation.navigate("PostScreen", { id: postId });
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate("EventScreen", { id: eventId });
  };

  const handleProfilePress = (userId: string) => {
    navigation.navigate("ProfileScreen", { id: userId });
  };

  const handleEventCirclePress = (eventId: string) => {
    navigation.navigate("EventScreen", { id: eventId });
  };

  const handleCreateEvent = () => {
    navigation.navigate("EventEditorWizard");
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

  const handlePostCreated = () => {
    setShowComposer(false);
    refetch();
  };


  const renderPost = ({ item }: { item: any }) => (
    <FeedPost
      post={item}
      onPress={() => handlePostPress(item.id)}
      onEventPress={handleEventPress}
      onProfilePress={handleProfilePress}
    />
  );

  const renderHeader = () => (
    <>
      <OfflineBanner />
      
      {/* User's Events Section */}
      <FeedEventCircles
        events={data?.userEvents || []}
        onEventPress={handleEventCirclePress}
        onCreateEvent={handleCreateEvent}
      />
      
      {/* Filter Pills */}
      <FeedFiltersNew
        selectedScope={selectedScope}
        onScopeChange={setSelectedScope}
      />
    </>
  );

  const renderFooter = () => {
    if (isLoading) {
      return (
        <>
          <SkeletonRow kind="events" />
          <SkeletonRow kind="galleries" />
        </>
      );
    }
    return <View style={{ height: 100 }} />;
  };

  return (
    <LinearGradient
      colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />
      
      <FlatList
        data={data?.posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {/* New Home Top Bar - matches other pages */}
            <NewHomeTopBarNeutral
              style={{
                marginBottom: 4,
                marginTop: insets.top,
              }}
              city={data?.city ?? "Managua"}
              onSearch={() => setSearchOpen(true)}
              onNotifications={handleOpenNotifications}
            />
            {renderHeader()}
          </>
        )}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 90 + 24
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
        ListEmptyComponent={
          isError ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.emptyGradient}
                  >
                    <TouchableOpacity onPress={() => setShowComposer(true)}>
                      <View style={styles.emptyContent}>
                        <View style={styles.emptyEmoji}>
                          <TouchableOpacity>
                            <View style={{ padding: 20 }}>
                              <TouchableOpacity>
                                <View>
                                  <TouchableOpacity>
                                    <View>
                                      <TouchableOpacity onPress={() => setShowComposer(true)}>
                                        <View style={{ padding: 10 }}>
                                          {/* Multiple touchable layers for better UX */}
                                        </View>
                                      </TouchableOpacity>
                                    </View>
                                  </TouchableOpacity>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            </View>
          )
        }
      />

      {/* Floating Composer Button */}
      <View style={[styles.composerContainer, { bottom: insets.bottom + 90 }]}>
        <FeedComposerButton onPress={() => setShowComposer(true)} />
      </View>

      {/* Post Composer Sheet */}
      <PostComposerSheet
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onPostCreated={handlePostCreated}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyCard: {
    backgroundColor: v2Colors.surface1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
  },
  emptyGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    opacity: 0.8,
  },
  composerContainer: {
    position: "absolute",
    right: theme.spacing.lg,
    zIndex: 99,
  },
});