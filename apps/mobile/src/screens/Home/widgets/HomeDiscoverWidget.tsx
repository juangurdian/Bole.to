import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Card from "../../../components/Card";

interface HomeDiscoverWidgetProps {
  discover: {
    trending: any[];
    tonight: any[];
    justAnnounced: any[];
  };
  city: string | null;
  navigation: any;
}

export default function HomeDiscoverWidget({ discover, city, navigation }: HomeDiscoverWidgetProps) {
  const renderEventCard = (event: any) => (
    <TouchableOpacity 
      key={event.id}
      style={styles.eventCard}
      onPress={() => navigation.navigate("Discover", {
        screen: "EventScreen",
        params: { id: event.id }
      })}
    >
      <View style={styles.eventImage}>
        <Text style={styles.eventImagePlaceholder}>🎪</Text>
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventBadges}>
          {event.isTonight && (
            <View style={styles.tonightBadge}>
              <Text style={styles.badgeText}>Tonight</Text>
            </View>
          )}
          {event.isFree && (
            <View style={styles.freeBadge}>
              <Text style={styles.badgeText}>Free</Text>
            </View>
          )}
          {event.isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.badgeText}>Low stock</Text>
            </View>
          )}
          {event.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventVenue} numberOfLines={1}>
          {event.venue?.name}
        </Text>
        <Text style={styles.eventPrice}>
          {event.isFree ? "Free" : `From $${event.priceFrom}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, events: any[], viewAllFilter?: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Discover")}>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsList}>
        {events.map(renderEventCard)}
      </ScrollView>
    </View>
  );

  return (
    <Card style={styles.container}>
      <Text style={styles.mainTitle}>Discover Near You</Text>
      
      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
        <View style={styles.chips}>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Tonight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>This weekend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Free</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>VIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>🎵 Music</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>🎉 Parties</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Discovery Lists */}
      {renderSection(`Trending in ${city || "your city"}`, discover.trending)}
      {discover.tonight.length > 0 && renderSection("Tonight", discover.tonight)}
      {renderSection("Just Announced", discover.justAnnounced)}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  chipsContainer: {
    marginBottom: 20,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  eventsList: {
    marginHorizontal: -8,
  },
  eventCard: {
    width: 160,
    marginHorizontal: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  eventImage: {
    height: 90,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImagePlaceholder: {
    fontSize: 28,
  },
  eventInfo: {
    padding: 12,
  },
  eventBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 4,
  },
  tonightBadge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freeBadge: {
    backgroundColor: "#34c759",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lowStockBadge: {
    backgroundColor: "#ff9500",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  eventPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
});