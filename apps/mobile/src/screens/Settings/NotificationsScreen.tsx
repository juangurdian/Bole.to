import React, { useState } from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";

export default function NotificationsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [eventReminders, setEventReminders] = useState(true);
  const [socialUpdates, setSocialUpdates] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Event Reminders</Text>
              <Text style={styles.settingDescription}>
                Get notified before your events
              </Text>
            </View>
            <Switch
              value={eventReminders}
              onValueChange={setEventReminders}
              disabled={!pushNotifications}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Social Updates</Text>
              <Text style={styles.settingDescription}>
                New posts and poll notifications
              </Text>
            </View>
            <Switch
              value={socialUpdates}
              onValueChange={setSocialUpdates}
              disabled={!pushNotifications}
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Updates</Text>
              <Text style={styles.settingDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Mock Mode</Text>
            <Text style={styles.mockDescription}>
              Notification settings are simulated in this demo version.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  mockInfo: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
  },
  mockTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 8,
  },
  mockDescription: {
    fontSize: 14,
    color: "#1976d2",
    lineHeight: 20,
  },
});