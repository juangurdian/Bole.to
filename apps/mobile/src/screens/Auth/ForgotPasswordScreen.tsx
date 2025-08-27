import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = () => {
    console.log("Reset password for:", email);
    setIsSubmitted(true);
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
        </View>

        <View style={styles.content}>
          {!isSubmitted ? (
            <>
              <View style={styles.iconContainer}>
                <Feather name="lock" size={48} color="#000" />
              </View>

              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you instructions to reset your password.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Feather name="check-circle" size={48} color="#4CAF50" />
              </View>

              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent password reset instructions to {email}
              </Text>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => navigation.navigate("LoginScreen")}
              >
                <Text style={styles.resetButtonText}>Back to Login</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsSubmitted(false)}>
                <Text style={styles.resendText}>Didn't receive the email? Resend</Text>
              </TouchableOpacity>
            </>
          )}

          {!isSubmitted && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
                <Text style={styles.footerText}>
                  <Feather name="arrow-left" size={16} /> Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
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
  resetButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#666",
    fontSize: 16,
  },
  resendText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
  },
});