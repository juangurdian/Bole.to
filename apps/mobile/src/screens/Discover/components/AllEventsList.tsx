import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import EventCard from "./EventCard";
import Skeleton from "../../../components/Skeleton";
import Button from "../../../components/Button";
import { theme } from "../../../theme";

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
    backgroundColor: theme.colors.bg,
    paddingTop: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  loadMoreButton: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.xxl,
  },
  endText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  errorContainer: {
    padding: theme.spacing.xxl,
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.xxl,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
    marginBottom: theme.spacing.xl,
  },
  clearFiltersButton: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: theme.spacing.xxl,
  },
});