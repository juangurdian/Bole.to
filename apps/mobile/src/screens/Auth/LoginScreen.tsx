import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, AccountSelector } from "../../auth/useAuth";
import { Account } from "../../types/models";
import Button from "../../components/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const { login, selectAccount, isOnline } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (!isOnline) {
      Alert.alert("No Connection", "Please check your internet connection and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      
      // If user has multiple accounts, show account selection
      if (response.accounts.length > 1) {
        setAccounts(response.accounts);
        setShowAccountSelection(true);
      }
      // If single account, login is complete (handled by AuthProvider)
      
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed", 
        error.message || "Please check your credentials and try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = async (accountId: string) => {
    setLoading(true);
    try {
      await selectAccount(accountId);
      // Login complete, AuthProvider will handle navigation
    } catch (error: any) {
      console.error("Account selection error:", error);
      Alert.alert(
        "Account Selection Failed", 
        error.message || "Please try again"
      );
      setShowAccountSelection(false);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  if (showAccountSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Select Account</Text>
          <Text style={styles.subtitle}>
            You have access to multiple accounts. Please choose one to continue:
          </Text>
          
          <View style={styles.accountContainer}>
            {accounts.map(account => (
              <View key={account.id} style={styles.accountCard}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountDomain}>{account.domain}</Text>
                <Button
                  title="Select"
                  onPress={() => handleAccountSelection(account.id)}
                  loading={loading}
                  style={styles.selectButton}
                />
              </View>
            ))}
          </View>
          
          <Button
            title="Back to Login"
            onPress={() => {
              setShowAccountSelection(false);
              setAccounts([]);
            }}
            disabled={loading}
            style={styles.backButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Bole.to</Text>
        <Text style={styles.subtitle}>
          {isOnline ? "Sign in to your account" : "No internet connection"}
        </Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!isOnline}
          />
        </View>
        
        {!isOnline && (
          <Text style={styles.offlineHint}>
            ⚠️ No internet connection. Please check your network settings.
          </Text>
        )}
      </ScrollView>
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
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  offlineHint: {
    fontSize: 14,
    color: "#d32f2f",
    textAlign: "center",
    marginTop: 32,
    padding: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  // Account selection styles
  accountContainer: {
    marginBottom: 32,
  },
  accountCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  accountDomain: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  selectButton: {
    marginTop: 8,
  },
  backButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
});