import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
} from "react-native";
import { theme } from "../../../theme";
import SectionHeader from "./SectionHeader";
import EventWideCard from "./EventWideCard";

interface EventSummary {
  id: string;
  title: string;
  startsAt: string;
  venue: {
    name: string;
    city: string;
  };
  coverUrl?: string;
  tiers?: Array<{
    price: {
      amount: number;
    };
  }>;
}

interface EventsNearYouSectionProps {
  items: EventSummary[];
  onEventPress?: (eventId: string) => void;
  onSeeAll?: () => void;
}

export default function EventsNearYouSection({ 
  items, 
  onEventPress = () => {}, 
  onSeeAll 
}: EventsNearYouSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const renderEventCard = ({ item }: { item: EventSummary }) => (
    <EventWideCard
      event={item}
      onPress={onEventPress}
    />
  );

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Events Near You" 
        onSeeAll={onSeeAll}
      />
      
      <FlatList
        data={items}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.dimensions.sectionGap,
  },
  listContent: {
    paddingHorizontal: theme.dimensions.screenPadding,
  },
});