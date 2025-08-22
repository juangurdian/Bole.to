import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiscoverScreen from "../../screens/Discover/DiscoverScreen";
import EventScreen from "../../screens/Event/EventScreen";
import CheckoutScreen from "../../screens/Checkout/CheckoutScreen";
import OrderConfirmationScreen from "../../screens/Orders/OrderConfirmationScreen";

const Stack = createNativeStackNavigator();

export default function DiscoverTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} options={{ title: "Discover" }} />
      <Stack.Screen name="EventScreen" component={EventScreen} options={{ title: "Event" }} />
      <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ title: "Checkout (Mock)" }} />
      <Stack.Screen name="OrderConfirmationScreen" component={OrderConfirmationScreen} options={{ title: "Order" }} />
    </Stack.Navigator>
  );
}