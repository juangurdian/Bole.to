import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("demo@bole.to");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const { 
    login, 
    authenticateWithGoogle, 
    authenticateWithApple, 
    availableOAuthProviders,
    accountSelectionRequired,
    availableAccounts,
    selectAccount,
    isUsingHiEvents,
  } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await authenticateWithGoogle();
    } catch (error) {
      if (error.message) {
        Alert.alert("Google Sign-In Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      await authenticateWithApple();
    } catch (error) {
      if (error.message) {
        Alert.alert("Apple Sign-In Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = async (accountId: string) => {
    setLoading(true);
    try {
      await selectAccount(accountId);
    } catch (error) {
      Alert.alert("Account Selection Failed", error.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  if (accountSelectionRequired) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Select Account</Text>
          <Text style={styles.subtitle}>Multiple accounts found. Please select one:</Text>
          
          <View style={styles.accountList}>
            {availableAccounts.map((account, index) => (
              <Button
                key={account.id || index}
                title={`${account.provider} - ${account.email || 'Account'}`}
                onPress={() => handleAccountSelection(account.id)}
                loading={loading}
                style={styles.accountButton}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Bole.to</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        
        {/* OAuth Buttons */}
        <View style={styles.oauthContainer}>
          {availableOAuthProviders.includes('google') && (
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={loading}
              style={[styles.oauthButton, styles.googleButton]}
              textStyle={styles.oauthButtonText}
            />
          )}
          
          {availableOAuthProviders.includes('apple') && Platform.OS === 'ios' && (
            <Button
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              loading={loading}
              style={[styles.oauthButton, styles.appleButton]}
              textStyle={styles.oauthButtonText}
            />
          )}
        </View>
        
        {/* Divider */}
        {availableOAuthProviders.length > 0 && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        )}
        
        {/* Email/Password Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            title="Sign In with Email"
            onPress={handleLogin}
            loading={loading}
          />
        </View>
        
        <Text style={styles.hint}>
          🔐 Secure authentication with {isUsingHiEvents ? 'Hi.Events' : 'Gateway API'}
        </Text>
        
        {isUsingHiEvents && (
          <Text style={styles.hiEventsInfo}>
            Sign in with your Hi.Events account to access your events, tickets, and account data.
          </Text>
        )}
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
    marginBottom: 32,
  },
  oauthContainer: {
    gap: 12,
    marginBottom: 24,
  },
  oauthButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  oauthButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
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
  hint: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 32,
    padding: 16,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  accountList: {
    gap: 12,
    marginTop: 24,
  },
  accountButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  hiEventsInfo: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e3e8ff",
    lineHeight: 20,
  },
});