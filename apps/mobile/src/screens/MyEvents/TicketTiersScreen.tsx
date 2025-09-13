import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../theme/v2-neutral';
import { LinearGradient } from 'expo-linear-gradient';
import CreateTierModal from './components/CreateTierModal';

export interface TicketTier {
  id: string;
  type: 'ticket' | 'table';
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  description?: string;
  isPasswordProtected: boolean;
  password?: string;
  requiresApproval: boolean;
  minimumPurchase: number;
  maximumPurchase: number;
  salesStartDate?: Date;
  salesEndDate?: Date;
  validUntilDate?: Date;
  isHidden: boolean;
  isMarkedSoldOut: boolean;
  linkedTierIds: string[];
  isActive: boolean;
}

interface TicketTiersScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

export default function TicketTiersScreen({ navigation, route }: TicketTiersScreenProps) {
  const { eventId } = route.params;
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTier, setEditingTier] = useState<TicketTier | undefined>();

  const handleCreateTier = (tierData: Omit<TicketTier, 'id' | 'soldQuantity'>) => {
    const newTier: TicketTier = {
      ...tierData,
      id: Date.now().toString(),
      soldQuantity: 0,
    };
    setTiers([...tiers, newTier]);
    setShowCreateModal(false);
  };

  const handleEditTier = (tier: TicketTier) => {
    setEditingTier(tier);
    setShowCreateModal(true);
  };

  const handleUpdateTier = (tierData: Omit<TicketTier, 'id' | 'soldQuantity'>) => {
    if (!editingTier) return;
    
    const updatedTiers = tiers.map(tier => 
      tier.id === editingTier.id 
        ? { ...tierData, id: editingTier.id, soldQuantity: tier.soldQuantity }
        : tier
    );
    setTiers(updatedTiers);
    setShowCreateModal(false);
    setEditingTier(undefined);
  };

  const handleDeleteTier = (tierId: string) => {
    Alert.alert(
      'Delete Tier',
      'Are you sure you want to delete this tier?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTiers(tiers.filter(tier => tier.id !== tierId));
          },
        },
      ]
    );
  };

  const handleToggleTierStatus = (tierId: string) => {
    setTiers(tiers.map(tier => 
      tier.id === tierId 
        ? { ...tier, isActive: !tier.isActive }
        : tier
    ));
  };

  const renderTierCard = (tier: TicketTier) => {
    const availableQuantity = tier.totalQuantity - tier.soldQuantity;
    const soldPercentage = (tier.soldQuantity / tier.totalQuantity) * 100;
    
    return (
      <View key={tier.id} style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <View style={styles.tierInfo}>
            <View style={styles.tierTitleRow}>
              <View style={styles.tierTypeIndicator}>
                <Feather 
                  name={tier.type === 'ticket' ? 'tag' : 'square'} 
                  size={14} 
                  color={tier.type === 'ticket' ? colors.accent : '#FF6B6B'} 
                />
                <Text style={styles.tierType}>
                  {tier.type === 'ticket' ? 'Ticket' : 'Table'}
                </Text>
              </View>
              <View style={styles.tierActions}>
                <TouchableOpacity
                  onPress={() => handleToggleTierStatus(tier.id)}
                  style={[styles.statusToggle, tier.isActive && styles.statusToggleActive]}
                >
                  <Text style={[styles.statusToggleText, tier.isActive && styles.statusToggleTextActive]}>
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierPrice}>${tier.price.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.tierStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sold</Text>
            <Text style={styles.statValue}>{tier.soldQuantity}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Available</Text>
            <Text style={styles.statValue}>{availableQuantity}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{tier.totalQuantity}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${soldPercentage}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>{soldPercentage.toFixed(1)}% sold</Text>
        </View>

        {tier.description && (
          <Text style={styles.tierDescription}>{tier.description}</Text>
        )}

        <View style={styles.tierFeatures}>
          {tier.isPasswordProtected && (
            <View style={styles.featureTag}>
              <Feather name="lock" size={12} color={colors.text.tertiary} />
              <Text style={styles.featureText}>Password Protected</Text>
            </View>
          )}
          {tier.requiresApproval && (
            <View style={styles.featureTag}>
              <Feather name="shield" size={12} color={colors.text.tertiary} />
              <Text style={styles.featureText}>Requires Approval</Text>
            </View>
          )}
          {tier.isHidden && (
            <View style={styles.featureTag}>
              <Feather name="eye-off" size={12} color={colors.text.tertiary} />
              <Text style={styles.featureText}>Hidden</Text>
            </View>
          )}
          {tier.isMarkedSoldOut && (
            <View style={styles.featureTag}>
              <Feather name="x-circle" size={12} color={colors.error} />
              <Text style={[styles.featureText, { color: colors.error }]}>Marked Sold Out</Text>
            </View>
          )}
          {tier.linkedTierIds.length > 0 && (
            <View style={styles.featureTag}>
              <Feather name="link" size={12} color={colors.accent} />
              <Text style={[styles.featureText, { color: colors.accent }]}>
                Linked ({tier.linkedTierIds.length})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tierCardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTier(tier)}
          >
            <Feather name="edit-2" size={16} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTier(tier.id)}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Tiers</Text>
          <TouchableOpacity 
            onPress={() => setShowCreateModal(true)}
            style={styles.headerButton}
          >
            <Feather name="plus" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tiers.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="tag" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No ticket tiers yet</Text>
              <Text style={styles.emptyMessage}>
                Create your first ticket tier to start selling tickets for your event
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Feather name="plus" size={20} color={colors.bg} />
                <Text style={styles.createFirstButtonText}>Create First Tier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                {tiers.length} {tiers.length === 1 ? 'Tier' : 'Tiers'} Created
              </Text>
              {tiers.map(renderTierCard)}
              
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Feather name="plus" size={20} color={colors.accent} />
                <Text style={styles.addMoreButtonText}>Add Another Tier</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Create/Edit Tier Modal */}
        <CreateTierModal
          visible={showCreateModal}
          editingTier={editingTier}
          existingTiers={tiers}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTier(undefined);
          }}
          onSave={editingTier ? handleUpdateTier : handleCreateTier}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(4),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(4),
  },
  tierCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    padding: spacing(4),
    marginBottom: spacing(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tierHeader: {
    marginBottom: spacing(3),
  },
  tierInfo: {
    flex: 1,
  },
  tierTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  tierTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  tierType: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  tierActions: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  statusToggle: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  statusToggleActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}20`,
  },
  statusToggleText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  statusToggleTextActive: {
    color: colors.accent,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  tierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(3),
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing(1),
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressContainer: {
    marginBottom: spacing(3),
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing(1),
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
  tierDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing(3),
    lineHeight: 20,
  },
  tierFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    gap: spacing(1),
  },
  featureText: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  tierCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(3),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    gap: spacing(1),
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(8),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing(6),
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: radii.lg,
    gap: spacing(2),
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    paddingVertical: spacing(4),
    borderRadius: radii.lg,
    gap: spacing(2),
    marginTop: spacing(2),
  },
  addMoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
  },
});