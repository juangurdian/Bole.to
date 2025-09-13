/**
 * Usage Example: Integrating StreamlinedEventForm
 * 
 * This example demonstrates how to integrate the StreamlinedEventForm 
 * component into your existing React Native application.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  StreamlinedEventFormModal,
  EventFormData 
} from './index';
import CreateEventFAB from './CreateEventFAB';
import { useApi } from '../../../api';

/**
 * Example 1: Modal Integration
 * Use this pattern when you want to present the form as a modal overlay
 */
export function MyEventsScreenWithModal() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const api = useApi();

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleSaveEvent = async (formData: EventFormData) => {
    try {
      // Create a new draft and update it with form data
      const result = await api.createEventDraft();
      await api.updateEventDraft(result.id, formData);
      console.log('Event draft saved successfully');
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error; // Let the form handle the error display
    }
  };

  const handlePublishEvent = async (formData: EventFormData) => {
    try {
      // Create draft, update it, then publish
      const result = await api.createEventDraft();
      await api.updateEventDraft(result.id, formData);
      await api.publishEvent(result.id);
      
      // Close the modal after successful publish
      setShowCreateForm(false);
      
      console.log('Event published successfully');
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {/* Your existing MyEvents screen content */}
      
      {/* Create Event FAB */}
      <CreateEventFAB onPress={handleOpenCreateForm} />

      {/* Streamlined Event Form Modal */}
      <StreamlinedEventFormModal
        visible={showCreateForm}
        onClose={handleCloseCreateForm}
        onSave={handleSaveEvent}
        onPublish={handlePublishEvent}
        title="Create New Event"
        initialData={{
          timezone: 'America/Managua',
          venue: {
            country: 'Nicaragua',
            city: '',
            name: '',
          },
          organizerName: 'Alex Rivera', // Load from user profile
        }}
      />
    </View>
  );
}

/**
 * Example 2: Navigation Integration
 * Use this pattern when you want to navigate to a dedicated screen
 */
import { useNavigation } from '@react-navigation/native';
import { StreamlinedEventForm } from './StreamlinedEventForm';

export function CreateEventScreenExample() {
  const navigation = useNavigation();
  const api = useApi();

  const handleSave = async (formData: EventFormData) => {
    // Save as draft
    const result = await api.createEventDraft();
    await api.updateEventDraft(result.id, formData);
  };

  const handlePublish = async (formData: EventFormData) => {
    // Publish the event
    const result = await api.createEventDraft();
    await api.updateEventDraft(result.id, formData);
    await api.publishEvent(result.id);
    
    // Navigate back or to event details
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StreamlinedEventForm
        onSave={handleSave}
        onPublish={handlePublish}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
}

/**
 * Example 3: Edit Existing Event
 * Use this pattern when editing an existing event draft
 */
export function EditEventExample({ eventId }: { eventId: string }) {
  const [eventData, setEventData] = useState<Partial<EventFormData> | null>(null);
  const api = useApi();

  React.useEffect(() => {
    // Load existing event data
    const loadEventData = async () => {
      try {
        const event = await api.getEventDraft(eventId);
        setEventData(event);
      } catch (error) {
        console.error('Failed to load event:', error);
      }
    };

    loadEventData();
  }, [eventId]);

  const handleSave = async (formData: EventFormData) => {
    await api.updateEventDraft(eventId, formData);
  };

  const handlePublish = async (formData: EventFormData) => {
    await api.updateEventDraft(eventId, formData);
    await api.publishEvent(eventId);
  };

  if (!eventData) {
    return null; // Or loading spinner
  }

  return (
    <View style={styles.container}>
      <StreamlinedEventForm
        initialData={eventData}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </View>
  );
}

/**
 * Example 4: Custom Integration with Additional Features
 * Use this pattern when you need custom behavior or additional features
 */
import { useEventForm, EventFormProvider } from './EventFormProvider';

function CustomEventFormContent() {
  const { formData, isValid, isDirty } = useEventForm();
  
  // Access form state for custom logic
  React.useEffect(() => {
    if (formData.title.length > 50) {
      console.log('Long title detected, showing SEO tips');
    }
  }, [formData.title]);

  return (
    <View>
      {/* Custom UI components */}
      {isDirty && <Text>You have unsaved changes</Text>}
      
      {/* Your custom form sections */}
    </View>
  );
}

export function CustomEventFormExample() {
  return (
    <EventFormProvider autoSave={true} autoSaveInterval={1000}>
      <CustomEventFormContent />
    </EventFormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

/**
 * Integration Notes:
 * 
 * 1. **Auto-save**: The form automatically saves drafts every 2 seconds by default.
 *    You can customize this with the `autoSaveInterval` prop on `EventFormProvider`.
 * 
 * 2. **Validation**: The form validates in real-time and shows the validation status
 *    in the action footer. Users can save drafts even with validation errors, but
 *    cannot publish until all required fields are valid.
 * 
 * 3. **Navigation**: The form integrates with React Navigation for modal presentation
 *    or full-screen navigation. Use `onClose` prop to handle navigation.
 * 
 * 4. **Error Handling**: API errors are caught and displayed to users. Make sure
 *    your API methods throw appropriate errors that can be shown to users.
 * 
 * 5. **Customization**: All components use the v2-neutral theme system and can be
 *    styled with the `style` prop. The form sections are modular and can be
 *    rearranged or customized as needed.
 * 
 * 6. **Image Upload**: Uses expo-image-picker for camera and photo library access.
 *    Make sure to handle permissions appropriately in your app.
 * 
 * 7. **Responsive**: The form uses KeyboardAvoidingView and proper scrolling to
 *    work well on different screen sizes and with the keyboard.
 */