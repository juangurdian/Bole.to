import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";

export default function CaptureScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraEmoji}>📸</Text>
          <Text style={styles.cameraText}>Camera View</Text>
          <Text style={styles.cameraSubtext}>
            Camera integration would go here
          </Text>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Take Photo"
            onPress={() => {
              navigation.goBack();
            }}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  cameraText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
    marginBottom: 8,
  },
  cameraSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  actions: {
    gap: 12,
    paddingTop: 20,
  },
  cancelButton: {
    backgroundColor: "#333",
  },
});