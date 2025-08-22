import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";

export default function EventPickerScreen({ navigation }: any) {
  const api = useApi();
  const q = useQuery({ queryKey: ["events"], queryFn: api.listEvents });

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={80} />
          <Skeleton h={80} />
          <Skeleton h={80} />
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
        <EmptyState text="No events available" onRetry={() => q.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Event to Manage</Text>
        <Text style={styles.headerSubtitle}>Choose which event you'll be scanning tickets for</Text>
      </View>
      
      <FlatList
        data={data}
        keyExtractor={e => e.id}
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("SyncScreen", { eventId: item.id })}>
            <Card>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDetails}>
                {item.venue.name} · {item.venue.city}
              </Text>
              <Text style={styles.eventDate}>
                {new Date(item.startsAt).toLocaleDateString()}
              </Text>
              <View style={styles.staffBadge}>
                <Text style={styles.staffBadgeText}>👥 Staff Mode</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
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
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 8,
  },
  staffBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  staffBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
});