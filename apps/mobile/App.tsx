import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from "./src/app/AppNavigator";
import { ApiProvider } from "./src/api";
import { AuthProvider } from "./src/auth/useAuth";
import OfflineBanner from "./src/components/OfflineBanner";

const qc = new QueryClient();

// Use proper Stripe test key for staging
// In production, this should come from environment variables or secure configuration
const STRIPE_PUBLISHABLE_KEY = __DEV__ 
  ? 'pk_test_51HsK9sB6EvjPZQjJ0HjJ8JQC8xqvZRXz9HzPZQjJ0HjJ8JQC8xqvZRXz9HzPZQjJ0HjJ8JQC8xqv' // Replace with your test key
  : 'pk_live_your_live_key_here'; // Replace with your live key

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <ApiProvider>
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
              <NavigationContainer theme={DefaultTheme}>
                <OfflineBanner />
                <AppNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </StripeProvider>
          </ApiProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
