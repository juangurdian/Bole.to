import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StreamlinedEventForm, EventFormData } from './components';
import { useApi } from '../../api';
import { colors } from '../../theme/v2-neutral';

export function CreateEventScreen() {
  const navigation = useNavigation();
  const api = useApi();

  const handleSave = async (formData: EventFormData) => {
    try {
      // Create or update a draft event
      const result = await api.createEventDraft();
      await api.updateEventDraft(result.id, formData);
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error; // Re-throw so the form can handle the error
    }
  };

  const handlePublish = async (formData: EventFormData) => {
    try {
      // Create a draft first, then publish it
      const result = await api.createEventDraft();
      await api.updateEventDraft(result.id, formData);
      await api.publishEvent(result.id);
      console.log('Event published successfully');
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error; // Re-throw so the form can handle the error
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StreamlinedEventForm
        onSave={handleSave}
        onPublish={handlePublish}
        onClose={handleClose}
        initialData={{
          // Pre-fill some default values if desired
          timezone: 'America/Managua',
          venue: {
            country: 'Nicaragua',
            city: '',
            name: '',
          },
          organizerName: 'Alex Rivera', // Could be loaded from user profile
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});