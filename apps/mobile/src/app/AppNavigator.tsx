import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/useAuth";
import LoginScreen from "../screens/Auth/LoginScreen";
import HomeTab from "./tabs/HomeTab";
import DiscoverTab from "./tabs/DiscoverTab";
import TicketsTab from "./tabs/TicketsTab";
import SocialTab from "./tabs/SocialTab";
import ProfileTab from "./tabs/ProfileTab";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Could show a loading screen here
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => null, // Simple tabs without icons for now
      }}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Discover" component={DiscoverTab} />
      <Tab.Screen name="Tickets" component={TicketsTab} />
      <Tab.Screen name="Feed" component={SocialTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}