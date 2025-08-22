import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CheckInListsScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function CheckInListsScreen({ route, navigation }: CheckInListsScreenProps) {
  const { eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.title}>Check-in Lists</Text>
          <Text style={styles.subtitle}>Manage event entry and scanning</Text>
          <Text style={styles.eventId}>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            📋 Coming soon - Check-in list management and scanner integration
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Create multiple check-in lists</Text>
            <Text style={styles.featureItem}>• Generate short codes for staff</Text>
            <Text style={styles.featureItem}>• Real-time entry tracking</Text>
            <Text style={styles.featureItem}>• Scanner app integration</Text>
            <Text style={styles.featureItem}>• Capacity monitoring</Text>
            <Text style={styles.featureItem}>• Export attendee reports</Text>
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