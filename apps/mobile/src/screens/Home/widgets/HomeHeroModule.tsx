import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Card from "../../../components/Card";
import Button from "../../../components/Button";

interface HomeHeroModuleProps {
  hasUpcomingWithin7Days: boolean;
  nextEvent?: any;
  city: string | null;
  navigation: any;
}

export default function HomeHeroModule({ 
  hasUpcomingWithin7Days, 
  nextEvent, 
  city, 
  navigation 
}: HomeHeroModuleProps) {
  
  if (hasUpcomingWithin7Days && nextEvent) {
    // "Your next event" card
    const hoursUntil = nextEvent.hoursUntil;
    const isToday = nextEvent.isToday;
    const isTomorrow = nextEvent.isTomorrow;
    
    let countdownText = "";
    if (isToday) {
      countdownText = hoursUntil > 0 ? `in ${hoursUntil}h` : "Starting soon!";
    } else if (isTomorrow) {
      countdownText = "Tomorrow";
    } else {
      const days = Math.ceil(hoursUntil / 24);
      countdownText = `in ${days} day${days > 1 ? 's' : ''}`;
    }

    return (
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroImage}>
            <Text style={styles.heroImagePlaceholder}>🎉</Text>
          </View>
          
          <View style={styles.heroDetails}>
            <Text style={styles.heroLabel}>Your next event</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {nextEvent.eventTitle}
            </Text>
            <Text style={styles.heroVenue}>
              {nextEvent.venue?.name} • {nextEvent.venue?.city}
            </Text>
            
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownEmoji}>⏰</Text>
              <Text style={styles.countdownText}>{countdownText}</Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
            </View>
            
            <View style={styles.heroActions}>
              <Button
                title="Open Ticket"
                onPress={() => navigation.navigate("Tickets", { 
                  screen: "TicketScreen", 
                  params: { id: `tk_${nextEvent.eventId}` } 
                })}
                style={styles.primaryButton}
              />
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("Discover", {
                  screen: "EventScreen",
                  params: { id: nextEvent.eventId }
                })}
              >
                <Text style={styles.secondaryButtonText}>Event Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  // "Discover tonight" hero
  return (
    <Card style={styles.heroCard}>
      <View style={styles.discoverHero}>
        <Text style={styles.discoverTitle}>
          Discover tonight in {city || "your city"}
        </Text>
        <Text style={styles.discoverSubtitle}>
          Find the perfect event for you
        </Text>
        
        <View style={styles.categoryChips}>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryEmoji}>🎵</Text>
            <Text style={styles.categoryText}>Music</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryEmoji}>🎉</Text>
            <Text style={styles.categoryText}>Parties</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryChip}>
            <Text style={styles.categoryEmoji}>⚽</Text>
            <Text style={styles.categoryText}>Sports</Text>
          </TouchableOpacity>
        </View>
        
        <Button
          title="Explore Events"
          onPress={() => navigation.navigate("Discover")}
          style={styles.exploreButton}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  heroImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  heroImagePlaceholder: {
    fontSize: 32,
  },
  heroDetails: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  heroVenue: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  countdownEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginRight: 8,
  },
  todayBadge: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  heroActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  discoverHero: {
    alignItems: "center",
    paddingVertical: 20,
  },
  discoverTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  discoverSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  categoryChips: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  exploreButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
  },
});