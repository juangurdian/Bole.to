import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing(4) }]}>
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
    backgroundColor: v2Colors.surface1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: v2Colors.border,
    paddingTop: spacing(4),
    paddingHorizontal: spacing(4),
    ...Platform.select({
      ios: {
        shadowColor: v2Colors.bg,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: v2Colors.text.secondary,
    marginBottom: spacing(0.5),
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: v2Colors.accent,
    paddingVertical: spacing(3.5),
    borderRadius: radii.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.accent,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: v2Colors.accent,
    paddingVertical: spacing(4),
    borderRadius: radii.md,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.bg,
  },
  disabledButton: {
    backgroundColor: v2Colors.surface2,
  },
  disabledButtonText: {
    color: v2Colors.text.tertiary,
  },
});