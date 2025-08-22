import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "./Button";

interface EmptyStateProps {
  text: string;
  onRetry?: () => void;
}

export default function EmptyState({ text, onRetry }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      {onRetry && (
        <Button title="Retry" onPress={onRetry} />
      )}
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
  text: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
});