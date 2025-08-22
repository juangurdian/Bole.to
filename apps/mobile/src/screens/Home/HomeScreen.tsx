import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const api = useApi();
  
  const eventsQuery = useQuery({ 
    queryKey: ["events"], 
    queryFn: api.listEvents 
  });
  
  const ticketsQuery = useQuery({ 
    queryKey: ["my-tickets"], 
    queryFn: api.listMyTickets 
  });

  if (eventsQuery.isLoading || ticketsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={80} />
          <Skeleton h={120} />
          <Skeleton h={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const upcomingEvents = eventsQuery.data?.slice(0, 3) || [];
  const myTickets = ticketsQuery.data?.slice(0, 2) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <View style={styles.welcome}>
            <Text style={styles.welcomeEmoji}>👋</Text>
            <Text style={styles.welcomeTitle}>Welcome back, {user?.name || "User"}!</Text>
            <Text style={styles.welcomeSubtitle}>
              Discover amazing events and manage your tickets
            </Text>
          </View>
        </Card>

        {myTickets.length > 0 && (
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Upcoming Tickets</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Tickets")}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {myTickets.map((ticket: any) => (
              <TouchableOpacity 
                key={ticket.id}
                style={styles.ticketPreview}
                onPress={() => navigation.navigate("Tickets", { 
                  screen: "TicketScreen", 
                  params: { id: ticket.id } 
                })}
              >
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketEvent}>{ticket.event?.title || "Event"}</Text>
                  <Text style={styles.ticketDetails}>
                    {ticket.event?.venue?.name || "Venue"} • {ticket.tier?.name || "General"}
                  </Text>
                  <Text style={styles.ticketDate}>
                    {ticket.event?.startsAt ? new Date(ticket.event.startsAt).toLocaleDateString() : "TBD"}
                  </Text>
                </View>
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeText}>🎫</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Discover")}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingEvents.map((event: any) => (
            <TouchableOpacity 
              key={event.id}
              style={styles.eventPreview}
              onPress={() => navigation.navigate("Discover", { 
                screen: "EventScreen", 
                params: { id: event.id } 
              })}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDetails}>
                  {event.venue?.name} • {event.venue?.city}
                </Text>
                <Text style={styles.eventDate}>
                  {new Date(event.startsAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <Card>
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("Discover")}
              >
                <Text style={styles.actionEmoji}>🔍</Text>
                <Text style={styles.actionText}>Browse Events</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("Feed")}
              >
                <Text style={styles.actionEmoji}>💬</Text>
                <Text style={styles.actionText}>Event Feed</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("Tickets")}
              >
                <Text style={styles.actionEmoji}>🎫</Text>
                <Text style={styles.actionText}>My Tickets</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("Profile")}
              >
                <Text style={styles.actionEmoji}>⚙️</Text>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {eventsQuery.isError && (
          <ErrorState onRetry={() => eventsQuery.refetch()} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  welcome: {
    alignItems: "center",
    paddingVertical: 20,
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  sectionHeader: {
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
  sectionLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  ticketPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ticketInfo: {
    flex: 1,
  },
  ticketEvent: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ticketDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  ticketDate: {
    fontSize: 14,
    color: "#007AFF",
  },
  ticketBadge: {
    padding: 8,
  },
  ticketBadgeText: {
    fontSize: 20,
  },
  eventPreview: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: "#007AFF",
  },
  quickActions: {
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
});