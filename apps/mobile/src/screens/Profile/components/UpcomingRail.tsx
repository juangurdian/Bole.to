import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";

interface UpcomingRailProps {
  tickets: any[];
  navigation: any;
}

export default function UpcomingRail({ tickets, navigation }: UpcomingRailProps) {
  const renderTicketCard = ({ item }: { item: any }) => {
    const eventDate = new Date(item.eventDate);
    const now = new Date();
    const isToday = eventDate.toDateString() === now.toDateString();
    const isUpcoming = eventDate > now;

    const handlePress = () => {
      navigation.navigate("TicketDetail", { ticketId: item.id });
    };

    const handleEventPress = () => {
      navigation.navigate("EventScreen", { 
        eventId: item.eventId, 
        eventName: item.eventTitle 
      });
    };

    const formatDate = () => {
      if (isToday) return "Today";
      
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };
      return eventDate.toLocaleDateString("en-US", options);
    };

    const getTierColor = () => {
      switch (item.ticketTier?.toLowerCase()) {
        case "vip": return "#FFD700";
        case "premium": return "#FF6B6B";
        default: return "#007AFF";
      }
    };

    return (
      <TouchableOpacity style={styles.ticketCard} onPress={handlePress}>
        {/* Event Artwork Placeholder */}
        <View style={[styles.artwork, { backgroundColor: getTierColor() }]}>
          <Text style={styles.artworkText}>🎵</Text>
        </View>

        <View style={styles.ticketInfo}>
          <TouchableOpacity onPress={handleEventPress}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.eventTitle}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.venue} numberOfLines={1}>
            {item.venue}
          </Text>
          
          <View style={styles.dateRow}>
            <Text style={[styles.date, isToday && styles.todayDate]}>
              {formatDate()}
            </Text>
            {isToday && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Today!</Text>
              </View>
            )}
          </View>

          <View style={styles.tierRow}>
            <View style={[styles.tierBadge, { backgroundColor: getTierColor() }]}>
              <Text style={styles.tierText}>{item.ticketTier}</Text>
            </View>
            <Text style={styles.status}>
              {item.status === "confirmed" ? "✓ Confirmed" : item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={renderTicketCard}
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
  ticketCard: {
    width: 280,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  artwork: {
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  artworkText: {
    fontSize: 32,
  },
  ticketInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  todayDate: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  todayBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  tierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  status: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "500",
  },
});