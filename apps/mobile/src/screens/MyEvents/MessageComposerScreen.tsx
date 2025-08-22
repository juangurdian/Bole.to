import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MessageComposerScreenProps {
  route: {
    params: {
      eventId: string;
    };
  };
  navigation: any;
}

export default function MessageComposerScreen({ route, navigation }: MessageComposerScreenProps) {
  const { eventId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.title}>Send Message</Text>
          <Text style={styles.subtitle}>Communicate with your attendees</Text>
          <Text style={styles.eventId}>Event ID: {eventId}</Text>
          <Text style={styles.placeholder}>
            💬 Coming soon - Attendee messaging and announcement system
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Send announcements to all attendees</Text>
            <Text style={styles.featureItem}>• Target specific ticket tiers</Text>
            <Text style={styles.featureItem}>• Rich text formatting</Text>
            <Text style={styles.featureItem}>• Image and media attachments</Text>
            <Text style={styles.featureItem}>• Schedule messages for later</Text>
            <Text style={styles.featureItem}>• Track message delivery and reads</Text>
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