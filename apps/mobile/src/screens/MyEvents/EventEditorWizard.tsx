import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../api";
import WizardHeader from "./components/WizardHeader";
import WizardFooter from "./components/WizardFooter";
import BasicsStep from "./components/steps/BasicsStep";
import WhenWhereStep from "./components/steps/WhenWhereStep";
import TicketsStep from "./components/steps/TicketsStep";
import MediaStep from "./components/steps/MediaStep";
import PoliciesStep from "./components/steps/PoliciesStep";
import PreviewStep from "./components/steps/PreviewStep";

const STEPS = [
  { key: "basics", title: "Basics", component: BasicsStep },
  { key: "whenWhere", title: "When & Where", component: WhenWhereStep },
  { key: "tickets", title: "Tickets", component: TicketsStep },
  { key: "media", title: "Media", component: MediaStep },
  { key: "policies", title: "Policies", component: PoliciesStep },
  { key: "preview", title: "Preview", component: PreviewStep },
];

interface EventEditorWizardProps {
  route: {
    params: {
      draftId: string;
      isNew?: boolean;
    };
  };
  navigation: any;
}

export default function EventEditorWizard({ route, navigation }: EventEditorWizardProps) {
  const { draftId, isNew } = route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const api = useApi();
  const queryClient = useQueryClient();

  const draftQuery = useQuery({
    queryKey: ["event-draft", draftId],
    queryFn: () => api.getEventDraft(draftId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateEventDraft(draftId, data),
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["event-draft", draftId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishEvent(draftId),
    onSuccess: () => {
      Alert.alert("Success", "Event published successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    },
  });

  useEffect(() => {
    if (draftQuery.data) {
      setEventData(draftQuery.data);
    }
  }, [draftQuery.data]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          { text: "Stay", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSaveDraft = async () => {
    if (!eventData) return;
    
    try {
      await updateMutation.mutateAsync(eventData);
      Alert.alert("Success", "Draft saved successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to save draft");
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    // Validation logic would go here
    const validationErrors = validateCurrentData();
    if (validationErrors.length > 0) {
      Alert.alert("Validation Error", validationErrors[0]);
      return;
    }

    try {
      await publishMutation.mutateAsync();
    } catch (error) {
      Alert.alert("Error", "Failed to publish event");
    }
  };

  const validateCurrentData = () => {
    const errors: string[] = [];
    
    if (!eventData?.title?.trim()) {
      errors.push("Event title is required");
    }
    
    if (!eventData?.category) {
      errors.push("Event category is required");
    }
    
    if (!eventData?.startsAt) {
      errors.push("Start date and time is required");
    }
    
    if (!eventData?.venue?.name?.trim()) {
      errors.push("Venue name is required");
    }
    
    if (!eventData?.products?.length) {
      errors.push("At least one ticket type is required");
    }

    return errors;
  };

  const handleStepData = (stepData: any) => {
    setEventData(prev => ({ ...prev, ...stepData }));
    setHasUnsavedChanges(true);
    
    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      if (eventData) {
        updateMutation.mutate({ ...eventData, ...stepData });
      }
    }, 2000);
  };

  if (draftQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading event draft...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Failed to load event draft</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <WizardHeader
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitle={STEPS[currentStep].title}
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
        isSaving={updateMutation.isPending}
      />

      <View style={styles.content}>
        <CurrentStepComponent
          data={eventData}
          onUpdate={handleStepData}
        />
      </View>

      <WizardFooter
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onBack={handleBack}
        onNext={handleNext}
        onPublish={handlePublish}
        isPublishing={publishMutation.isPending}
        canProceed={validateCurrentData().length === 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 16,
  },
});