import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";

interface TicketsModuleProps {
  pricing: any;
  onSelectTier: (tierId: string) => void;
}

export default function TicketsModule({ pricing, onSelectTier }: TicketsModuleProps) {
  const getStatusBadge = () => {
    switch (pricing.saleStatus) {
      case "ON_SALE":
        return { text: "On sale", color: "#28a745" };
      case "NOT_STARTED":
        return { text: "Not started", color: "#ffc107" };
      case "SOLD_OUT":
        return { text: "Sold out", color: "#dc3545" };
      case "ENDED":
        return { text: "Ended", color: "#6c757d" };
      default:
        return { text: "Unknown", color: "#6c757d" };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const activeTiers = pricing.tiers.filter((tier: any) => tier.active !== false);
  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tickets</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
          <Text style={styles.statusText}>{statusBadge.text}</Text>
        </View>
      </View>

      {/* Tier List */}
      <View style={styles.tierList}>
        {activeTiers.map((tier: any) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onPress={() => onSelectTier(tier.id)}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Service fees and taxes will be added at checkout
        </Text>
      </View>
    </View>
  );
}

interface TierRowProps {
  tier: any;
  onPress: () => void;
}

function TierRow({ tier, onPress }: TierRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRemainingText = () => {
    if (tier.soldOut) return "Sold out";
    if (tier.remaining <= 0) return "Sold out";
    if (tier.remaining <= 10) return `${tier.remaining} left`;
    return `${tier.remaining} available`;
  };

  const isDisabled = tier.soldOut || tier.remaining <= 0;

  return (
    <TouchableOpacity
      style={[
        styles.tierRow,
        isDisabled && styles.tierRowDisabled
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {/* Left Side - Tier Info */}
      <View style={styles.tierInfo}>
        <View style={styles.tierNameRow}>
          <Text style={[styles.tierName, isDisabled && styles.disabledText]}>
            {tier.name}
          </Text>
          {tier.soldOut && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold out</Text>
            </View>
          )}
        </View>
        
        {tier.description && (
          <Text style={[styles.tierDescription, isDisabled && styles.disabledText]}>
            {tier.description}
          </Text>
        )}
        
        {tier.perks && tier.perks.length > 0 && (
          <View style={styles.perksRow}>
            {tier.perks.slice(0, 2).map((perk: string, index: number) => (
              <View key={index} style={styles.perkChip}>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
            {tier.perks.length > 2 && (
              <Text style={styles.morePerks}>+{tier.perks.length - 2} more</Text>
            )}
          </View>
        )}
      </View>

      {/* Right Side - Price & Status */}
      <View style={styles.tierPricing}>
        <Text style={[styles.tierPrice, isDisabled && styles.disabledText]}>
          {tier.price === 0 ? "Free" : formatCurrency(tier.price)}
        </Text>
        <Text style={[styles.remainingText, isDisabled && styles.disabledText]}>
          {getRemainingText()}
        </Text>
      </View>

      {/* Perforation Edge */}
      <View style={styles.perforationEdge}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={index} style={styles.perforationDot} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  tierList: {
    paddingHorizontal: 16,
  },
  tierRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    position: "relative",
  },
  tierRowDisabled: {
    backgroundColor: "#f5f5f5",
    borderLeftColor: "#dee2e6",
  },
  tierInfo: {
    flex: 1,
    marginRight: 16,
  },
  tierNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  soldOutBadge: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  tierDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  perksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  perkChip: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  perkText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#495057",
  },
  morePerks: {
    fontSize: 12,
    color: "#6c757d",
    alignSelf: "center",
  },
  tierPricing: {
    alignItems: "flex-end",
  },
  tierPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
    color: "#666",
  },
  disabledText: {
    color: "#adb5bd",
  },
  perforationEdge: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  perforationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dee2e6",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
  },
});