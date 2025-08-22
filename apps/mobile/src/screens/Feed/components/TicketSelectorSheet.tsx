import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TicketSelectorSheetProps {
  visible: boolean;
  tiers: any[];
  selectedTiers: Record<string, number>;
  onChangeQuantity: (tierId: string, quantity: number) => void;
  onClose: () => void;
  onCheckout: () => void;
}

export default function TicketSelectorSheet({
  visible,
  tiers,
  selectedTiers,
  onChangeQuantity,
  onClose,
  onCheckout
}: TicketSelectorSheetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalPrice = () => {
    return Object.entries(selectedTiers).reduce((total, [tierId, quantity]) => {
      const tier = tiers.find(t => t.id === tierId);
      return total + (tier?.price || 0) * quantity;
    }, 0);
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTiers).reduce((sum, qty) => sum + qty, 0);
  };

  const totalPrice = getTotalPrice();
  const totalQuantity = getTotalQuantity();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Tickets</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {tiers.map(tier => (
            <TierSelector
              key={tier.id}
              tier={tier}
              quantity={selectedTiers[tier.id] || 0}
              onChangeQuantity={(quantity) => onChangeQuantity(tier.id, quantity)}
            />
          ))}
        </ScrollView>

        {totalQuantity > 0 && (
          <View style={styles.footer}>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {totalQuantity} ticket{totalQuantity > 1 ? 's' : ''} • {formatCurrency(totalPrice)}
              </Text>
              <Text style={styles.feesText}>+ fees</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
              <Text style={styles.checkoutButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

interface TierSelectorProps {
  tier: any;
  quantity: number;
  onChangeQuantity: (quantity: number) => void;
}

function TierSelector({ tier, quantity, onChangeQuantity }: TierSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const maxQuantity = Math.min(tier.remaining, tier.perOrderLimit?.max || 10);

  return (
    <View style={styles.tierContainer}>
      <View style={styles.tierInfo}>
        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierPrice}>
          {tier.price === 0 ? "Free" : formatCurrency(tier.price)}
        </Text>
        {tier.description && (
          <Text style={styles.tierDescription}>{tier.description}</Text>
        )}
        <Text style={styles.tierRemaining}>
          {tier.remaining} remaining
        </Text>
      </View>

      <View style={styles.quantitySelector}>
        <TouchableOpacity
          style={[styles.quantityButton, quantity === 0 && styles.disabledButton]}
          onPress={() => onChangeQuantity(Math.max(0, quantity - 1))}
          disabled={quantity === 0}
        >
          <Text style={[styles.quantityButtonText, quantity === 0 && styles.disabledButtonText]}>
            −
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{quantity}</Text>
        
        <TouchableOpacity
          style={[styles.quantityButton, quantity >= maxQuantity && styles.disabledButton]}
          onPress={() => onChangeQuantity(Math.min(maxQuantity, quantity + 1))}
          disabled={quantity >= maxQuantity}
        >
          <Text style={[styles.quantityButtonText, quantity >= maxQuantity && styles.disabledButtonText]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tierContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierInfo: {
    flex: 1,
    marginRight: 16,
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  tierRemaining: {
    fontSize: 12,
    color: "#999",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  disabledButtonText: {
    color: "#ccc",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  summary: {
    marginBottom: 16,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  feesText: {
    fontSize: 14,
    color: "#666",
  },
  checkoutButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});