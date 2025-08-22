import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";

export default function WalletScreen({ navigation }: any) {
  const api = useApi();
  const q = useQuery({ queryKey: ["my-tickets"], queryFn: api.listMyTickets });

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={100} />
          <Skeleton h={100} />
          <Skeleton h={100} />
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
  
  if (!data.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState 
          text="No tickets yet" 
          onRetry={() => q.refetch()}
        />
      </SafeAreaView>
    );
  }

  const renderTicket = ({ item }: any) => {
    const isValid = item.status === "valid";
    const isUsed = item.status === "used";
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate("TicketScreen", { id: item.id })}
        style={[
          styles.ticketCard,
          !isValid && styles.ticketCardInvalid
        ]}
      >
        <Card>
          <View style={styles.ticketHeader}>
            <Text style={styles.eventTitle}>{item.event.title}</Text>
            <View style={[
              styles.statusBadge,
              isValid && styles.statusValid,
              isUsed && styles.statusUsed,
              !isValid && !isUsed && styles.statusInvalid
            ]}>
              <Text style={[
                styles.statusText,
                isValid && styles.statusTextValid
              ]}>
                {isValid ? "VALID" : isUsed ? "USED" : "INVALID"}
              </Text>
            </View>
          </View>
          
          <Text style={styles.venue}>
            {item.event.venue.name} · {item.event.venue.city}
          </Text>
          
          <Text style={styles.date}>
            {new Date(item.event.startsAt).toLocaleDateString()} at{" "}
            {new Date(item.event.startsAt).toLocaleTimeString()}
          </Text>
          
          <View style={styles.ticketDetails}>
            <Text style={styles.tierName}>{item.tier.name}</Text>
            <Text style={styles.ticketId}>#{item.id.slice(-8)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        renderItem={renderTicket}
        showsVerticalScrollIndicator={false}
      />
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
  ticketCard: {
    marginBottom: 8,
  },
  ticketCardInvalid: {
    opacity: 0.6,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  statusValid: {
    backgroundColor: "#d4edda",
  },
  statusUsed: {
    backgroundColor: "#fff3cd",
  },
  statusInvalid: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  statusTextValid: {
    color: "#155724",
  },
  venue: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 12,
  },
  ticketDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  tierName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  ticketId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
});