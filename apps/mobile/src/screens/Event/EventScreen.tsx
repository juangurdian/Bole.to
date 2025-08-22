import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function EventScreen({ route, navigation }: any) {
  const { id } = route.params;
  const api = useApi();
  const [selectedTiers, setSelectedTiers] = useState<{[key: string]: number}>({});
  
  const q = useQuery({ 
    queryKey: ["event", id], 
    queryFn: () => api.getEvent(id) 
  });

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={120} />
          <Skeleton h={80} />
          <Skeleton h={100} />
        </ScrollView>
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

  const event = q.data!;
  const tiers = event.tiers || [];

  const updateQuantity = (tierId: string, change: number) => {
    setSelectedTiers(prev => ({
      ...prev,
      [tierId]: Math.max(0, (prev[tierId] || 0) + change)
    }));
  };

  const proceedToCheckout = () => {
    const items = Object.entries(selectedTiers)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, qty]) => ({ tierId, qty }));
    
    if (items.length === 0) {
      alert("Please select at least one ticket");
      return;
    }
    
    navigation.navigate("CheckoutScreen", { eventId: id, items });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.venue}>{event.venue.name}, {event.venue.city}</Text>
          <Text style={styles.date}>
            {new Date(event.startsAt).toLocaleDateString()} at{" "}
            {new Date(event.startsAt).toLocaleTimeString()}
          </Text>
        </Card>

        {tiers.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Tickets</Text>
            {tiers.map(tier => (
              <View key={tier.id} style={styles.tierRow}>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>
                    ${tier.price.amount} {tier.price.currency}
                  </Text>
                  <Text style={styles.tierRemaining}>
                    {tier.remaining} remaining
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <Button
                    title="-"
                    onPress={() => updateQuantity(tier.id, -1)}
                  />
                  <Text style={styles.quantity}>
                    {selectedTiers[tier.id] || 0}
                  </Text>
                  <Button
                    title="+"
                    onPress={() => updateQuantity(tier.id, 1)}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Proceed to Checkout (Mock)"
            onPress={proceedToCheckout}
          />
        </View>
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  venue: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: "#007AFF",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600",
  },
  tierPrice: {
    fontSize: 14,
    color: "#007AFF",
  },
  tierRemaining: {
    fontSize: 12,
    color: "#888",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  actions: {
    padding: 16,
  },
});