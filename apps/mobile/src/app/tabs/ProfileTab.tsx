import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NewProfileScreen from "../../screens/Profile/NewProfileScreen";
import SettingsScreen from "../../screens/Settings/SettingsScreen";
import NotificationsScreen from "../../screens/Settings/NotificationsScreen";
import StaffEntryScreen from "../../screens/Staff/StaffEntryScreen";
import EventPickerScreen from "../../screens/Staff/EventPickerScreen";
import SyncScreen from "../../screens/Staff/SyncScreen";
import ScannerScreen from "../../screens/Staff/ScannerScreen";
import ManualLookupScreen from "../../screens/Staff/ManualLookupScreen";
import EventScreen from "../../screens/Feed/EventScreen";

const Stack = createNativeStackNavigator();

export default function ProfileTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileScreen" component={NewProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="EventScreen" component={EventScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="StaffEntryScreen" component={StaffEntryScreen} options={{ title: "Staff Mode" }} />
      <Stack.Screen name="EventPickerScreen" component={EventPickerScreen} options={{ title: "Select Event" }} />
      <Stack.Screen name="SyncScreen" component={SyncScreen} options={{ title: "Sync Data" }} />
      <Stack.Screen name="ScannerScreen" component={ScannerScreen} options={{ title: "Ticket Scanner" }} />
      <Stack.Screen name="ManualLookupScreen" component={ManualLookupScreen} options={{ title: "Manual Lookup" }} />
    </Stack.Navigator>
  );
}