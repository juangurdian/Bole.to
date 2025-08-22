import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import PostCard from "./components/PostCard";
import PollCard from "./components/PollCard";
import AnnouncementCard from "./components/AnnouncementCard";
import UpdateCard from "./components/UpdateCard";
import GalleryTeaserCard from "./components/GalleryTeaserCard";
import PostComposerSheet from "./components/PostComposerSheet";
import AttendeesRail from "./components/AttendeesRail";
import FeedErrorState from "./components/FeedErrorState";
import FeedEmptyState from "./components/FeedEmptyState";

interface EventScreenProps {
  route: {
    params: {
      eventId: string;
      eventName: string;
    };
  };
  navigation: any;
}

export default function EventScreen({ route, navigation }: EventScreenProps) {
  const { eventId, eventName } = route.params;
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [isAttendee, setIsAttendee] = useState(false);
  const api = useApi();

  // Check if user is an attendee of this event
  React.useEffect(() => {
    api.hasTicket(eventId).then(setIsAttendee);
  }, [eventId]);

  const feedQuery = useInfiniteQuery({
    queryKey: ["eventFeed", eventId],
    queryFn: ({ pageParam }) => 
      api.eventFeed(eventId, { after: pageParam, pageSize: 15 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const attendeesQuery = useInfiniteQuery({
    queryKey: ["eventAttendees", eventId],
    queryFn: ({ pageParam }) => 
      api.getEventAttendees(eventId, { after: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const renderFeedItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case "post":
        return <PostCard item={item} />;
      case "poll":
        return <PollCard item={item} />;
      case "announcement":
        return <AnnouncementCard item={item} />;
      case "update":
        return <UpdateCard item={item} />;
      case "gallery_teaser":
        return <GalleryTeaserCard item={item} />;
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{eventName}</Text>
        {isAttendee ? (
          <View style={styles.attendeeBadge}>
            <Text style={styles.attendeeBadgeText}>✓ Attending</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.getTicketsButton}
            onPress={() => navigation.navigate("Tickets", { eventId })}
          >
            <Text style={styles.getTicketsText}>Get Tickets</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Attendees Rail - Only show if attendee or if there are public attendees */}
      {(isAttendee || attendeesQuery.data?.pages?.[0]?.attendees?.length) && (
        <AttendeesRail 
          attendees={attendeesQuery.data?.pages?.[0]?.attendees || []}
          totalCount={attendeesQuery.data?.pages?.[0]?.totalCount || 0}
          isAttendee={isAttendee}
        />
      )}

      {/* Action Bar - Only show for attendees */}
      {isAttendee && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsComposerVisible(true)}
          >
            <Text style={styles.actionText}>✏️ Post</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate("CaptureScreen", { eventId })}
          >
            <Text style={styles.actionText}>📷 Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate("GalleryScreen", { eventId })}
          >
            <Text style={styles.actionText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {isAttendee ? "Event Updates & Posts" : "Recent Updates"}
        </Text>
        {!isAttendee && (
          <Text style={styles.feedSubtitle}>
            Get tickets to join the conversation
          </Text>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!feedQuery.hasNextPage) return null;
    
    return (
      <TouchableOpacity 
        style={styles.loadMoreButton}
        onPress={() => feedQuery.fetchNextPage()}
        disabled={feedQuery.isFetchingNextPage}
      >
        <Text style={styles.loadMoreText}>
          {feedQuery.isFetchingNextPage ? "Loading..." : "Load More"}
        </Text>
      </TouchableOpacity>
    );
  };

  const allFeedItems = feedQuery.data?.pages.flatMap(page => page.feed) || [];

  if (feedQuery.error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FeedErrorState onRetry={() => feedQuery.refetch()} />
      </SafeAreaView>
    );
  }

  if (allFeedItems.length === 0 && !feedQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FeedEmptyState 
          scope="event"
          onDiscoverPress={() => navigation.navigate("Discover")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={allFeedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={feedQuery.isRefetching}
            onRefresh={() => feedQuery.refetch()}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />

      {/* Post Composer - Only for attendees */}
      {isAttendee && (
        <PostComposerSheet
          visible={isComposerVisible}
          onClose={() => setIsComposerVisible(false)}
          onPostCreated={() => {
            setIsComposerVisible(false);
            feedQuery.refetch();
          }}
          preselectedEventId={eventId}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingBottom: 12,
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  attendeeBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  attendeeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  getTicketsButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  getTicketsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  feedHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  feedSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  feedContainer: {
    paddingBottom: 20,
  },
  loadMoreButton: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  loadMoreText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
});