import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionBarProps {
  event: any;
  isAttendee: boolean;
  totalPrice: number;
  onBuyTickets: () => void;
  onOpenTicket: () => void;
  onRemindMe: () => void;
  onShare: () => void;
}

export default function ActionBar({
  event,
  isAttendee,
  totalPrice,
  onBuyTickets,
  onOpenTicket,
  onRemindMe,
  onShare
}: ActionBarProps) {
  const insets = useSafeAreaInsets();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const isEnded = event.status === "ENDED";
  const isSoldOut = event.pricing.saleStatus === "SOLD_OUT";
  const notStarted = event.pricing.saleStatus === "NOT_STARTED";

  const renderContent = () => {
    if (isAttendee && !isEnded) {
      return (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={onShare}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onOpenTicket}>
            <Text style={styles.primaryButtonText}>Open Ticket</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (isEnded) {
      return (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={onShare}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Photos</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (notStarted) {
      return (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={onShare}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onRemindMe}>
            <Text style={styles.primaryButtonText}>Remind Me</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (isSoldOut) {
      return (
        <>
          <TouchableOpacity style={styles.secondaryButton} onPress={onShare}>
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryButton, styles.disabledButton]}>
            <Text style={[styles.primaryButtonText, styles.disabledButtonText]}>
              Sold Out
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    // On sale - visitor mode
    return (
      <>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {totalPrice > 0 ? formatCurrency(totalPrice) : "Select tickets"}
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onBuyTickets}>
          <Text style={styles.primaryButtonText}>Buy Tickets</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  primaryButton: {
    flex: 2,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  disabledButtonText: {
    color: "#999",
  },
});