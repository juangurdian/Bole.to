import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import AppNavigator from "./src/app/AppNavigator";
import { ApiProvider } from "./src/api";
import { AuthProvider } from "./src/auth/useAuth";
import OfflineBanner from "./src/components/OfflineBanner";
import { initializeOfflineSystem } from "./src/offline";

const qc = new QueryClient();

export default function App() {
  useEffect(() => {
    // Initialize the offline system on app startup
    initializeOfflineSystem().catch(error => {
      console.error('Failed to initialize offline system:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <ApiProvider>
            <NavigationContainer theme={DefaultTheme}>
              <OfflineBanner />
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </ApiProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
