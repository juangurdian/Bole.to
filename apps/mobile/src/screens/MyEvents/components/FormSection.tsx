import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormSectionProps } from './types';
import { colors, spacing, radii, typography } from '../../../theme/v2-neutral';

export function FormSection({ title, description, children, style }: FormSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    marginBottom: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4),
    paddingBottom: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  content: {
    padding: spacing(4),
  },
});