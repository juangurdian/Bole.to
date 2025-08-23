import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../../../theme";
import MyEventCard from "./MyEventCard";
import EmptyState from "./EmptyState";

interface MyEventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  coverUrl?: string;
  stats: { sold: number; revenue: number; checkins: number };
}

interface MyEventsListProps {
  items: MyEventSummary[];
  onEventPress?: (eventId: string) => void;
  onViewAllPress?: () => void;
}

export default function MyEventsList({
  items,
  onEventPress = () => {},
  onViewAllPress,
}: MyEventsListProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState 
        type="events"
        title="No events yet"
        subtitle="Create your first event to start earning"
        buttonText="Create Event"
        onButtonPress={onViewAllPress}
      />
    );
  }

  return (
    <View style={styles.container}>
      {items.map((event) => (
        <MyEventCard
          key={event.id}
          event={event}
          onPress={onEventPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
});