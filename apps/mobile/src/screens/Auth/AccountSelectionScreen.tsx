import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";

interface HiEventsAccount {
  id: string;
  name: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  provider?: string;
  created_at: string;
  is_default?: boolean;
  avatar_url?: string;
}

export default function AccountSelectionScreen() {
  const [loading, setLoading] = useState(false);
  const { availableAccounts, selectAccount, isUsingHiEvents } = useAuth();

  const handleAccountSelection = async (accountId: string) => {
    setLoading(true);
    try {
      await selectAccount(accountId);
      // Navigation will be handled by AuthGate automatically
    } catch (error) {
      Alert.alert("Account Selection Failed", error.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const renderAccountItem = ({ item }: { item: HiEventsAccount }) => {
    const accountName = item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Account';
    const accountEmail = item.email || 'No email';
    
    return (
      <TouchableOpacity
        style={styles.accountItem}
        onPress={() => handleAccountSelection(item.id)}
        disabled={loading}
      >
        <View style={styles.accountContent}>
          <View style={styles.accountHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {accountName.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{accountName}</Text>
              <Text style={styles.accountEmail}>{accountEmail}</Text>
              <Text style={styles.accountProvider}>
                Hi.Events Account • Joined {new Date(item.created_at).getFullYear()}
              </Text>
            </View>
            
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          
          <View style={styles.selectIndicator}>
            <Text style={styles.selectText}>Tap to continue</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isUsingHiEvents) {
    return null; // This screen should only show for Hi.Events
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Account</Text>
        <Text style={styles.subtitle}>
          You have multiple Hi.Events accounts. Choose which one to use for this session:
        </Text>
      </View>

      <View style={styles.content}>
        <FlatList
          data={availableAccounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.accountsList}
          contentContainerStyle={styles.accountsListContainer}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can switch between accounts later in your profile settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  accountsList: {
    flex: 1,
  },
  accountsListContainer: {
    paddingBottom: 20,
  },
  accountItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountContent: {
    padding: 20,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
  },
  accountProvider: {
    fontSize: 13,
    color: "#888",
  },
  defaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  selectIndicator: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  selectText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});