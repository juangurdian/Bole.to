import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";

interface PinnedEventsProps {
  pinnedEventIds: string[];
  pastEvents: any[];
  navigation: any;
}

export default function PinnedEvents({ pinnedEventIds, pastEvents, navigation }: PinnedEventsProps) {
  const pinnedEvents = pastEvents?.filter(event => 
    pinnedEventIds.includes(event.id) && !event.isHiddenFromProfile
  ) || [];

  if (pinnedEvents.length === 0) return null;

  const renderPinnedEvent = ({ item }: { item: any }) => {
    const handlePress = () => {
      navigation.navigate("EventScreen", { 
        eventId: item.id, 
        eventName: item.title 
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    };

    const getTierColor = () => {
      switch (item.tier?.toLowerCase()) {
        case "vip": return "#FFD700";
        case "premium": return "#FF6B6B";
        default: return "#007AFF";
      }
    };

    return (
      <TouchableOpacity style={styles.eventCard} onPress={handlePress}>
        {/* Pin Icon */}
        <View style={styles.pinIcon}>
          <Text style={styles.pinText}>📌</Text>
        </View>

        {/* Event Artwork Placeholder */}
        <View style={[styles.artwork, { backgroundColor: getTierColor() }]}>
          <Text style={styles.artworkText}>🎵</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.venue} numberOfLines={1}>
            {item.venue}
          </Text>
          
          <Text style={styles.date}>
            {formatDate(item.date)}
          </Text>

          <View style={[styles.tierBadge, { backgroundColor: getTierColor() }]}>
            <Text style={styles.tierText}>{item.tier}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pinnedEvents}
        renderItem={renderPinnedEvent}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
  },
  rail: {
    paddingRight: 16,
  },
  separator: {
    width: 12,
  },
  eventCard: {
    width: 200,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    position: "relative",
  },
  pinIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  pinText: {
    fontSize: 12,
  },
  artwork: {
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  artworkText: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  venue: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
});