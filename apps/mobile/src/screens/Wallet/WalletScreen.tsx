import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import NextEventHero from "./components/NextEventHero";
import TicketCard from "./components/TicketCard";
import UtilitiesRow from "./components/UtilitiesRow";

export default function WalletScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming");
  const api = useApi();
  const q = useQuery({ queryKey: ["my-tickets"], queryFn: api.listMyTickets });

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton h={200} />
          <Skeleton h={150} />
          <Skeleton h={150} />
        </View>
      </SafeAreaView>
    );
  }

  if (q.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => q.refetch()} />
      </SafeAreaView>
    );
  }

  const data = q.data ?? [];
  const now = new Date();
  
  const upcomingTickets = data.filter(ticket => 
    new Date(ticket.event.startsAt) > now && ticket.status === "valid"
  );
  const pastTickets = data.filter(ticket => 
    new Date(ticket.event.startsAt) <= now || ticket.status === "used"
  );

  const nextEvent = upcomingTickets.length > 0 ? upcomingTickets[0] : null;
  const displayTickets = selectedTab === "upcoming" ? upcomingTickets : pastTickets;

  const renderSegmentedControl = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          selectedTab === "upcoming" && styles.segmentButtonActive
        ]}
        onPress={() => setSelectedTab("upcoming")}
      >
        <Text style={[
          styles.segmentText,
          selectedTab === "upcoming" && styles.segmentTextActive
        ]}>
          Upcoming ({upcomingTickets.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          selectedTab === "past" && styles.segmentButtonActive
        ]}
        onPress={() => setSelectedTab("past")}
      >
        <Text style={[
          styles.segmentText,
          selectedTab === "past" && styles.segmentTextActive
        ]}>
          Past ({pastTickets.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTicket = ({ item }: any) => (
    <TicketCard
      ticket={item}
      onPress={() => navigation.navigate("TicketScreen", { id: item.id })}
      isPast={selectedTab === "past"}
    />
  );

  const renderEmpty = () => {
    const isUpcoming = selectedTab === "upcoming";
    return (
      <EmptyState 
        text={isUpcoming ? "No upcoming tickets" : "No past tickets yet"}
        onRetry={() => q.refetch()}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Next Event Hero - only show if there are upcoming tickets */}
        {nextEvent && selectedTab === "upcoming" && (
          <NextEventHero 
            ticket={nextEvent}
            onPress={() => navigation.navigate("TicketScreen", { id: nextEvent.id })}
          />
        )}

        {/* Utilities Row */}
        <UtilitiesRow />

        {/* Segmented Control */}
        {renderSegmentedControl()}

        {/* Tickets List */}
        <View style={styles.ticketsContainer}>
          {displayTickets.length === 0 ? (
            renderEmpty()
          ) : (
            displayTickets.map((ticket, index) => (
              <View key={ticket.id} style={styles.ticketItem}>
                {renderTicket({ item: ticket })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    gap: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  segmentTextActive: {
    color: "white",
  },
  ticketsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  ticketItem: {
    marginBottom: 16,
  },
});