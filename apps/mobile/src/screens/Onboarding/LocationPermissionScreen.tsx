import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function LocationPermissionScreen({ navigation }: any) {
  const handleAllow = async () => {
    // Mock location permission request
    console.log("Requesting location permission");
    navigation.navigate("Home");
  };

  const handleSkip = () => {
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="map-pin" size={80} color="#000" />
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          Allow Bole.to to access your location to find events near you
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Discover events nearby</Text>
          </View>
          <View style={styles.feature}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Get directions to venues</Text>
          </View>
          <View style={styles.feature}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Personalized recommendations</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
          <Text style={styles.allowButtonText}>Allow Location Access</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Not Now</Text>
        </TouchableOpacity>

        <Text style={styles.privacyText}>
          Your location data is used only to enhance your experience and is never shared
          without your consent.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  features: {
    width: "100%",
    marginBottom: 40,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  allowButton: {
    width: "100%",
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  allowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  skipButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  privacyText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});