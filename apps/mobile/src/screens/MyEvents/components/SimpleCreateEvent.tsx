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
import { LinearGradient } from 'expo-linear-gradient';

// Ultra-simple Create Event Screen with NO drafts, NO complex state
export default function SimpleCreateEvent({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    // Basic validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Error', 'Please enter a venue');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    setIsSaving(true);
    
    // For now, just show success and go back
    // In production, this would call an API to create the event directly
    setTimeout(() => {
      Alert.alert(
        'Success!', 
        'Your event has been created successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.goBack();
              // Optionally refresh the events list
              navigation.navigate('TicketsMainScreen', { refresh: true });
            }
          }
        ]
      );
      setIsSaving(false);
    }, 1000);
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
            <Feather name="x" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Form */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Image Placeholder */}
            <TouchableOpacity style={styles.imageUpload}>
              <Feather name="image" size={32} color={colors.text.tertiary} />
              <Text style={styles.imageUploadText}>Add Event Image</Text>
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor={colors.text.tertiary}
                maxLength={80}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's your event about?"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* Date & Time */}
            <TouchableOpacity style={styles.dateTimeButton}>
              <View style={styles.dateTimeContent}>
                <Feather name="calendar" size={20} color={colors.accent} />
                <View style={styles.dateTimeText}>
                  <Text style={styles.dateTimeLabel}>Date & Time</Text>
                  <Text style={styles.dateTimeValue}>Select date and time</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue *</Text>
              <TextInput
                style={styles.input}
                value={venue}
                onChangeText={setVenue}
                placeholder="Venue name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* DJ Lineup */}
            <TouchableOpacity 
              style={styles.lineupButton}
              onPress={() => navigation.navigate('DJLineupScreen', { eventId: 'new-event' })}
            >
              <Feather name="music" size={20} color={colors.accent} />
              <Text style={styles.lineupButtonText}>Add DJ Lineup</Text>
              <Feather name="plus" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Tickets */}
            <TouchableOpacity 
              style={styles.ticketsButton}
              onPress={() => navigation.navigate('TicketTiersScreen', { eventId: 'new-event' })}
            >
              <View style={styles.ticketsContent}>
                <Feather name="tag" size={20} color={colors.accent} />
                <View style={styles.ticketsText}>
                  <Text style={styles.ticketsLabel}>Tickets</Text>
                  <Text style={styles.ticketsValue}>Set up ticket types and pricing</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Visibility */}
            <View style={styles.visibilitySection}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibilityButtons}>
                <TouchableOpacity 
                  style={[styles.visibilityButton, isPublic && styles.visibilityButtonActive]}
                  onPress={() => setIsPublic(true)}
                >
                  <Feather name="globe" size={18} color={isPublic ? colors.accent : colors.text.tertiary} />
                  <Text style={[styles.visibilityButtonText, isPublic && styles.visibilityButtonTextActive]}>
                    Public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.visibilityButton, !isPublic && styles.visibilityButtonActive]}
                  onPress={() => setIsPublic(false)}
                >
                  <Feather name="lock" size={18} color={!isPublic ? colors.accent : colors.text.tertiary} />
                  <Text style={[styles.visibilityButtonText, !isPublic && styles.visibilityButtonTextActive]}>
                    Private
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: spacing(8) }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.saveDraftButton}
            onPress={() => Alert.alert('Info', 'Draft saved locally')}
          >
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.createButton, isSaving && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isSaving}
          >
            <Text style={styles.createButtonText}>
              {isSaving ? 'Creating...' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(4),
  },
  imageUpload: {
    height: 200,
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(6),
  },
  imageUploadText: {
    marginTop: spacing(2),
    fontSize: 14,
    color: colors.text.tertiary,
  },
  inputGroup: {
    marginBottom: spacing(4),
  },
  label: {
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
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing(3),
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(4),
    marginBottom: spacing(4),
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    marginLeft: spacing(3),
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dateTimeValue: {
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 2,
  },
  lineupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(4),
    marginBottom: spacing(4),
  },
  lineupButtonText: {
    flex: 1,
    marginLeft: spacing(3),
    fontSize: 16,
    color: colors.text.primary,
  },
  ticketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(4),
    marginBottom: spacing(4),
  },
  ticketsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketsText: {
    marginLeft: spacing(3),
  },
  ticketsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ticketsValue: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  visibilitySection: {
    marginBottom: spacing(4),
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  visibilityButton: {
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
  visibilityButtonActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  visibilityButtonText: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  visibilityButtonTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: spacing(4),
    paddingBottom: spacing(6),
    gap: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  saveDraftButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(4),
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  saveDraftText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  createButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(4),
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
  },
});