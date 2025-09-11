import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/v2-neutral';

interface NewHomeTopBarNeutralProps {
  city?: string;
  onSearch?: () => void;
  onNotifications?: () => void;
  style?: any;
}

/**
 * NewHomeTopBarNeutral - Minimal calm header for photo-first design
 * Part of the modern dark & calm design system
 */
export default function NewHomeTopBarNeutral({
  city = 'Managua',
  onSearch,
  onNotifications,
  style,
}: NewHomeTopBarNeutralProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <View style={styles.city}>
          <Feather name="map-pin" size={14} color={colors.text.tertiary} />
          <Text style={styles.cityText}>{city}</Text>
        </View>
        <Pressable 
          onPress={onNotifications} 
          style={({ pressed }) => [
            styles.iconBtn, 
            pressed && { opacity: 0.8 }
          ]}
        >
          <Feather name="bell" size={18} color={colors.text.primary} />
        </Pressable>
      </View>
      <Pressable 
        onPress={onSearch} 
        style={({ pressed }) => [
          styles.search, 
          pressed && { opacity: 0.9 }
        ]}
      >
        <Feather name="search" size={16} color={colors.text.tertiary} />
        <Text style={styles.placeholder}>Find your next destination</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    paddingTop: 0, 
    paddingBottom: spacing(3), 
    paddingHorizontal: spacing(4), 
    backgroundColor: colors.bg 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing(3) 
  },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
  },
  cityText: { 
    color: colors.text.secondary, 
    fontWeight: '700' 
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  placeholder: { 
    color: colors.text.tertiary, 
    fontSize: 15 
  },
});