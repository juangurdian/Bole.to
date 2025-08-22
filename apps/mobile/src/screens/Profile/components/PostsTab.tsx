import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../../api";
import FeedCard from "../../Feed/components/FeedCard";

interface PostsTabProps {
  profile: any;
  isLoading: boolean;
  navigation: any;
}

export default function PostsTab({ profile, isLoading: profileLoading, navigation }: PostsTabProps) {
  const api = useApi();

  const postsQuery = useInfiniteQuery({
    queryKey: ["profile-posts"],
    queryFn: ({ pageParam }) => 
      api.getMyPosts({ 
        after: pageParam,
        pageSize: 15 
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const allPosts = postsQuery.data?.pages.flatMap(page => page.posts) || [];

  const handleEventPress = (eventId: string) => {
    // Find the event name from the posts
    const post = allPosts.find(p => p.eventId === eventId);
    const eventName = post?.eventName || "Event";
    
    navigation.navigate("EventScreen", { 
      eventId, 
      eventName,
      anchor: "feed" 
    });
  };

  const renderPost = ({ item }: { item: any }) => {
    return (
      <FeedCard 
        item={item}
        onOpenEvent={handleEventPress}
        onRefresh={() => postsQuery.refetch()}
      />
    );
  };

  if (profileLoading || postsQuery.isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.postSkeleton} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Privacy Notice */}
      {profile?.privacy?.profile !== "public" && (
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            {profile.privacy.profile === "followers" 
              ? "👥 Posts visible to followers only"
              : "🔒 Posts are private"
            }
          </Text>
        </View>
      )}

      {/* Posts List */}
      {allPosts.length > 0 ? (
        <FlatList
          data={allPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={() => {
            if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
              postsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✍️</Text>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyMessage}>
            Share your thoughts and experiences at events to see your posts here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  privacyNotice: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  privacyText: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // Skeleton styles
  postSkeleton: {
    height: 120,
    backgroundColor: "#e0e0e0",
    margin: 16,
    borderRadius: 8,
  },
});