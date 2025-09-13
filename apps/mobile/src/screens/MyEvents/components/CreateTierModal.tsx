import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../../theme/v2-neutral';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TicketTier } from '../TicketTiersScreen';

interface CreateTierModalProps {
  visible: boolean;
  editingTier?: TicketTier;
  existingTiers: TicketTier[];
  onClose: () => void;
  onSave: (tierData: Omit<TicketTier, 'id' | 'soldQuantity'>) => void;
}

interface TierFormData {
  type: 'ticket' | 'table';
  name: string;
  price: string;
  totalQuantity: string;
  description: string;
  isPasswordProtected: boolean;
  password: string;
  requiresApproval: boolean;
  minimumPurchase: string;
  maximumPurchase: string;
  salesStartDate?: Date;
  salesEndDate?: Date;
  validUntilDate?: Date;
  isHidden: boolean;
  isMarkedSoldOut: boolean;
  linkedTierIds: string[];
  isActive: boolean;
  showAdvancedSettings: boolean;
}

export default function CreateTierModal({
  visible,
  editingTier,
  existingTiers,
  onClose,
  onSave,
}: CreateTierModalProps) {
  const [formData, setFormData] = useState<TierFormData>({
    type: 'ticket',
    name: '',
    price: '',
    totalQuantity: '',
    description: '',
    isPasswordProtected: false,
    password: '',
    requiresApproval: false,
    minimumPurchase: '1',
    maximumPurchase: '10',
    salesStartDate: undefined,
    salesEndDate: undefined,
    validUntilDate: undefined,
    isHidden: false,
    isMarkedSoldOut: false,
    linkedTierIds: [],
    isActive: true,
    showAdvancedSettings: false,
  });

  const [showDatePicker, setShowDatePicker] = useState<{
    field: 'salesStart' | 'salesEnd' | 'validUntil' | null;
    mode: 'date' | 'time';
  }>({ field: null, mode: 'date' });

  useEffect(() => {
    if (editingTier) {
      setFormData({
        type: editingTier.type,
        name: editingTier.name,
        price: editingTier.price.toString(),
        totalQuantity: editingTier.totalQuantity.toString(),
        description: editingTier.description || '',
        isPasswordProtected: editingTier.isPasswordProtected,
        password: editingTier.password || '',
        requiresApproval: editingTier.requiresApproval,
        minimumPurchase: editingTier.minimumPurchase.toString(),
        maximumPurchase: editingTier.maximumPurchase.toString(),
        salesStartDate: editingTier.salesStartDate,
        salesEndDate: editingTier.salesEndDate,
        validUntilDate: editingTier.validUntilDate,
        isHidden: editingTier.isHidden,
        isMarkedSoldOut: editingTier.isMarkedSoldOut,
        linkedTierIds: editingTier.linkedTierIds,
        isActive: editingTier.isActive,
        showAdvancedSettings: false,
      });
    } else {
      // Reset form for new tier
      setFormData({
        type: 'ticket',
        name: '',
        price: '',
        totalQuantity: '',
        description: '',
        isPasswordProtected: false,
        password: '',
        requiresApproval: false,
        minimumPurchase: '1',
        maximumPurchase: '10',
        salesStartDate: undefined,
        salesEndDate: undefined,
        validUntilDate: undefined,
        isHidden: false,
        isMarkedSoldOut: false,
        linkedTierIds: [],
        isActive: true,
        showAdvancedSettings: false,
      });
    }
  }, [editingTier, visible]);

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a tier name');
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!formData.totalQuantity || parseInt(formData.totalQuantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid total quantity');
      return;
    }
    if (parseInt(formData.minimumPurchase) > parseInt(formData.maximumPurchase)) {
      Alert.alert('Error', 'Minimum purchase cannot be greater than maximum purchase');
      return;
    }

    const tierData: Omit<TicketTier, 'id' | 'soldQuantity'> = {
      type: formData.type,
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      totalQuantity: parseInt(formData.totalQuantity),
      description: formData.description.trim(),
      isPasswordProtected: formData.isPasswordProtected,
      password: formData.isPasswordProtected ? formData.password : undefined,
      requiresApproval: formData.requiresApproval,
      minimumPurchase: parseInt(formData.minimumPurchase),
      maximumPurchase: parseInt(formData.maximumPurchase),
      salesStartDate: formData.salesStartDate,
      salesEndDate: formData.salesEndDate,
      validUntilDate: formData.validUntilDate,
      isHidden: formData.isHidden,
      isMarkedSoldOut: formData.isMarkedSoldOut,
      linkedTierIds: formData.linkedTierIds,
      isActive: formData.isActive,
    };

    onSave(tierData);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker({ field: null, mode: 'date' });
    }
    
    if (selectedDate && showDatePicker.field) {
      const field = showDatePicker.field;
      setFormData(prev => ({
        ...prev,
        [`${field}Date`]: selectedDate,
      }));
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString();
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Select time';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleTierLink = (tierId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedTierIds: prev.linkedTierIds.includes(tierId)
        ? prev.linkedTierIds.filter(id => id !== tierId)
        : [...prev.linkedTierIds, tierId],
    }));
  };

  const availableTiersForLinking = existingTiers.filter(tier => 
    tier.id !== editingTier?.id && tier.type === formData.type
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <LinearGradient
        colors={[colors.bg, '#0B0F16', '#0A0C10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingTier ? 'Edit Tier' : 'Create New Tier'}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Tier Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tier Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, formData.type === 'ticket' && styles.typeOptionActive]}
                    onPress={() => setFormData(prev => ({ ...prev, type: 'ticket' }))}
                  >
                    <Feather 
                      name="tag" 
                      size={20} 
                      color={formData.type === 'ticket' ? colors.accent : colors.text.tertiary} 
                    />
                    <Text style={[styles.typeOptionText, formData.type === 'ticket' && styles.typeOptionTextActive]}>
                      Ticket
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, formData.type === 'table' && styles.typeOptionActive]}
                    onPress={() => setFormData(prev => ({ ...prev, type: 'table' }))}
                  >
                    <Feather 
                      name="square" 
                      size={20} 
                      color={formData.type === 'table' ? colors.accent : colors.text.tertiary} 
                    />
                    <Text style={[styles.typeOptionText, formData.type === 'table' && styles.typeOptionTextActive]}>
                      Table
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {formData.type === 'ticket' ? 'Ticket' : 'Table'} Name *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder={formData.type === 'ticket' ? 'e.g., General Admission' : 'e.g., VIP Table'}
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Text style={styles.inputLabel}>Price ($) *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.price}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                      placeholder="25.00"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.inputLabel}>Total Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.totalQuantity}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, totalQuantity: text }))}
                      placeholder="100"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Optional description..."
                    placeholderTextColor={colors.text.tertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Access Control */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Access Control</Text>
                
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Password Protected</Text>
                    <Text style={styles.toggleDescription}>Require a password to purchase</Text>
                  </View>
                  <Switch
                    value={formData.isPasswordProtected}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isPasswordProtected: value }))}
                    trackColor={{ false: colors.surface2, true: colors.accent }}
                    thumbColor={colors.text.primary}
                  />
                </View>

                {formData.isPasswordProtected && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                      placeholder="Enter password"
                      placeholderTextColor={colors.text.tertiary}
                      secureTextEntry
                    />
                  </View>
                )}

                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Requires Approval</Text>
                    <Text style={styles.toggleDescription}>Manual approval needed for purchases</Text>
                  </View>
                  <Switch
                    value={formData.requiresApproval}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, requiresApproval: value }))}
                    trackColor={{ false: colors.surface2, true: colors.accent }}
                    thumbColor={colors.text.primary}
                  />
                </View>
              </View>

              {/* Advanced Settings */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setFormData(prev => ({ ...prev, showAdvancedSettings: !prev.showAdvancedSettings }))}
                >
                  <Text style={styles.sectionTitle}>Advanced Settings</Text>
                  <Feather 
                    name={formData.showAdvancedSettings ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.text.tertiary} 
                  />
                </TouchableOpacity>

                {formData.showAdvancedSettings && (
                  <>
                    <View style={styles.row}>
                      <View style={styles.rowItem}>
                        <Text style={styles.inputLabel}>Min Purchase</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.minimumPurchase}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, minimumPurchase: text }))}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={styles.rowItem}>
                        <Text style={styles.inputLabel}>Max Purchase</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.maximumPurchase}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, maximumPurchase: text }))}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    {/* Date & Time Settings */}
                    <View style={styles.dateTimeSection}>
                      <Text style={styles.subSectionTitle}>Sales Period</Text>
                      
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker({ field: 'salesStart', mode: 'date' })}
                      >
                        <View style={styles.dateTimeContent}>
                          <Feather name="calendar" size={16} color={colors.text.tertiary} />
                          <View style={styles.dateTimeText}>
                            <Text style={styles.dateTimeLabel}>Sales Start Date</Text>
                            <Text style={styles.dateTimeValue}>{formatDate(formData.salesStartDate)}</Text>
                          </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker({ field: 'salesEnd', mode: 'date' })}
                      >
                        <View style={styles.dateTimeContent}>
                          <Feather name="calendar" size={16} color={colors.text.tertiary} />
                          <View style={styles.dateTimeText}>
                            <Text style={styles.dateTimeLabel}>Sales End Date</Text>
                            <Text style={styles.dateTimeValue}>{formatDate(formData.salesEndDate)}</Text>
                          </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker({ field: 'validUntil', mode: 'date' })}
                      >
                        <View style={styles.dateTimeContent}>
                          <Feather name="calendar" size={16} color={colors.text.tertiary} />
                          <View style={styles.dateTimeText}>
                            <Text style={styles.dateTimeLabel}>Valid Until</Text>
                            <Text style={styles.dateTimeValue}>{formatDate(formData.validUntilDate)}</Text>
                          </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    </View>

                    {/* Visibility Settings */}
                    <View style={styles.toggleRow}>
                      <View style={styles.toggleInfo}>
                        <Text style={styles.toggleLabel}>Hide Completely</Text>
                        <Text style={styles.toggleDescription}>Hide this tier from public view</Text>
                      </View>
                      <Switch
                        value={formData.isHidden}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, isHidden: value }))}
                        trackColor={{ false: colors.surface2, true: colors.accent }}
                        thumbColor={colors.text.primary}
                      />
                    </View>

                    <View style={styles.toggleRow}>
                      <View style={styles.toggleInfo}>
                        <Text style={styles.toggleLabel}>Mark as Sold Out</Text>
                        <Text style={styles.toggleDescription}>Show as sold out regardless of availability</Text>
                      </View>
                      <Switch
                        value={formData.isMarkedSoldOut}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, isMarkedSoldOut: value }))}
                        trackColor={{ false: colors.surface2, true: colors.accent }}
                        thumbColor={colors.text.primary}
                      />
                    </View>

                    {/* Tier Linking */}
                    {availableTiersForLinking.length > 0 && (
                      <View style={styles.linkingSection}>
                        <Text style={styles.subSectionTitle}>Link Tiers</Text>
                        <Text style={styles.linkingDescription}>
                          When this tier sells out, linked tiers will become available
                        </Text>
                        {availableTiersForLinking.map(tier => (
                          <TouchableOpacity
                            key={tier.id}
                            style={[
                              styles.linkTierOption,
                              formData.linkedTierIds.includes(tier.id) && styles.linkTierOptionActive
                            ]}
                            onPress={() => toggleTierLink(tier.id)}
                          >
                            <View style={styles.linkTierInfo}>
                              <Text style={styles.linkTierName}>{tier.name}</Text>
                              <Text style={styles.linkTierPrice}>${tier.price.toFixed(2)}</Text>
                            </View>
                            <Feather 
                              name={formData.linkedTierIds.includes(tier.id) ? 'check-circle' : 'circle'} 
                              size={20} 
                              color={formData.linkedTierIds.includes(tier.id) ? colors.accent : colors.text.tertiary} 
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>

              <View style={{ height: spacing(8) }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Date Picker */}
          {showDatePicker.field && (
            <DateTimePicker
              value={formData[`${showDatePicker.field}Date`] || new Date()}
              mode={showDatePicker.mode}
              display="default"
              onChange={handleDateChange}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
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
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(4),
  },
  section: {
    marginBottom: spacing(6),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(4),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(4),
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(3),
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(3),
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
    gap: spacing(2),
  },
  typeOptionActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  typeOptionTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing(4),
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(2),
  },
  input: {
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing(3),
  },
  row: {
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(4),
  },
  rowItem: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing(3),
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  toggleDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  dateTimeSection: {
    marginBottom: spacing(4),
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(3),
    marginBottom: spacing(2),
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateTimeText: {
    marginLeft: spacing(3),
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing(1),
  },
  dateTimeValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  linkingSection: {
    marginTop: spacing(4),
  },
  linkingDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: spacing(3),
    lineHeight: 18,
  },
  linkTierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(3),
    marginBottom: spacing(2),
  },
  linkTierOptionActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  linkTierInfo: {
    flex: 1,
  },
  linkTierName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  linkTierPrice: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});