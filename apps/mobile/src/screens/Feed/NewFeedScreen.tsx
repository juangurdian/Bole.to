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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import { theme } from "../../theme";
import { mockApi } from "../../mocks/api";
import NewHomeTopBar from "../Home/components/NewHomeTopBar";
import FeedStories from "./components/FeedStories";
import FeedFiltersNew from "./components/FeedFiltersNew";
import FeedPost from "./components/FeedPost";
import FeedComposerButton from "./components/FeedComposerButton";
import PostComposerSheet from "./components/PostComposerSheet";
import OfflineBanner from "../../components/OfflineBanner";
import SkeletonRow from "../../components/SkeletonRow";
import ErrorState from "../../components/ErrorState";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const TOPBAR_H = 56;

export type FeedScope = "all" | "following" | "nearby" | "trending";

export default function NewFeedScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScope, setSelectedScope] = useState<FeedScope>("all");
  const [showComposer, setShowComposer] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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

  const handleStoryPress = (storyId: string) => {
    navigation.navigate("StoryViewerScreen", { id: storyId });
  };

  const handleAddStory = () => {
    navigation.navigate("StoryCreatorScreen");
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

  // Animated styles for composer button
  const composerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, 100],
      "clamp"
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      "clamp"
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

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
      
      {/* Stories Section */}
      <FeedStories
        stories={data?.stories || []}
        onStoryPress={handleStoryPress}
        onAddStory={handleAddStory}
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
      
      <AnimatedFlatList
        data={data?.posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { 
          paddingTop: insets.top + TOPBAR_H + 12,
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
      <Animated.View style={[styles.composerContainer, composerAnimatedStyle, { bottom: insets.bottom + 90 }]}>
        <FeedComposerButton onPress={() => setShowComposer(true)} />
      </Animated.View>

      {/* Post Composer Sheet */}
      <PostComposerSheet
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onPostCreated={handlePostCreated}
      />
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
  headerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  scrollContent: {
    // Dynamic padding is applied inline
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyCard: {
    backgroundColor: "#111623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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