import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import AppNavigator from "./src/app/AppNavigator";
import { ApiProvider } from "./src/api";
// import { AuthProvider } from "./src/auth/useAuth";
import { MockAuthProvider as AuthProvider } from "./src/auth/MockAuthProvider";
import OfflineBanner from "./src/components/OfflineBanner";

const qc = new QueryClient();

export default function App() {
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
