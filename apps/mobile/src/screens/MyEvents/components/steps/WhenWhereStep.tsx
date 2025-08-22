import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface WhenWhereStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export default function WhenWhereStep({ data, onUpdate }: WhenWhereStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>When & Where</Text>
      <Text style={styles.subtitle}>Date, time, and venue configuration</Text>
      <Text style={styles.placeholder}>🚧 Coming soon - Date/time pickers and venue setup</Text>
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