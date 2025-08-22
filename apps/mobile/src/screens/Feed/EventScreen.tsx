import React, { useState } from "react";
import { 
  View, 
  ScrollView,
  StyleSheet, 
  RefreshControl 
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import EventHeader from "./components/EventHeader";
import EventMeta from "./components/EventMeta";
import EventDescription from "./components/EventDescription";
import TicketsModule from "./components/TicketsModule";
import VenueCard from "./components/VenueCard";
import AttendeesRail from "./components/AttendeesRail";
import FeedPreview from "./components/FeedPreview";
import GalleryTeaser from "./components/GalleryTeaser";
import PoliciesSummary from "./components/PoliciesSummary";
import ActionBar from "./components/ActionBar";
import TicketSelectorSheet from "./components/TicketSelectorSheet";

interface EventScreenProps {
  route: {
    params: {
      eventId: string;
      eventName: string;
    };
  };
  navigation: any;
}

export default function EventScreen({ route, navigation }: EventScreenProps) {
  const { eventId, eventName } = route.params;
  const [isTicketSelectorVisible, setIsTicketSelectorVisible] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
  const [userHasTicket, setUserHasTicket] = useState(false);
  const api = useApi();

  const eventQuery = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: () => api.getEventDetail(eventId),
  });

  const handleRefresh = () => {
    eventQuery.refetch();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Handle share
  };

  const handleSave = async () => {
    if (!eventQuery.data) return;
    try {
      await api.toggleEventFollow(eventId);
      eventQuery.refetch();
    } catch (error) {
      // Handle error
    }
  };

  const handleOpenMap = () => {
    // Open map/directions
  };

  const handleOpenOrganizer = () => {
    // Navigate to organizer profile
  };

  const handleSelectTier = (tierId: string) => {
    setIsTicketSelectorVisible(true);
  };

  const handleBuyTickets = async () => {
    if (Object.keys(selectedTiers).length === 0) {
      setIsTicketSelectorVisible(true);
      return;
    }

    try {
      const tierItems = Object.entries(selectedTiers).map(([tierId, quantity]) => ({
        tierId,
        quantity
      }));
      
      const result = await api.createOrderMock(eventId, tierItems);
      if (result.hasTicket) {
        setUserHasTicket(true);
        eventQuery.refetch();
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleOpenTicket = () => {
    navigation.navigate("TicketScreen", { ticketId: eventId });
  };

  const handleRemindMe = async () => {
    try {
      await api.setEventReminder(eventId, true);
    } catch (error) {
      // Handle error
    }
  };

  const event = eventQuery.data;
  const isAttendee = userHasTicket || event?.you?.hasTicket;

  if (eventQuery.isLoading) {
    return (
      <View style={styles.container}>
        {/* Loading skeletons would go here */}
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        {/* Error state would go here */}
      </View>
    );
  }

  const totalPrice = Object.entries(selectedTiers).reduce((total, [tierId, quantity]) => {
    const tier = event.pricing.tiers.find(t => t.id === tierId);
    return total + (tier?.price || 0) * quantity;
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={eventQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <EventHeader
          event={event}
          onBack={handleBack}
          onShare={handleShare}
          onSave={handleSave}
        />
        
        <EventMeta
          event={event}
          onOpenMap={handleOpenMap}
          onOpenOrganizer={handleOpenOrganizer}
        />
        
        <EventDescription description={event.description} />
        
        {!isAttendee && (
          <TicketsModule
            pricing={event.pricing}
            onSelectTier={handleSelectTier}
          />
        )}
        
        <VenueCard venue={event.venue} onOpenMaps={handleOpenMap} />
        
        <AttendeesRail
          attendees={event.attendees}
          totalCount={event.stats.goingCount}
          mode={isAttendee ? "attendee" : "visitor"}
        />
        
        <FeedPreview
          items={event.feedPreview}
          mode={isAttendee ? "attendee" : "visitor"}
          onOpen={() => {/* Navigate to full feed */}}
        />
        
        <GalleryTeaser
          photos={event.galleryPreview}
          revealAt={event.camera.revealAtISO}
          onOpen={() => {/* Navigate to gallery */}}
        />
        
        <PoliciesSummary
          policies={event.policies}
          onOpen={() => {/* Navigate to policies */}}
        />
        
        {/* Bottom padding for sticky bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Sticky Action Bar */}
      <ActionBar
        event={event}
        isAttendee={isAttendee}
        totalPrice={totalPrice}
        onBuyTickets={handleBuyTickets}
        onOpenTicket={handleOpenTicket}
        onRemindMe={handleRemindMe}
        onShare={handleShare}
      />

      {/* Ticket Selector Sheet */}
      <TicketSelectorSheet
        visible={isTicketSelectorVisible}
        tiers={event.pricing.tiers.filter(t => !t.soldOut && t.active !== false)}
        selectedTiers={selectedTiers}
        onChangeQuantity={(tierId, quantity) => {
          setSelectedTiers(prev => ({ ...prev, [tierId]: quantity }));
        }}
        onClose={() => setIsTicketSelectorVisible(false)}
        onCheckout={handleBuyTickets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: 100, // Space for sticky action bar
  },
});