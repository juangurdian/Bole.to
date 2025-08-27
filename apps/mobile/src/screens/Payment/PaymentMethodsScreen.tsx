import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

interface PaymentMethod {
  id: string;
  type: "card" | "paypal" | "apple" | "google";
  last4?: string;
  brand?: string;
  email?: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen({ navigation }: any) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      last4: "5555",
      brand: "Mastercard",
      isDefault: false,
    },
    {
      id: "3",
      type: "paypal",
      email: "user@example.com",
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Remove Payment Method",
      "Are you sure you want to remove this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    if (method.type === "card") {
      return method.brand === "Visa" ? "credit-card" : "credit-card";
    }
    if (method.type === "paypal") return "dollar-sign";
    if (method.type === "apple") return "smartphone";
    return "credit-card";
  };

  const getPaymentTitle = (method: PaymentMethod) => {
    if (method.type === "card") {
      return `${method.brand} •••• ${method.last4}`;
    }
    if (method.type === "paypal") {
      return `PayPal (${method.email})`;
    }
    if (method.type === "apple") return "Apple Pay";
    if (method.type === "google") return "Google Pay";
    return "Unknown";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodInfo}>
                <Feather name={getPaymentIcon(method) as any} size={24} color="#000" />
                <View style={styles.methodDetails}>
                  <Text style={styles.methodTitle}>{getPaymentTitle(method)}</Text>
                  {method.isDefault && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </View>
              </View>
              <View style={styles.methodActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Text style={styles.actionText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(method.id)}>
                  <Feather name="trash-2" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddPaymentMethodScreen")}
        >
          <Feather name="plus" size={24} color="#000" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  methodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 12,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodDetails: {
    marginLeft: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  defaultBadge: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 2,
  },
  methodActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    color: "#007AFF",
    fontSize: 14,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});