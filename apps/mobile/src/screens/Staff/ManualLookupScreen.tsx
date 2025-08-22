import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function ManualLookupScreen({ route }: any) {
  const { eventId } = route.params;
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!ticketId.trim()) {
      Alert.alert("Error", "Please enter a ticket ID");
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const isValid = Math.random() > 0.3;
      
      if (isValid) {
        Alert.alert(
          "Valid Ticket ✅", 
          `Ticket ${ticketId} is valid for entry.`,
          [{ text: "OK", onPress: () => setTicketId("") }]
        );
      } else {
        Alert.alert(
          "Invalid Ticket ❌", 
          `Ticket ${ticketId} is not valid or already used.`
        );
      }
      
      setLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>🔍</Text>
            <Text style={styles.title}>Manual Ticket Lookup</Text>
            <Text style={styles.subtitle}>
              Enter ticket ID to manually validate entry
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Ticket ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ticket ID (e.g., TCKX1234)"
            value={ticketId}
            onChangeText={setTicketId}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          
          <Button
            title={loading ? "Validating..." : "Validate Ticket"}
            onPress={handleLookup}
            loading={loading}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Recent Validations</Text>
          
          <View style={styles.validationItem}>
            <Text style={styles.validationIcon}>✅</Text>
            <View style={styles.validationInfo}>
              <Text style={styles.validationId}>TCKX5678</Text>
              <Text style={styles.validationTime}>2 minutes ago</Text>
            </View>
          </View>
          
          <View style={styles.validationItem}>
            <Text style={styles.validationIcon}>❌</Text>
            <View style={styles.validationInfo}>
              <Text style={styles.validationId}>TCKX9999</Text>
              <Text style={styles.validationTime}>5 minutes ago</Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Demo Mode</Text>
            <Text style={styles.mockDescription}>
              Manual validation results are randomized in this demo. Real implementation would check against synced ticket database.
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  validationIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  validationInfo: {
    flex: 1,
  },
  validationId: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
    color: "#333",
  },
  validationTime: {
    fontSize: 12,
    color: "#666",
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