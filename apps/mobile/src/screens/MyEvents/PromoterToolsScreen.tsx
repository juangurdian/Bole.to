import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PromoterToolsScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function PromoterToolsScreen({ route, navigation }: PromoterToolsScreenProps) {
  const { eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.title}>Promoter Tools</Text>
          <Text style={styles.subtitle}>Invite promoters and track performance</Text>
          <Text style={styles.eventId}>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            📢 Coming soon - Promoter management and tracking dashboard
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Generate unique referral links</Text>
            <Text style={styles.featureItem}>• Invite promoter partners</Text>
            <Text style={styles.featureItem}>• Track clicks and conversions</Text>
            <Text style={styles.featureItem}>• Revenue sharing setup</Text>
            <Text style={styles.featureItem}>• Real-time performance metrics</Text>
            <Text style={styles.featureItem}>• Promotional materials sharing</Text>
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