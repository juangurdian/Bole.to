import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TicketsScreen from "../../screens/Tickets/TicketsScreen";
import TicketScreen from "../../screens/Wallet/TicketScreen";
import EventEditorWizard from "../../screens/MyEvents/EventEditorWizard";
import EventPreviewScreen from "../../screens/MyEvents/EventPreviewScreen";
import ProductEditorScreen from "../../screens/MyEvents/ProductEditorScreen";
import MyEventsCheckInListsScreen from "../../screens/MyEvents/CheckInListsScreen";
import PromoterToolsScreen from "../../screens/MyEvents/PromoterToolsScreen";
import MessageComposerScreen from "../../screens/MyEvents/MessageComposerScreen";

// Staff screens
import StaffEntryScreen from "../../screens/Staff/StaffEntryScreen";
import EventPickerScreen from "../../screens/Staff/EventPickerScreen";
import StaffCheckInListsScreen from "../../screens/Staff/CheckInListsScreen";
import ScannerScreen from "../../screens/Staff/ScannerScreen";
import ManualLookupScreen from "../../screens/Staff/ManualLookupScreen";
import SyncScreen from "../../screens/Staff/SyncScreen";
import StaffSyncScreen from "../../screens/Staff/StaffSyncScreen";

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
        component={MyEventsCheckInListsScreen} 
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
      
      {/* Staff Screens */}
      <Stack.Screen 
        name="StaffEntryScreen" 
        component={StaffEntryScreen} 
        options={{ title: "Staff Access" }} 
      />
      <Stack.Screen 
        name="EventPickerScreen" 
        component={EventPickerScreen} 
        options={{ title: "Staff Events" }} 
      />
      <Stack.Screen 
        name="StaffCheckInListsScreen" 
        component={StaffCheckInListsScreen} 
        options={{ title: "Check-in Lists" }} 
      />
      <Stack.Screen 
        name="ScannerScreen" 
        component={ScannerScreen} 
        options={{ title: "QR Scanner" }} 
      />
      <Stack.Screen 
        name="ManualLookupScreen" 
        component={ManualLookupScreen} 
        options={{ title: "Manual Lookup" }} 
      />
      <Stack.Screen 
        name="SyncScreen" 
        component={SyncScreen} 
        options={{ title: "Sync" }} 
      />
      <Stack.Screen 
        name="StaffSyncScreen" 
        component={StaffSyncScreen} 
        options={{ title: "Sync Status" }} 
      />
    </Stack.Navigator>
  );
}