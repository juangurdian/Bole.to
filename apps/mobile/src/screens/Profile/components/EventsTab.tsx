import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";

interface EventsTabProps {
  profile: any;
  showcase: any;
  isLoading: boolean;
  navigation: any;
}

export default function EventsTab({ profile, showcase, isLoading, navigation }: EventsTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<"upcoming" | "past">("upcoming");

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.filterSkeleton} />
          ))}
        </View>
        <View style={styles.contentSkeleton} />
      </View>
    );
  }

  const upcomingEvents = showcase?.upcoming || [];
  const pastEvents = showcase?.pastEvents?.filter(event => !event.isHiddenFromProfile) || [];
  
  const currentEvents = selectedFilter === "upcoming" ? upcomingEvents : pastEvents;

  const renderEventCard = ({ item }: { item: any }) => {
    const handlePress = () => {
      const eventId = item.eventId || item.id;
      const eventName = item.eventTitle || item.title;
      navigation.navigate("EventScreen", { eventId, eventName });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short", 
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    };

    const getTierColor = () => {
      const tier = (item.ticketTier || item.tier)?.toLowerCase();
      switch (tier) {
        case "vip": return "#FFD700";
        case "premium": return "#FF6B6B";
        default: return "#007AFF";
      }
    };

    return (
      <TouchableOpacity style={styles.eventCard} onPress={handlePress}>
        <View style={[styles.eventArtwork, { backgroundColor: getTierColor() }]}>
          <Text style={styles.artworkIcon}>🎵</Text>
        </View>
        
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventTitle || item.title}
          </Text>
          <Text style={styles.eventVenue} numberOfLines={1}>
            {item.venue}
          </Text>
          <Text style={styles.eventDate}>
            {formatDate(item.eventDate || item.date)}
          </Text>
          
          <View style={styles.eventFooter}>
            <View style={[styles.tierBadge, { backgroundColor: getTierColor() }]}>
              <Text style={styles.tierText}>
                {item.ticketTier || item.tier}
              </Text>
            </View>
            
            {profile?.privacy?.events !== "public" && (
              <Text style={styles.privacyHint}>
                {profile.privacy.events === "followers" ? "👥" : "🔒"}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isUpcoming = selectedFilter === "upcoming";
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          {isUpcoming ? "🎫" : "🕐"}
        </Text>
        <Text style={styles.emptyTitle}>
          {isUpcoming ? "No upcoming events" : "No past events yet"}
        </Text>
        <Text style={styles.emptyMessage}>
          {isUpcoming 
            ? "Get tickets to events to see them here."
            : "Your attended events will appear here."
          }
        </Text>
        {isUpcoming && (
          <TouchableOpacity 
            style={styles.discoverButton}
            onPress={() => navigation.navigate("Discover")}
          >
            <Text style={styles.discoverText}>Discover Events</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "upcoming" && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter("upcoming")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "upcoming" && styles.activeFilterText
            ]}
          >
            Upcoming ({upcomingEvents.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "past" && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter("past")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "past" && styles.activeFilterText
            ]}
          >
            Past ({pastEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {currentEvents.length > 0 ? (
        <FlatList
          data={currentEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id || item.eventId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeFilterTab: {
    borderBottomColor: "#007AFF",
  },
  filterText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  eventArtwork: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  artworkIcon: {
    fontSize: 24,
  },
  eventDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  privacyHint: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
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
  discoverButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Skeleton styles
  filterSkeleton: {
    flex: 1,
    height: 32,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  contentSkeleton: {
    flex: 1,
    margin: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
});