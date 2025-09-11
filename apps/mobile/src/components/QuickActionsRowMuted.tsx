import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii, shadow } from '../theme/v2-neutral';

const DATA = [
  { 
    key: 'tickets', 
    title: 'My Tickets', 
    subtitle: 'Boarding passes', 
    iconName: 'credit-card' as keyof typeof Feather.glyphMap
  },
  { 
    key: 'nearby', 
    title: 'Find Nearby', 
    subtitle: 'What\'s close', 
    iconName: 'map-pin' as keyof typeof Feather.glyphMap
  },
  { 
    key: 'promo', 
    title: 'Promotions', 
    subtitle: 'Limited offers', 
    iconName: 'gift' as keyof typeof Feather.glyphMap
  },
] as const;

interface QuickActionsRowMutedProps {
  onPress?: (key: string) => void;
  onTickets?: () => void;
  onNearby?: () => void;
  onPromos?: () => void;
}

/**
 * QuickActionsRowMuted - Monochrome quick actions with subtle accent dots
 * Part of the photo-first, dark & calm design system
 */
export default function QuickActionsRowMuted({ 
  onPress, 
  onTickets, 
  onNearby, 
  onPromos 
}: QuickActionsRowMutedProps) {
  
  const handlePress = (key: string) => {
    if (onPress) {
      onPress(key);
      return;
    }
    
    // Fallback to individual handlers for compatibility
    switch (key) {
      case 'tickets':
        onTickets?.();
        break;
      case 'nearby':
        onNearby?.();
        break;
      case 'promo':
        onPromos?.();
        break;
      default:
        console.log(`Quick action pressed: ${key}`);
    }
  };

  return (
    <View style={styles.container}>
      {DATA.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => handlePress(item.key)}
          style={({ pressed }) => [
            styles.card, 
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
        >
          {/* Subtle cyan accent dot */}
          <View style={styles.glowDot} />
          
          {/* Feather icon */}
          <Feather 
            name={item.iconName} 
            color={colors.text.primary} 
            size={20} 
          />
          
          {/* Text content */}
          <View style={{ marginTop: spacing(3) }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing(3),
    gap: spacing(3),
    marginVertical: spacing(2),
  },
  card: {
    flex: 1,
    height: 120,
    padding: spacing(3),
    borderRadius: radii.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.ios,
    ...shadow.android,
    justifyContent: 'flex-start',
  },
  glowDot: {
    position: 'absolute',
    top: spacing(2),
    left: spacing(2),
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  title: { 
    color: colors.text.primary, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  subtitle: { 
    color: colors.text.tertiary, 
    fontSize: 12, 
    marginTop: 2 
  },
});