import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemedInputProps } from './types';
import { colors, spacing, radii, typography } from '../../../theme/v2-neutral';

export function ThemedInput({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  style,
  error,
  warning,
  helpText,
  required = false,
  keyboardType = 'default'
}: ThemedInputProps) {
  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const characterCount = maxLength ? value.length : undefined;
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {maxLength && (
          <Text style={[styles.characterCount, hasError && styles.characterCountError]}>
            {characterCount}/{maxLength}
          </Text>
        )}
      </View>
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          hasError && styles.inputError,
          hasWarning && !hasError && styles.inputWarning,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
        autoCorrect={true}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {warning && !error && (
        <Text style={styles.warningText}>{warning}</Text>
      )}
      
      {helpText && !error && !warning && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(4),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing(2),
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  required: {
    color: colors.error,
  },
  characterCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  characterCountError: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.surface2,
    minHeight: 44, // Minimum touch target
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}08`, // 8% opacity
  },
  inputWarning: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}08`, // 8% opacity
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing(1),
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    marginTop: spacing(1),
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },
  helpText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing(1),
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },
});