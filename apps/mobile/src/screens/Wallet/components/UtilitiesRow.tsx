import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function UtilitiesRow() {
  const handleAddToWallet = () => {
    Alert.alert("Add to Wallet", "This feature will be available soon!");
  };

  const handleShare = () => {
    Alert.alert("Share", "This feature will be available soon!");
  };

  const handleSettings = () => {
    Alert.alert("Settings", "This feature will be available soon!");
  };

  const handleHelp = () => {
    Alert.alert("Help", "Need help with your tickets? Contact support!");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.utilityButton} onPress={handleAddToWallet}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>
        <Text style={styles.label}>Add to Wallet</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.utilityButton} onPress={handleShare}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📤</Text>
        </View>
        <Text style={styles.label}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.utilityButton} onPress={handleSettings}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚙️</Text>
        </View>
        <Text style={styles.label}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.utilityButton} onPress={handleHelp}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>❓</Text>
        </View>
        <Text style={styles.label}>Help</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1A1A1A",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  utilityButton: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
    color: "#CCC",
    fontWeight: "500",
    textAlign: "center",
  },
});