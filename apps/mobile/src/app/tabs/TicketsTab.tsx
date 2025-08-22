import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TicketsMainScreen from "../../screens/Tickets/TicketsMainScreen";
import TicketScreen from "../../screens/Wallet/TicketScreen";
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
        component={TicketsMainScreen} 
        options={{ title: "Tickets & Events" }} 
      />
      <Stack.Screen 
        name="TicketScreen" 
        component={TicketScreen} 
        options={{ title: "Ticket" }} 
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