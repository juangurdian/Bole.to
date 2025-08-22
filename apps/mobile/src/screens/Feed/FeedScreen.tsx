import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import FeedCard from "./components/FeedCard";
import FeedHeader from "./components/FeedHeader";
import FeedFilters from "./components/FeedFilters";
import FeedSkeleton from "./components/FeedSkeleton";
import FeedErrorState from "./components/FeedErrorState";
import FeedEmptyState from "./components/FeedEmptyState";
import PostComposerSheet from "./components/PostComposerSheet";

type FeedScope = "all" | "mine" | "following" | "nearby";

export default function FeedScreen({ navigation }: any) {
  const [selectedScope, setSelectedScope] = useState<FeedScope>("mine");
  const [showComposer, setShowComposer] = useState(false);
  const api = useApi();

  const feedQuery = useInfiniteQuery({
    queryKey: ["feed", selectedScope],
    queryFn: ({ pageParam }) => 
      api.feed({ 
        scope: selectedScope, 
        after: pageParam,
        pageSize: 10 
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const handleEventPress = (eventId: string, anchor?: string) => {
    // Find the event name from the feed data
    const allItems = feedQuery.data?.pages.flatMap(page => page.items) || [];
    const item = allItems.find(item => item.eventId === eventId);
    const eventName = item?.eventName || "Event";
    
    navigation.navigate("EventScreen", { eventId, eventName, anchor });
  };

  const handlePostCreated = () => {
    setShowComposer(false);
    feedQuery.refetch();
  };

  const handleRefresh = () => {
    feedQuery.refetch();
  };

  const handleLoadMore = () => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      feedQuery.fetchNextPage();
    }
  };

  const handleScopeChange = (scope: FeedScope) => {
    setSelectedScope(scope);
  };

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedCard 
      item={item} 
      onOpenEvent={handleEventPress}
      onRefresh={feedQuery.refetch}
    />
  );

  const renderHeader = () => (
    <>
      <FeedHeader onSearchPress={() => {}} onNotificationsPress={() => {}} />
      <FeedFilters
        selectedScope={selectedScope}
        onScopeChange={handleScopeChange}
      />
      <TouchableOpacity 
        style={styles.composer}
        onPress={() => setShowComposer(true)}
      >
        <Text style={styles.composerText}>Share something to an event...</Text>
        <Text style={styles.composerIcon}>📝</Text>
      </TouchableOpacity>
    </>
  );

  const renderFooter = () => {
    if (feedQuery.isFetchingNextPage) {
      return <FeedSkeleton count={2} />;
    }
    return null;
  };

  const allItems = feedQuery.data?.pages.flatMap(page => page.items) || [];

  if (feedQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FeedSkeleton count={5} />
      </SafeAreaView>
    );
  }

  if (feedQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FeedErrorState onRetry={handleRefresh} />
      </SafeAreaView>
    );
  }

  if (allItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FeedEmptyState 
          scope={selectedScope}
          onDiscoverPress={() => navigation.navigate("DiscoverScreen")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={allItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={feedQuery.isFetching && !feedQuery.isFetchingNextPage} 
            onRefresh={handleRefresh} 
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <PostComposerSheet
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onPostCreated={handlePostCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    paddingBottom: 20,
  },
  composer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  composerText: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  composerIcon: {
    fontSize: 20,
  },
});