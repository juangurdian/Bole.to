import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MediaStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export default function MediaStep({ data, onUpdate }: MediaStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media & Branding</Text>
      <Text style={styles.subtitle}>Cover image, gallery, and theme</Text>
      <Text style={styles.placeholder}>🖼️ Coming soon - Image picker and theme customization</Text>
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