import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function ScannerScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const [scanning, setScanning] = useState(false);

  const startScanning = () => {
    setScanning(true);
    
    setTimeout(() => {
      setScanning(false);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>📱</Text>
            <Text style={styles.title}>QR Code Scanner</Text>
            <Text style={styles.subtitle}>
              Scan ticket QR codes to validate entry
            </Text>
          </View>
        </Card>

        <View style={styles.scannerArea}>
          <View style={styles.scannerPlaceholder}>
            {scanning ? (
              <>
                <Text style={styles.scannerEmoji}>🔍</Text>
                <Text style={styles.scannerText}>Scanning...</Text>
              </>
            ) : (
              <>
                <Text style={styles.scannerEmoji}>📷</Text>
                <Text style={styles.scannerText}>Camera Scanner</Text>
                <Text style={styles.scannerSubtext}>
                  QR code scanning would be active here
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={scanning ? "Scanning..." : "Start Scanner"}
            onPress={startScanning}
            loading={scanning}
          />
          
          <Button
            title="Manual Lookup"
            onPress={() => navigation.navigate("ManualLookupScreen", { eventId })}
            style={styles.manualButton}
          />
        </View>

        <Card>
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Demo Scanner</Text>
            <Text style={styles.mockDescription}>
              In a real implementation, this would use the device camera to scan QR codes and validate tickets offline.
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
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
    textAlign: "center",
    lineHeight: 22,
  },
  scannerArea: {
    flex: 1,
    marginVertical: 20,
  },
  scannerPlaceholder: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  scannerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  scannerText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600",
    marginBottom: 8,
  },
  scannerSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actions: {
    gap: 12,
  },
  manualButton: {
    backgroundColor: "#6c757d",
  },
  mockInfo: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  mockTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 8,
  },
  mockDescription: {
    fontSize: 14,
    color: "#1976d2",
    lineHeight: 20,
  },
});