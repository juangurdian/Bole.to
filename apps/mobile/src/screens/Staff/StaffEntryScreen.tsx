import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function StaffEntryScreen({ navigation }: any) {
  const [staffCode, setStaffCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStaffLogin = async () => {
    if (!staffCode.trim()) {
      Alert.alert("Error", "Please enter a staff code");
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      if (staffCode.toLowerCase() === "staff" || staffCode === "123") {
        navigation.navigate("EventPickerScreen");
      } else {
        Alert.alert("Invalid Code", "Please check your staff code and try again");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>🎫</Text>
            <Text style={styles.title}>Staff Mode</Text>
            <Text style={styles.subtitle}>
              Enter your staff code to access ticket scanning
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Staff Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter staff code"
            value={staffCode}
            onChangeText={setStaffCode}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Button
            title={loading ? "Verifying..." : "Access Staff Mode"}
            onPress={handleStaffLogin}
            loading={loading}
          />
        </Card>

        <Card>
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Demo Instructions</Text>
            <Text style={styles.mockDescription}>
              Use "staff" or "123" as the staff code to access demo staff features.
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
    justifyContent: "center",
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