import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../../theme/v2-neutral';
import { useApi } from '../../../api';
import { LinearGradient } from 'expo-linear-gradient';

// Simple Create Event Screen without complex state management
export default function CreateEventScreen({ navigation }: any) {
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simple form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Music',
    venue: {
      name: '',
      city: '',
      address: '',
      country: 'Nicaragua',
    },
    startsAt: new Date().toISOString(),
    endsAt: new Date().toISOString(),
    organizerName: '',
    ageRestriction: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateVenueField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      venue: {
        ...prev.venue,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter an event description');
      return;
    }
    if (!formData.venue.name.trim()) {
      Alert.alert('Error', 'Please enter a venue name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the event draft
      const draft = await api.createEventDraft();
      
      if (draft && draft.id) {
        // Update the draft with our form data
        await api.updateEventDraft(draft.id, formData);
        
        Alert.alert('Success', 'Event created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error('Failed to create draft');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => updateField('title', text)}
                placeholder="Enter event title"
                placeholderTextColor={colors.text.tertiary}
                maxLength={80}
              />
              <Text style={styles.helperText}>
                {formData.title.length}/80 characters
              </Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                placeholder="Describe your event"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
              <Text style={styles.helperText}>
                {formData.description.length}/1000 characters
              </Text>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity style={styles.input}>
                <Text style={styles.inputText}>{formData.category}</Text>
                <Feather name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Venue */}
            <View style={styles.section}>
              <Text style={styles.label}>Venue Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.venue.name}
                onChangeText={(text) => updateVenueField('name', text)}
                placeholder="Enter venue name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.venue.city}
                onChangeText={(text) => updateVenueField('city', text)}
                placeholder="Enter city"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.venue.address}
                onChangeText={(text) => updateVenueField('address', text)}
                placeholder="Enter address (optional)"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Start Date & Time</Text>
              <TouchableOpacity style={styles.input}>
                <Feather name="calendar" size={20} color={colors.text.secondary} />
                <Text style={styles.inputText}>
                  {new Date(formData.startsAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Organizer */}
            <View style={styles.section}>
              <Text style={styles.label}>Organizer Name</Text>
              <TextInput
                style={styles.input}
                value={formData.organizerName}
                onChangeText={(text) => updateField('organizerName', text)}
                placeholder="Enter organizer name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Tickets Setup Button */}
            <TouchableOpacity style={styles.ticketsButton}>
              <Feather name="tag" size={20} color={colors.accent} />
              <Text style={styles.ticketsButtonText}>Set Up Tickets</Text>
              <Feather name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Visibility */}
            <View style={styles.section}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity style={[styles.visibilityOption, styles.visibilityOptionActive]}>
                  <Feather name="globe" size={20} color={colors.accent} />
                  <Text style={styles.visibilityOptionTextActive}>Public</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.visibilityOption}>
                  <Feather name="lock" size={20} color={colors.text.secondary} />
                  <Text style={styles.visibilityOptionText}>Private</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Spacer */}
            <View style={{ height: spacing(4) }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.draftButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.createButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
  section: {
    marginBottom: spacing(4),
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
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
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: spacing(3),
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: spacing(1),
  },
  ticketsButton: {
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4),
  },
  ticketsButtonText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginLeft: spacing(3),
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    gap: spacing(2),
  },
  visibilityOptionActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  visibilityOptionText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  visibilityOptionTextActive: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    gap: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  draftButton: {
    flex: 1,
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.bg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});