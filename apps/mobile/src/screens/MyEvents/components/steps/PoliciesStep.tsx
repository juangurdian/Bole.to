import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface PoliciesStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export default function PoliciesStep({ data, onUpdate }: PoliciesStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Policies & Settings</Text>
      <Text style={styles.subtitle}>Refunds, check-in, and privacy settings</Text>
      <Text style={styles.placeholder}>⚙️ Coming soon - Policy configuration and settings</Text>
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