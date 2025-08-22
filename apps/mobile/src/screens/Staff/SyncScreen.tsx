import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function SyncScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    
    setTimeout(() => {
      setSyncing(false);
      navigation.navigate("ScannerScreen", { eventId });
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>🔄</Text>
            <Text style={styles.title}>Sync Event Data</Text>
            <Text style={styles.subtitle}>
              Download the latest ticket data for offline scanning
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusText}>Event details synchronized</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusText}>Ticket tiers loaded</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>⏳</Text>
            <Text style={styles.statusText}>Ticket validation data pending</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title={syncing ? "Syncing..." : "Start Sync"}
            onPress={handleSync}
            loading={syncing}
          />
        </View>

        <Card>
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Demo Mode</Text>
            <Text style={styles.mockDescription}>
              In demo mode, sync is simulated. Real implementation would download ticket validation data for offline use.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#333",
  },
  actions: {
    paddingVertical: 20,
  },
  mockInfo: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
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