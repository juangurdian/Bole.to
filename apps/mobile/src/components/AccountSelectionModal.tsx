import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import Button from "./Button";

interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  linkedAt: string;
  avatar?: string;
  isDefault?: boolean;
}

interface AccountSelectionModalProps {
  visible: boolean;
  accounts: Account[];
  onSelectAccount: (accountId: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function AccountSelectionModal({
  visible,
  accounts,
  onSelectAccount,
  onCancel,
  loading = false,
}: AccountSelectionModalProps) {
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return '🔍';
      case 'apple':
        return '🍎';
      case 'facebook':
        return '📘';
      case 'twitter':
        return '🐦';
      default:
        return '👤';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return '#4285F4';
      case 'apple':
        return '#000000';
      case 'facebook':
        return '#1877F2';
      case 'twitter':
        return '#1DA1F2';
      default:
        return '#666666';
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Linked ${date.toLocaleDateString()}`;
  };

  const handleAccountSelect = async (accountId: string) => {
    try {
      await onSelectAccount(accountId);
    } catch (error) {
      Alert.alert(
        "Selection Failed",
        "Failed to select this account. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderAccountItem = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountItem}
      onPress={() => handleAccountSelect(item.id)}
      disabled={loading}
    >
      <View style={styles.accountContent}>
        <View style={styles.accountHeader}>
          <View
            style={[
              styles.providerBadge,
              { backgroundColor: getProviderColor(item.provider) },
            ]}
          >
            <Text style={styles.providerIcon}>{getProviderIcon(item.provider)}</Text>
          </View>
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.accountEmail}>{item.email}</Text>
            <Text style={styles.accountProvider}>
              via {item.provider} • {formatJoinDate(item.linkedAt)}
            </Text>
          </View>
          
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        
        <View style={styles.selectIndicator}>
          <Text style={styles.selectText}>Tap to select</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Multiple accounts are associated with this sign-in method.
            Choose which account to use:
          </Text>

          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.accountsList}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can switch between accounts later in your profile settings.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 50, // Same as cancel button to center title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  accountsList: {
    flex: 1,
  },
  accountItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountContent: {
    padding: 16,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  providerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  providerIcon: {
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  accountProvider: {
    fontSize: 12,
    color: "#888",
  },
  defaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  selectIndicator: {
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  selectText: {
    fontSize: 14,
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