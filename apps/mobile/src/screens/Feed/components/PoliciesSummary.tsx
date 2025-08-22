import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface PoliciesSummaryProps {
  policies: any;
  onOpen: () => void;
}

export default function PoliciesSummary({ policies, onOpen }: PoliciesSummaryProps) {
  const getRefundText = () => {
    switch (policies.refundPolicy) {
      case "NONE":
        return "No refunds";
      case "WINDOW":
        return `Refunds up to ${policies.refundWindowHours}h before`;
      case "CUSTOM":
        return "Custom refund policy";
      default:
        return "Unknown";
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Details</Text>
      
      <View style={styles.policyGrid}>
        <View style={styles.policyItem}>
          <Text style={styles.policyIcon}>💳</Text>
          <Text style={styles.policyText}>{getRefundText()}</Text>
        </View>
        
        <View style={styles.policyItem}>
          <Text style={styles.policyIcon}>🚪</Text>
          <Text style={styles.policyText}>
            {policies.reentry ? "Re-entry allowed" : "No re-entry"}
          </Text>
        </View>
        
        {policies.minAge && (
          <View style={styles.policyItem}>
            <Text style={styles.policyIcon}>🔞</Text>
            <Text style={styles.policyText}>{policies.minAge}+ only</Text>
          </View>
        )}
        
        {policies.doorsOpen && (
          <View style={styles.policyItem}>
            <Text style={styles.policyIcon}>⏰</Text>
            <Text style={styles.policyText}>
              Doors open {formatTime(policies.doorsOpen)}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.viewFullButton} onPress={onOpen}>
        <Text style={styles.viewFullText}>View full policy</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  policyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  policyIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  policyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  viewFullButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  viewFullText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
  },
});