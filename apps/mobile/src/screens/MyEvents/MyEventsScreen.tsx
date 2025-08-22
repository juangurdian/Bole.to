import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import EventCard from "./components/EventCard";
import CreateEventFAB from "./components/CreateEventFAB";

export type EventStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ENDED";

interface MyEventsScreenProps {
  navigation: any;
}

export default function MyEventsScreen({ navigation }: MyEventsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<EventStatus | "ALL">("ALL");
  const api = useApi();

  const eventsQuery = useQuery({
    queryKey: ["my-events"],
    queryFn: () => api.listMyEvents(),
  });

  const handleRefresh = () => {
    eventsQuery.refetch();
  };

  const handleCreateEvent = async () => {
    try {
      const result = await api.createEventDraft();
      navigation.navigate("EventEditorWizard", { 
        draftId: result.id,
        isNew: true 
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create event draft");
    }
  };

  const handleEventPress = (event: any) => {
    navigation.navigate("EventEditorWizard", { 
      draftId: event.id,
      isNew: false 
    });
  };

  const handleEventAction = async (action: string, event: any) => {
    switch (action) {
      case "edit":
        navigation.navigate("EventEditorWizard", { draftId: event.id });
        break;
      case "preview":
        navigation.navigate("EventPreviewScreen", { eventId: event.id });
        break;
      case "products":
        navigation.navigate("ProductEditorScreen", { eventId: event.id });
        break;
      case "checkin":
        navigation.navigate("CheckInListsScreen", { eventId: event.id });
        break;
      case "promote":
        navigation.navigate("PromoterToolsScreen", { eventId: event.id });
        break;
      case "duplicate":
        try {
          const result = await api.duplicateEvent(event.id);
          Alert.alert("Success", "Event duplicated successfully");
          eventsQuery.refetch();
        } catch (error) {
          Alert.alert("Error", "Failed to duplicate event");
        }
        break;
      case "share":
        Alert.alert("Share", `Public link: https://bole.to/events/${event.id}`);
        break;
      default:
        break;
    }
  };

  const getFilteredEvents = () => {
    const events = eventsQuery.data || [];
    if (selectedFilter === "ALL") return events;
    return events.filter(event => event.status === selectedFilter);
  };

  const getFilterCounts = () => {
    const events = eventsQuery.data || [];
    return {
      ALL: events.length,
      DRAFT: events.filter(e => e.status === "DRAFT").length,
      SCHEDULED: events.filter(e => e.status === "SCHEDULED").length,
      PUBLISHED: events.filter(e => e.status === "PUBLISHED").length,
      ENDED: events.filter(e => e.status === "ENDED").length,
    };
  };

  const filteredEvents = getFilteredEvents();
  const filterCounts = getFilterCounts();

  const renderFilterChip = (filter: EventStatus | "ALL", label: string) => {
    const count = filterCounts[filter];
    const isSelected = selectedFilter === filter;

    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          isSelected && styles.activeFilterChip,
          count === 0 && styles.disabledFilterChip
        ]}
        onPress={() => setSelectedFilter(filter)}
        disabled={count === 0}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.activeFilterChipText,
            count === 0 && styles.disabledFilterChipText
          ]}
        >
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }: { item: any }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      onAction={(action) => handleEventAction(action, item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🎫</Text>
      <Text style={styles.emptyTitle}>
        {selectedFilter === "ALL" 
          ? "You haven't created events yet"
          : `No ${selectedFilter.toLowerCase()} events`
        }
      </Text>
      <Text style={styles.emptyMessage}>
        {selectedFilter === "ALL"
          ? "Create your first event and start selling tickets"
          : `You don't have any ${selectedFilter.toLowerCase()} events right now`
        }
      </Text>
      {selectedFilter === "ALL" && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
          <Text style={styles.createButtonText}>✨ Create your first event</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (eventsQuery.isLoading) {
    return (
      <View style={styles.container}>
        {/* Filter chips skeleton */}
        <View style={styles.filtersContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.filterChipSkeleton} />
          ))}
        </View>
        
        {/* Events list skeleton */}
        <View style={styles.listContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.eventCardSkeleton} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        {renderFilterChip("ALL", "All")}
        {renderFilterChip("DRAFT", "Drafts")}
        {renderFilterChip("SCHEDULED", "Scheduled")}
        {renderFilterChip("PUBLISHED", "Live")}
        {renderFilterChip("ENDED", "Ended")}
      </View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={eventsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Create Event FAB */}
      <CreateEventFAB onPress={handleCreateEvent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeFilterChip: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  disabledFilterChip: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "white",
    fontWeight: "600",
  },
  disabledFilterChipText: {
    color: "#adb5bd",
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Skeleton styles
  filterChipSkeleton: {
    width: 80,
    height: 28,
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
  },
  eventCardSkeleton: {
    height: 120,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
  },
});