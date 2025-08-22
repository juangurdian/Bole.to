import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EventPreviewScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function EventPreviewScreen({ route, navigation }: EventPreviewScreenProps) {
  const { eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.title}>Event Preview</Text>
          <Text style={styles.subtitle}>Public buyer view</Text>
          <Text style={styles.eventId}>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            🎭 Coming soon - Mock public event page showing how buyers will see your event
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Event cover and details</Text>
            <Text style={styles.featureItem}>• Ticket tiers and pricing</Text>
            <Text style={styles.featureItem}>• Venue and date information</Text>
            <Text style={styles.featureItem}>• Social activity feed</Text>
            <Text style={styles.featureItem}>• Purchase flow simulation</Text>
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