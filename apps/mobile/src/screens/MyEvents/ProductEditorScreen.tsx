import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProductEditorScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function ProductEditorScreen({ route, navigation }: ProductEditorScreenProps) {
  const { eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.title}>Manage Tickets</Text>
          <Text style={styles.subtitle}>Configure ticket tiers and pricing</Text>
          <Text style={styles.eventId}>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            🎫 Coming soon - Full ticket tier management system
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Add/edit/remove ticket tiers</Text>
            <Text style={styles.featureItem}>• Set pricing and capacity limits</Text>
            <Text style={styles.featureItem}>• Configure sales windows</Text>
            <Text style={styles.featureItem}>• Reorder tiers with drag & drop</Text>
            <Text style={styles.featureItem}>• Preview pricing for buyers</Text>
            <Text style={styles.featureItem}>• Service fee configuration</Text>
          </View>
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
    flexGrow: 1,
    justifyContent: "center",
  },
  placeholderContainer: {
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
    marginBottom: 16,
  },
  eventId: {
    fontSize: 14,
    color: "#999",
    marginBottom: 24,
    fontFamily: "monospace",
  },
  placeholder: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 32,
  },
  featureList: {
    alignItems: "flex-start",
  },
  featureItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
});