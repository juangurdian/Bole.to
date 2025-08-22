import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Card from "../../../components/Card";

interface HomeUpcomingWidgetProps {
  upcoming: any[];
  navigation: any;
}

export default function HomeUpcomingWidget({ upcoming, navigation }: HomeUpcomingWidgetProps) {
  if (!upcoming.length) {
    return (
      <Card style={styles.container}>
        <Text style={styles.sectionTitle}>Your Upcoming</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎪</Text>
          <Text style={styles.emptyText}>No upcoming plans—discover events near you</Text>
          <TouchableOpacity 
            style={styles.discoverButton}
            onPress={() => navigation.navigate("Discover")}
          >
            <Text style={styles.discoverButtonText}>Discover Events</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Upcoming</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Tickets")}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {upcoming.map((event: any, index: number) => (
          <TouchableOpacity 
            key={event.eventId}
            style={[styles.eventCard, index === 0 && styles.firstCard]}
            onPress={() => navigation.navigate("Discover", {
              screen: "EventScreen",
              params: { id: event.eventId }
            })}
          >
            <View style={styles.eventImage}>
              <Text style={styles.eventImagePlaceholder}>🎉</Text>
            </View>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventBadges}>
                {event.isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.badgeText}>Today</Text>
                  </View>
                )}
                {event.isTomorrow && (
                  <View style={styles.tomorrowBadge}>
                    <Text style={styles.badgeText}>Tomorrow</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.eventTitle}
              </Text>
              <Text style={styles.eventVenue} numberOfLines={1}>
                {event.venue?.name}
              </Text>
              <Text style={styles.eventDate}>
                {new Date(event.startsAt).toLocaleDateString()}
              </Text>
              
              <View style={styles.eventActions}>
                <TouchableOpacity 
                  style={styles.ticketButton}
                  onPress={() => navigation.navigate("Tickets", {
                    screen: "TicketScreen",
                    params: { id: `tk_${event.eventId}` }
                  })}
                >
                  <Text style={styles.ticketButtonText}>Open Ticket</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  carousel: {
    marginHorizontal: -8,
  },
  eventCard: {
    width: 200,
    marginHorizontal: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  firstCard: {
    marginLeft: 0,
  },
  eventImage: {
    height: 100,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  eventImagePlaceholder: {
    fontSize: 32,
  },
  eventDetails: {
    padding: 12,
  },
  eventBadges: {
    flexDirection: "row",
    marginBottom: 8,
  },
  todayBadge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  tomorrowBadge: {
    backgroundColor: "#ff9500",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
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
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 12,
  },
  eventActions: {
    alignItems: "center",
  },
  ticketButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  ticketButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  discoverButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});