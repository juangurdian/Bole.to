import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import EventCard from "./EventCard";
import Skeleton from "../../../components/Skeleton";
import Button from "../../../components/Button";

interface AllEventsListProps {
  events: any[];
  isLoading: boolean;
  isError: boolean;
  hasFilters: boolean;
  onEventPress: (eventId: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export default function AllEventsList({
  events,
  isLoading,
  isError,
  hasFilters,
  onEventPress,
  onRetry,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage
}: AllEventsListProps) {

  const renderEvent = ({ item }: { item: any }) => (
    <EventCard
      event={item}
      onPress={onEventPress}
      size="large"
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>All Events</Text>
      <Text style={styles.headerSubtitle}>
        {events.length} event{events.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <Skeleton h={160} />
        </View>
      );
    }

    if (hasNextPage) {
      return (
        <View style={styles.footer}>
          <Button
            title="Load More Events"
            onPress={onLoadMore}
            style={styles.loadMoreButton}
          />
        </View>
      );
    }

    if (events.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.endText}>
            🎉 You've seen all events!
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Skeleton h={160} />
          <Skeleton h={160} />
          <Skeleton h={160} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            We couldn't load the events. Please try again.
          </Text>
          <Button
            title="Try Again"
            onPress={onRetry}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>No events found</Text>
        <Text style={styles.emptyText}>
          {hasFilters 
            ? "Try adjusting your filters to see more events"
            : "Check back later for new events in your area"
          }
        </Text>
        {hasFilters && (
          <Button
            title="Clear Filters"
            onPress={() => {}}
            style={styles.clearFiltersButton}
          />
        )}
      </View>
    );
  };

  if (!events.length) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false} // Handled by parent ScrollView
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
  },
  endText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 16,
    gap: 16,
  },
  errorContainer: {
    padding: 32,
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
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
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
  },
});