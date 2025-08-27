import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../../screens/Home/HomeScreen";
import EventScreen from "../../screens/Event/EventScreen";
import CheckoutScreen from "../../screens/Checkout/CheckoutScreen";
import OrderConfirmationScreen from "../../screens/Orders/OrderConfirmationScreen";

const Stack = createNativeStackNavigator();

export default function HomeTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventScreen" component={EventScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ title: "Checkout" }} />
      <Stack.Screen name="OrderConfirmationScreen" component={OrderConfirmationScreen} options={{ title: "Order Confirmation" }} />
    </Stack.Navigator>
  );
}