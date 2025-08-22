import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../../screens/Settings/ProfileScreen";
import NotificationsScreen from "../../screens/Settings/NotificationsScreen";
import StaffEntryScreen from "../../screens/Staff/StaffEntryScreen";
import EventPickerScreen from "../../screens/Staff/EventPickerScreen";
import SyncScreen from "../../screens/Staff/SyncScreen";
import ScannerScreen from "../../screens/Staff/ScannerScreen";
import ManualLookupScreen from "../../screens/Staff/ManualLookupScreen";

const Stack = createNativeStackNavigator();

export default function ProfileTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="StaffEntryScreen" component={StaffEntryScreen} options={{ title: "Staff Mode" }} />
      <Stack.Screen name="EventPickerScreen" component={EventPickerScreen} options={{ title: "Select Event" }} />
      <Stack.Screen name="SyncScreen" component={SyncScreen} options={{ title: "Sync Data" }} />
      <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ title: "Ticket Scanner" }} />
      <Stack.Screen name="ManualLookupScreen" component={ManualLookupScreen} options={{ title: "Manual Lookup" }} />
    </Stack.Navigator>
  );
}