import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/MockAuthProvider";
import Card from "../../components/Card";
import Button from "../../components/Button";
import ListItem from "../../components/ListItem";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || "U"}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.name || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <ListItem
            title="Notifications"
            icon="🔔"
            onPress={() => navigation.navigate("NotificationsScreen")}
          />
          
          <ListItem
            title="Staff Mode"
            icon="🎫"
            onPress={() => navigation.navigate("StaffEntryScreen")}
          />
          
          <ListItem
            title="Help & Support"
            icon="❓"
            onPress={() => {}}
          />
          
          <ListItem
            title="Privacy Policy"
            icon="🔒"
            onPress={() => {}}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.mockInfo}>
            <Text style={styles.mockTitle}>📱 Mock Mode Active</Text>
            <Text style={styles.mockDescription}>
              This is a demonstration version. All data is simulated and no real transactions are processed.
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
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
  actions: {
    paddingVertical: 20,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
  },
});