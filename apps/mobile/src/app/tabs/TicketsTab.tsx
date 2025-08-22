import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WalletScreen from "../../screens/Wallet/WalletScreen";
import TicketScreen from "../../screens/Wallet/TicketScreen";

const Stack = createNativeStackNavigator();

export default function TicketsTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WalletScreen" component={WalletScreen} options={{ title: "My Tickets" }} />
      <Stack.Screen name="TicketScreen" component={TicketScreen} options={{ title: "Ticket" }} />
    </Stack.Navigator>
  );
}