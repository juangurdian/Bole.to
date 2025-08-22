import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "./Button";

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export default function ErrorState({ onRetry, message = "Something went wrong" }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} />
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
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
  },
});