# Streamlined Event Creation Form

A comprehensive, single-page event creation form built with React Native that provides a streamlined UX for creating events quickly and efficiently.

## Overview

This implementation provides a complete event creation solution with the following features:

- **Single-page form** with all sections visible at once
- **Auto-save functionality** with 2-second debounce
- **Real-time validation** with visual feedback
- **V2-neutral theme integration** for consistent styling
- **Platform-agnostic image upload** with camera and gallery support
- **TypeScript interfaces** for type safety
- **Modular, reusable components**

## Components

### Core Components

- **`StreamlinedEventForm`** - Main form component with all sections
- **`StreamlinedEventFormModal`** - Modal wrapper for overlay presentation
- **`EventFormProvider`** - Context provider for state management
- **`FormSection`** - Reusable section wrapper component
- **`ThemedInput`** - V2-neutral themed input component
- **`ImageUploadComponent`** - Hero image upload with platform integration
- **`ActionFooter`** - Save Draft / Create Event action buttons

### Form Sections

1. **Hero Image** - Event cover image upload
2. **Basic Information** - Title, category, organizer, description, age restriction
3. **Date & Time** - Start and end date/time selection
4. **Location** - Venue name, address, city, country
5. **Tickets** - Ticket types with pricing and capacity

## Usage

### Basic Integration

```tsx
import { StreamlinedEventForm, EventFormData } from './components';

function CreateEventScreen() {
  const handleSave = async (formData: EventFormData) => {
    // Save draft logic
  };

  const handlePublish = async (formData: EventFormData) => {
    // Publish event logic
  };

  return (
    <StreamlinedEventForm
      onSave={handleSave}
      onPublish={handlePublish}
      initialData={{
        timezone: 'America/Managua',
        venue: { country: 'Nicaragua' },
      }}
    />
  );
}
```

### Modal Integration

```tsx
import { StreamlinedEventFormModal } from './components';

function MyEventsScreen() {
  const [showForm, setShowForm] = useState(false);

  return (
    <View>
      {/* Your content */}
      <StreamlinedEventFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    </View>
  );
}
```

## Technical Implementation

### State Management

The form uses React Context with `useReducer` for centralized state management:

- **Form data** - All form field values
- **Validation state** - Real-time validation results
- **UI state** - Loading, dirty flags, last saved timestamp

### Auto-save

Automatic draft saving with configurable debounce:

```tsx
<EventFormProvider 
  autoSave={true} 
  autoSaveInterval={2000}
>
  <StreamlinedEventForm />
</EventFormProvider>
```

### Validation

Real-time validation with visual feedback:

- **Required field validation**
- **Length constraints** (title, description)
- **Format validation** (dates, numbers)
- **Business logic validation** (at least one ticket type)

### Image Upload

Platform-agnostic image handling:

- **Camera capture** with permission handling
- **Photo library selection** with cropping
- **Proper aspect ratio** (16:9 for event covers)
- **Privacy-focused** (EXIF data removal)

## API Integration

### Required API Methods

The form expects these methods to be available via `useApi()`:

```typescript
interface EventAPI {
  createEventDraft(): Promise<{ id: string; draft: EventFormData }>;
  updateEventDraft(id: string, data: Partial<EventFormData>): Promise<EventFormData>;
  publishEvent(id: string): Promise<EventFormData>;
}
```

### Error Handling

All API errors are caught and displayed to users with appropriate messaging.

## Styling

### Theme Integration

Uses the V2-neutral theme system:

```typescript
import { colors, spacing, radii, typography } from '../../../theme/v2-neutral';
```

### Responsive Design

- **KeyboardAvoidingView** for keyboard management
- **ScrollView** with proper content sizing
- **Minimum touch targets** (44px) for accessibility
- **Safe area handling** for various screen sizes

## File Structure

```
components/
├── types.ts                     # TypeScript interfaces
├── EventFormProvider.tsx        # Context provider
├── FormSection.tsx             # Section wrapper
├── ThemedInput.tsx             # Themed input component
├── ImageUploadComponent.tsx    # Image upload
├── ActionFooter.tsx            # Action buttons
├── StreamlinedEventForm.tsx    # Main form
├── StreamlinedEventFormModal.tsx # Modal wrapper
├── CreateEventScreen.tsx       # Screen integration
├── UsageExample.tsx            # Usage examples
├── index.ts                    # Component exports
└── README.md                   # This file
```

## Dependencies

- **React Native** - Core framework
- **Expo Image Picker** - Image selection and camera
- **React Navigation** - Navigation integration
- **Feather Icons** - Consistent iconography
- **TypeScript** - Type safety

## Performance Considerations

- **Debounced auto-save** to prevent excessive API calls
- **Optimized re-renders** with proper context structure
- **Image optimization** with quality settings
- **Keyboard management** for smooth UX

## Accessibility

- **Semantic labels** for screen readers
- **Minimum touch targets** for easy interaction
- **High contrast colors** from theme system
- **Keyboard navigation** support

## Future Enhancements

1. **Date/time pickers** - Replace text inputs with proper pickers
2. **Location autocomplete** - Integrate with mapping services
3. **Rich text description** - Support formatting in descriptions
4. **Template system** - Save and reuse event templates
5. **Advanced validation** - Business rule validation
6. **Offline support** - Local storage for drafts
7. **Analytics integration** - Track form usage and completion

## Testing

The components are designed to be easily testable:

- **Pure components** with clear prop interfaces
- **Separated business logic** in custom hooks
- **Mockable API integration** via context
- **TypeScript interfaces** for contract testing