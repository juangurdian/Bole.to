import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../../theme";
import SectionHeader from "../../Home/components/SectionHeader";
import TicketCard from "./TicketCard";
import EmptyState from "./EmptyState";

interface TicketSummary {
  id: string;
  eventId: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  coverUrl?: string;
  seatInfo?: string;
  hasQr: boolean;
  photosReleased?: boolean;
}

interface UpcomingSectionProps {
  items: TicketSummary[];
  onTicketPress?: (ticketId: string) => void;
  onViewAllPress?: () => void;
}

export default function UpcomingSection({
  items,
  onTicketPress = () => {},
  onViewAllPress,
}: UpcomingSectionProps) {
  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Upcoming" />
        <EmptyState 
          type="tickets"
          title="No upcoming tickets"
          subtitle="Discover events and get your tickets"
          buttonText="Discover Events"
          onButtonPress={onViewAllPress}
        />
      </View>
    );
  }

  // Show max 6 tickets in grid (2 columns)
  const visibleItems = items.slice(0, 6);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Upcoming"
        onSeeAll={items.length > 6 ? onViewAllPress : undefined}
      />

      <View style={styles.grid}>
        {visibleItems.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onPress={onTicketPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    gap: "2%",
  },
});