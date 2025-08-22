import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface WizardHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  onCancel: () => void;
  onSaveDraft: () => void;
  isSaving: boolean;
}

export default function WizardHeader({ 
  currentStep, 
  totalSteps, 
  stepTitle, 
  onCancel, 
  onSaveDraft,
  isSaving 
}: WizardHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      
      <View style={styles.center}>
        <Text style={styles.title}>{stepTitle}</Text>
        <Text style={styles.progress}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>
      
      <TouchableOpacity onPress={onSaveDraft} disabled={isSaving}>
        <Text style={[styles.saveText, isSaving && styles.savingText]}>
          {isSaving ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  center: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  progress: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  saveText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  savingText: {
    color: "#999",
  },
});