import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import EventCard from "./EventCard";
import Skeleton from "../../../components/Skeleton";

interface DiscoverSectionsProps {
  sections: {
    trending: any[];
    tonight: any[];
    weekend: any[];
    justAnnounced: any[];
  };
  city: string;
  onEventPress: (eventId: string) => void;
  isLoading: boolean;
}

export default function DiscoverSections({
  sections,
  city,
  onEventPress,
  isLoading
}: DiscoverSectionsProps) {
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton h={200} />
        <Skeleton h={200} />
      </View>
    );
  }

  const renderSection = (
    title: string,
    events: any[],
    showEmptyState = false
  ) => {
    if (!events.length && !showEmptyState) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        
        {events.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={onEventPress}
                size="medium"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No events found for this category</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Trending Section */}
      {renderSection(`Trending in ${city}`, sections.trending, true)}
      
      {/* Tonight Section */}
      {sections.tonight.length > 0 && 
        renderSection("Tonight", sections.tonight)
      }
      
      {/* Weekend Section */}
      {sections.weekend.length > 0 && 
        renderSection("This Weekend", sections.weekend)
      }
      
      {/* Just Announced Section */}
      {sections.justAnnounced.length > 0 && 
        renderSection("Just Announced", sections.justAnnounced)
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingTop: 16,
  },
  loadingContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  horizontalList: {
    paddingHorizontal: 8,
  },
  emptySection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});