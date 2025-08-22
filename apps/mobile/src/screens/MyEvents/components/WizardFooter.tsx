import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  canProceed: boolean;
}

export default function WizardFooter({ 
  currentStep, 
  totalSteps, 
  onBack, 
  onNext, 
  onPublish,
  isPublishing,
  canProceed 
}: WizardFooterProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.activeProgressDot
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton, isFirstStep && styles.hiddenButton]}
          onPress={onBack}
          disabled={isFirstStep}
        >
          <Text style={[styles.buttonText, styles.backButtonText]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            (!canProceed || isPublishing) && styles.disabledButton
          ]}
          onPress={isLastStep ? onPublish : onNext}
          disabled={!canProceed || isPublishing}
        >
          <Text style={[styles.buttonText, styles.nextButtonText]}>
            {isPublishing ? "Publishing..." : isLastStep ? "Publish" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  activeProgressDot: {
    backgroundColor: "#007AFF",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  nextButton: {
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    borderColor: "#ccc",
  },
  hiddenButton: {
    opacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonText: {
    color: "#666",
  },
  nextButtonText: {
    color: "white",
  },
});