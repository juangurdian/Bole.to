// TypeScript interfaces for streamlined event creation form

export interface EventFormData {
  // Basic Information
  title: string;
  category: string;
  organizerName: string;
  description: string;
  ageRestriction?: string;
  
  // Date & Time
  timezone: string;
  startsAt: string;
  endsAt: string;
  
  // Location
  venue: {
    name: string;
    address?: string;
    city: string;
    country: string;
  };
  
  // Hero Image
  heroImage?: {
    uri: string;
    type: string;
    name: string;
  };
  
  // Settings
  social: {
    enabled: boolean;
  };
  camera: {
    enabled: boolean;
  };
  policies: {
    refundPolicy: 'WINDOW' | 'NO_REFUND' | 'CUSTOM';
    refundWindowHours: number;
    reentry: boolean;
    attendeeListVisibility: 'PUBLIC' | 'PRIVATE';
  };
  
  // Products/Tickets (simplified for streamlined form)
  products: Array<{
    id?: string;
    name: string;
    price: {
      amount: number;
      currency: string;
    };
    capacity: number;
    description?: string;
  }>;
}

export interface FormValidation {
  isValid: boolean;
  errors: {
    title?: string;
    category?: string;
    description?: string;
    startsAt?: string;
    venue?: string;
    products?: string;
  };
  warnings: {
    [key: string]: string;
  };
}

export interface StreamlinedEventFormProps {
  draftId?: string;
  onSave?: (data: EventFormData) => void;
  onPublish?: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
  isLoading?: boolean;
  onClose?: () => void;
}

export interface EventFormContextType {
  formData: EventFormData;
  validation: FormValidation;
  updateField: (field: string, value: any) => void;
  updateNestedField: (parentField: string, childField: string, value: any) => void;
  validateForm: () => FormValidation;
  isValid: boolean;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  style?: any;
}

export interface ThemedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  error?: string;
  warning?: string;
  helpText?: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export interface ActionFooterProps {
  onSaveDraft: () => void;
  onCreateEvent: () => void;
  isValid: boolean;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface ImageUploadProps {
  value?: {
    uri: string;
    type: string;
    name: string;
  };
  onImageSelected: (image: { uri: string; type: string; name: string }) => void;
  onImageRemoved: () => void;
  style?: any;
}

// Default form data
export const defaultEventFormData: EventFormData = {
  title: '',
  category: '',
  organizerName: '',
  description: '',
  ageRestriction: '',
  timezone: 'America/Managua',
  startsAt: '',
  endsAt: '',
  venue: {
    name: '',
    address: '',
    city: '',
    country: 'Nicaragua',
  },
  social: {
    enabled: true,
  },
  camera: {
    enabled: false,
  },
  policies: {
    refundPolicy: 'WINDOW',
    refundWindowHours: 24,
    reentry: true,
    attendeeListVisibility: 'PUBLIC',
  },
  products: [],
};

// Validation rules
export const validationRules = {
  title: {
    minLength: 3,
    maxLength: 80,
    required: true,
  },
  category: {
    required: true,
  },
  description: {
    minLength: 30,
    maxLength: 1000,
    required: true,
  },
  startsAt: {
    required: true,
  },
  venue: {
    name: {
      required: true,
      minLength: 2,
    },
    city: {
      required: true,
      minLength: 2,
    },
  },
  products: {
    minCount: 1,
    required: true,
  },
};