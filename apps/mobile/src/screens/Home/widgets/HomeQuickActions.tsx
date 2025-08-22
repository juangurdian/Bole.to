import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface HomeQuickActionsProps {
  userRoles: string[];
  navigation: any;
}

export default function HomeQuickActions({ userRoles, navigation }: HomeQuickActionsProps) {
  const isStaff = userRoles.includes("staff");
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate("Tickets")}
      >
        <Text style={styles.actionEmoji}>🎫</Text>
        <Text style={styles.actionText}>My Tickets</Text>
      </TouchableOpacity>
      
      {isStaff && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate("Profile", { screen: "StaffEntryScreen" })}
        >
          <Text style={styles.actionEmoji}>📱</Text>
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate("Discover")}
      >
        <Text style={styles.actionEmoji}>📍</Text>
        <Text style={styles.actionText}>Find Nearby</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => {}}
      >
        <Text style={styles.actionEmoji}>🎁</Text>
        <Text style={styles.actionText}>Promotions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    alignItems: "center",
    minWidth: 60,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
});