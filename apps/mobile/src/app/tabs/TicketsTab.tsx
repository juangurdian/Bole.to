import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TicketsScreen from "../../screens/Tickets/TicketsScreen";
import TicketScreen from "../../screens/Wallet/TicketScreen";
import EventScreen from "../../screens/Event/EventScreen";
import CheckoutScreen from "../../screens/Checkout/CheckoutScreen";
import OrderConfirmationScreen from "../../screens/Orders/OrderConfirmationScreen";
import EventEditorWizard from "../../screens/MyEvents/EventEditorWizard";
import EventPreviewScreen from "../../screens/MyEvents/EventPreviewScreen";
import ProductEditorScreen from "../../screens/MyEvents/ProductEditorScreen";
import CheckInListsScreen from "../../screens/MyEvents/CheckInListsScreen";
import PromoterToolsScreen from "../../screens/MyEvents/PromoterToolsScreen";
import MessageComposerScreen from "../../screens/MyEvents/MessageComposerScreen";

const Stack = createNativeStackNavigator();

export default function TicketsTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TicketsMainScreen" 
        component={TicketsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="TicketScreen" 
        component={TicketScreen} 
        options={{ title: "Ticket" }} 
      />
      <Stack.Screen 
        name="EventScreen" 
        component={EventScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="CheckoutScreen" 
        component={CheckoutScreen} 
        options={{ title: "Checkout" }} 
      />
      <Stack.Screen 
        name="OrderConfirmationScreen" 
        component={OrderConfirmationScreen} 
        options={{ title: "Order Confirmation" }} 
      />
      <Stack.Screen 
        name="EventEditorWizard" 
        component={EventEditorWizard} 
        options={{ 
          title: "Event Setup",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="EventPreviewScreen" 
        component={EventPreviewScreen} 
        options={{ title: "Event Preview" }} 
      />
      <Stack.Screen 
        name="ProductEditorScreen" 
        component={ProductEditorScreen} 
        options={{ title: "Manage Tickets" }} 
      />
      <Stack.Screen 
        name="CheckInListsScreen" 
        component={CheckInListsScreen} 
        options={{ title: "Check-in Lists" }} 
      />
      <Stack.Screen 
        name="PromoterToolsScreen" 
        component={PromoterToolsScreen} 
        options={{ title: "Promoter Tools" }} 
      />
      <Stack.Screen 
        name="MessageComposerScreen" 
        component={MessageComposerScreen} 
        options={{ title: "Send Message" }} 
      />
    </Stack.Navigator>
  );
}