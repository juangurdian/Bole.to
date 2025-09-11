import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AuthGate from "../components/AuthGate";
import HomeTab from "./tabs/HomeTab";
import DiscoverTab from "./tabs/DiscoverTab";
import TicketsTab from "./tabs/TicketsTab";
import SocialTab from "./tabs/SocialTab";
import ProfileTab from "./tabs/ProfileTab";
import BoletoTabBar from "../components/nav/BoletoTabBar";

const Tab = createBottomTabNavigator();

/**
 * AuthenticatedTabNavigator - Main tab navigation for authenticated users
 */
function AuthenticatedTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // we render labels ourselves
        tabBarStyle: { display: "none" }, // hide default bar
      }}
      tabBar={(props) => <BoletoTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Search" component={DiscoverTab} />
      <Tab.Screen name="Tickets" component={TicketsTab} />
      <Tab.Screen name="Feed" component={SocialTab} />
      <Tab.Screen name="Profile" component={ProfileTab} />
    </Tab.Navigator>
  );
}

/**
 * AppNavigator - Main navigation component with AuthGate protection
 */
export default function AppNavigator() {
  return (
    <AuthGate>
      <AuthenticatedTabNavigator />
    </AuthGate>
  );
}