import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AmbientGlow from './AmbientGlow';
import { colors, spacing, radii, shadow } from '../theme/v2-neutral';

type Props = {
  title: string;
  venue: string;
  datetime: string;
  distance?: string;
  price: string;
  coverUrl: string;
  glow?: 'cyan' | 'indigo';
  onPress?: () => void;
};

/**
 * EventWideCardV2 - Photo-first wide event card with ambient glow
 * Part of the modern dark & calm design system
 */
export default function EventWideCardV2({
  title,
  venue,
  datetime,
  distance = '•',
  price,
  coverUrl,
  glow = 'indigo',
  onPress,
}: Props) {
  const glowColor = glow === 'cyan' ? colors.accent : colors.accent2;

  return (
    <View style={{ marginHorizontal: spacing(4), marginBottom: spacing(3) }}>
      <AmbientGlow color={glowColor} opacity={0.14} />
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          styles.card, 
          pressed && { transform: [{ scale: 0.99 }] }
        ]}
      >
        <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <View style={styles.left}>
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={12} color={colors.text.tertiary} />
              <Text numberOfLines={1} style={styles.meta}>
                {venue} • {datetime} {distance !== '•' ? `• ${distance}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.cta}>
            <Text style={styles.price}>{price}</Text>
            <Feather name="chevron-right" color={colors.text.secondary} size={18} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 140,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.ios,
    ...shadow.android,
  },
  content: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: { 
    flex: 1, 
    paddingRight: spacing(2) 
  },
  title: { 
    color: colors.text.primary, 
    fontSize: 17, 
    fontWeight: '800' 
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4 
  },
  meta: { 
    color: colors.text.tertiary, 
    fontSize: 12, 
    marginLeft: 4 
  },
  cta: {
    height: 36,
    paddingHorizontal: spacing(2),
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: { 
    color: colors.text.primary, 
    fontWeight: '800', 
    fontSize: 13 
  },
});