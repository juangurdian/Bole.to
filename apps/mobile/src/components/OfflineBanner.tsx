import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { mockToggles } from "../mocks/toggles";

export default function OfflineBanner() {
  if (!mockToggles.offline) return null;
  
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 Offline Mode - Using cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#ff9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});