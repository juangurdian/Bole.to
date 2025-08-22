import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface TicketsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export default function TicketsStep({ data, onUpdate }: TicketsStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tickets & Pricing</Text>
      <Text style={styles.subtitle}>Configure ticket tiers and pricing</Text>
      <Text style={styles.placeholder}>🎫 Coming soon - Ticket tier editor with pricing and capacity</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  placeholder: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
});