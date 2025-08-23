import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../../../theme";
import SectionHeader from "../../Home/components/SectionHeader";
import TicketMini from "./TicketMini";

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

interface PastSectionProps {
  items: TicketSummary[];
  onTicketPress?: (ticketId: string) => void;
  onViewAllPress?: () => void;
}

export default function PastSection({
  items,
  onTicketPress = () => {},
  onViewAllPress,
}: PastSectionProps) {
  // Don't render if no past tickets
  if (!items || items.length === 0) {
    return null;
  }

  // Show max 5 past tickets
  const visibleItems = items.slice(0, 5);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Past"
        onSeeAll={items.length > 5 ? onViewAllPress : undefined}
      />

      <View style={styles.list}>
        {visibleItems.map((ticket) => (
          <TicketMini
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
  list: {
    // TicketMini components handle their own margins
  },
});