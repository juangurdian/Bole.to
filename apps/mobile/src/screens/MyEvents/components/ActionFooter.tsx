import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { ActionFooterProps } from './types';
import { colors, spacing, radii, typography } from '../../../theme/v2-neutral';

export function ActionFooter({
  onSaveDraft,
  onCreateEvent,
  isValid,
  isLoading,
  isDirty,
  lastSaved
}: ActionFooterProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Saved now';
    if (diffMinutes === 1) return 'Saved 1 minute ago';
    if (diffMinutes < 60) return `Saved ${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'Saved 1 hour ago';
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  };
  
  return (
    <View style={styles.container}>
      {/* Auto-save status */}
      <View style={styles.statusContainer}>
        {isLoading ? (
          <View style={styles.savingStatus}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.statusText}>Saving...</Text>
          </View>
        ) : isDirty ? (
          <Text style={styles.statusText}>Unsaved changes</Text>
        ) : lastSaved ? (
          <Text style={styles.statusText}>{formatLastSaved(lastSaved)}</Text>
        ) : (
          <Text style={styles.statusText}>Ready to save</Text>
        )}
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.draftButton]}
          onPress={onSaveDraft}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.draftButtonText]}>
            Save Draft
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton,
            !isValid && styles.disabledButton
          ]}
          onPress={onCreateEvent}
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Create Event
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
    paddingBottom: spacing(6), // Extra padding for safe area
  },
  statusContainer: {
    marginBottom: spacing(3),
    alignItems: 'center',
  },
  savingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginLeft: spacing(2),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  button: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Minimum touch target
  },
  draftButton: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  disabledButton: {
    backgroundColor: colors.surface3,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  draftButtonText: {
    color: colors.text.primary,
  },
  primaryButtonText: {
    color: colors.bg, // Dark text on bright accent
  },
});