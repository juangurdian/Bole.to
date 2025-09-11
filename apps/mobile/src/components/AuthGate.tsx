import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/useAuth";
import LoginScreen from "../screens/Auth/LoginScreen";
import AccountSelectionScreen from "../screens/Auth/AccountSelectionScreen";

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * AuthGate - Navigation guard component that manages authentication state
 * Handles loading states, account selection, and routing based on auth status
 */
export default function AuthGate({ children }: AuthGateProps) {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    accountSelectionRequired, 
    availableAccounts,
    selectAccount,
    isUsingHiEvents
  } = useAuth();

  // Loading state - show splash screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
          <Text style={styles.loadingSubtext}>
            {isUsingHiEvents ? "Connecting to Hi.Events" : "Initializing authentication"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not authenticated - show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Account selection required (Hi.Events multi-account users)
  if (accountSelectionRequired && availableAccounts.length > 0) {
    return <AccountSelectionScreen />;
  }

  // Authenticated and ready - show main app
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});