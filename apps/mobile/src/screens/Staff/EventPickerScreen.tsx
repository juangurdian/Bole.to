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
  const q = useQuery({ 
    queryKey: ["staff-events"], 
    queryFn: api.getStaffEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  });

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
        renderItem={({ item }) => {
          const totalAttendees = item.checkInLists?.reduce((sum, list) => sum + list.attendeeCount, 0) || 0;
          const totalCheckedIn = item.checkInLists?.reduce((sum, list) => sum + list.checkedInCount, 0) || 0;
          const checkInPercentage = totalAttendees > 0 ? Math.round((totalCheckedIn / totalAttendees) * 100) : 0;
          
          return (
            <TouchableOpacity onPress={() => navigation.navigate("StaffCheckInListsScreen", { eventId: item.id, eventTitle: item.title })}>
              <Card>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={styles.staffBadge}>
                    <Text style={styles.staffBadgeText}>👥 Staff</Text>
                  </View>
                </View>
                
                <Text style={styles.eventDetails}>
                  {item.venue.name} · {item.venue.city}
                </Text>
                
                <Text style={styles.eventDate}>
                  {new Date(item.startsAt).toLocaleDateString()} at {new Date(item.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalCheckedIn}</Text>
                    <Text style={styles.statLabel}>Checked In</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalAttendees}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{checkInPercentage}%</Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                </View>
                
                {item.checkInLists && item.checkInLists.length > 0 && (
                  <View style={styles.checkInListsPreview}>
                    <Text style={styles.checkInListsLabel}>Check-in Lists:</Text>
                    {item.checkInLists.map((list, index) => (
                      <Text key={list.id} style={styles.checkInListItem}>
                        • {list.name} ({list.checkedInCount}/{list.attendeeCount})
                      </Text>
                    ))}
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          );
        }}
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
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
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
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  staffBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  checkInListsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  checkInListsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  checkInListItem: {
    fontSize: 12,
    color: "#444",
    marginBottom: 2,
  },
});