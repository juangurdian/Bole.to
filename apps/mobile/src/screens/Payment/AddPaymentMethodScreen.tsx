import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function AddPaymentMethodScreen({ navigation }: any) {
  const [selectedMethod, setSelectedMethod] = useState<"card" | "paypal">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [zipCode, setZipCode] = useState("");

  const handleAddCard = () => {
    console.log("Adding card:", { cardNumber, cardName, expiryDate, cvv });
    navigation.goBack();
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ");
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Payment Method</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodOption,
                selectedMethod === "card" && styles.methodOptionActive,
              ]}
              onPress={() => setSelectedMethod("card")}
            >
              <Feather name="credit-card" size={20} color={selectedMethod === "card" ? "#fff" : "#000"} />
              <Text style={[
                styles.methodOptionText,
                selectedMethod === "card" && styles.methodOptionTextActive,
              ]}>
                Credit/Debit Card
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodOption,
                selectedMethod === "paypal" && styles.methodOptionActive,
              ]}
              onPress={() => setSelectedMethod("paypal")}
            >
              <Feather name="dollar-sign" size={20} color={selectedMethod === "paypal" ? "#fff" : "#000"} />
              <Text style={[
                styles.methodOptionText,
                selectedMethod === "paypal" && styles.methodOptionTextActive,
              ]}>
                PayPal
              </Text>
            </TouchableOpacity>
          </View>

          {selectedMethod === "card" ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
                <Text style={styles.addButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.paypalContainer}>
              <View style={styles.paypalInfo}>
                <Feather name="info" size={20} color="#666" />
                <Text style={styles.paypalText}>
                  You will be redirected to PayPal to complete the setup
                </Text>
              </View>
              
              <TouchableOpacity style={styles.paypalButton}>
                <Text style={styles.paypalButtonText}>Connect PayPal Account</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.security}>
            <Feather name="shield" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
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
    padding: 16,
  },
  methodSelector: {
    flexDirection: "row",
    marginBottom: 24,
  },
  methodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  methodOptionActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  methodOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  methodOptionTextActive: {
    color: "#fff",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  addButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  paypalContainer: {
    marginTop: 20,
  },
  paypalInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 20,
  },
  paypalText: {
    marginLeft: 12,
    flex: 1,
    color: "#666",
  },
  paypalButton: {
    backgroundColor: "#0070ba",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  paypalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  security: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  securityText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
});