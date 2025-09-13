import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
          <Feather name="credit-card" size={16} color={v2Colors.accent} />
          <Text style={styles.policyText}>{getRefundText()}</Text>
        </View>
        
        <View style={styles.policyItem}>
          <Feather name="log-in" size={16} color={v2Colors.accent} />
          <Text style={styles.policyText}>
            {policies.reentry ? "Re-entry allowed" : "No re-entry"}
          </Text>
        </View>
        
        {policies.minAge && (
          <View style={styles.policyItem}>
            <Feather name="users" size={16} color={v2Colors.accent} />
            <Text style={styles.policyText}>{policies.minAge}+ only</Text>
          </View>
        )}
        
        {policies.doorsOpen && (
          <View style={styles.policyItem}>
            <Feather name="clock" size={16} color={v2Colors.accent} />
            <Text style={styles.policyText}>
              Doors open {formatTime(policies.doorsOpen)}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.viewFullButton} onPress={onOpen}>
        <Text style={styles.viewFullText}>View full policy</Text>
        <Feather name="chevron-right" size={18} color={v2Colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    padding: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(3),
  },
  policyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v2Colors.surface2,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    gap: spacing(2),
  },
  policyText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: v2Colors.text.primary,
  },
  viewFullButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(2),
  },
  viewFullText: {
    fontSize: 16,
    color: v2Colors.accent,
    fontWeight: '500' as const,
  },
});