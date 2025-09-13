import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(5),
    paddingBottom: spacing(4),
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
  },
  tierList: {
    paddingHorizontal: spacing(4),
  },
  tierRow: {
    flexDirection: "row",
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
    padding: spacing(4),
    marginBottom: spacing(3),
    borderLeftWidth: 4,
    borderLeftColor: v2Colors.accent,
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  tierRowDisabled: {
    backgroundColor: v2Colors.surface1,
    borderLeftColor: v2Colors.border,
    opacity: 0.6,
  },
  tierInfo: {
    flex: 1,
    marginRight: spacing(4),
  },
  tierNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginRight: spacing(2),
  },
  soldOutBadge: {
    backgroundColor: v2Colors.error,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
  },
  soldOutText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
  },
  tierDescription: {
    fontSize: 14,
    color: v2Colors.text.secondary,
    marginBottom: spacing(2),
  },
  perksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  perkChip: {
    backgroundColor: `${v2Colors.accent}15`,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.accent}30`,
  },
  perkText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: v2Colors.text.primary,
  },
  morePerks: {
    fontSize: 12,
    color: v2Colors.text.tertiary,
    alignSelf: "center",
  },
  tierPricing: {
    alignItems: "flex-end",
  },
  tierPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(1),
  },
  remainingText: {
    fontSize: 12,
    color: v2Colors.text.secondary,
  },
  disabledText: {
    color: v2Colors.text.tertiary,
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
    backgroundColor: v2Colors.border,
  },
  footer: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(5),
  },
  footerText: {
    fontSize: 12,
    color: v2Colors.text.tertiary,
    textAlign: "center",
  },
});