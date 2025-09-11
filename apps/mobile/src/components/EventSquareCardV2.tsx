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
  price: string;
  coverUrl: string;
  status?: 'Hot' | 'New' | 'Sold Out' | 'live' | 'upcoming' | 'ended';
  glow?: 'cyan' | 'indigo';
  onPress?: () => void;
};

const SIZE = 168;

/**
 * EventSquareCardV2 - Photo-first event card with ambient glow
 * Part of the modern dark & calm design system
 */
export default function EventSquareCardV2({
  title,
  venue,
  datetime,
  price,
  coverUrl,
  status,
  glow = 'cyan',
  onPress,
}: Props) {
  const glowColor = glow === 'indigo' ? colors.accent2 : colors.accent;

  // Format status display text
  const getStatusDisplay = () => {
    if (!status) return null;
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'upcoming':
        return 'Soon';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!status) return colors.accent;
    switch (status) {
      case 'Hot':
      case 'live':
        return colors.error;
      case 'Sold Out':
      case 'ended':
        return colors.text.tertiary;
      case 'New':
      case 'upcoming':
        return colors.accent;
      default:
        return colors.accent;
    }
  };

  return (
    <View style={{ width: SIZE }}>
      <AmbientGlow color={glowColor} opacity={0.16} />
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          styles.card, 
          pressed && { transform: [{ scale: 0.99 }] }
        ]}
      >
        <Image source={{ uri: coverUrl }} style={styles.image} />
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Top-right price pill (neutral) */}
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>{price}</Text>
        </View>

        {/* Bottom info */}
        <View style={styles.bottom}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color={colors.text.tertiary} />
            <Text numberOfLines={1} style={styles.meta}>
              {venue} • {datetime}
            </Text>
          </View>
        </View>

        {/* Minimal status chip (subtle pop) */}
        {!!status && (
          <View style={styles.badge}>
            <View
              style={[
                styles.dot,
                { backgroundColor: getStatusColor() },
              ]}
            />
            <Text style={styles.badgeText}>{getStatusDisplay()}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.ios,
    ...shadow.android,
    marginRight: spacing(3),
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  pricePill: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  priceText: { 
    color: colors.text.primary, 
    fontWeight: '700', 
    fontSize: 12, 
    letterSpacing: 0.2 
  },
  bottom: { 
    position: 'absolute', 
    left: spacing(2), 
    right: spacing(2), 
    bottom: spacing(2) 
  },
  title: { 
    color: colors.text.primary, 
    fontSize: 15, 
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
  badge: {
    position: 'absolute',
    left: spacing(2),
    top: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginRight: 6 
  },
  badgeText: { 
    color: colors.text.secondary, 
    fontSize: 11, 
    fontWeight: '700' 
  },
});