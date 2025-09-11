import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type Props = {
  color?: string;
  opacity?: number; // overall intensity
  style?: ViewStyle; // position absolute under a card
};

/**
 * AmbientGlow - Soft halo effect behind cards
 * Creates a subtle radial gradient glow for modern card aesthetics
 * Position absolutely behind cards for a floating effect
 */
export default function AmbientGlow({ 
  color = '#2EE1FF', 
  opacity = 0.18, 
  style 
}: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, style]}>
      <Svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="60%" stopColor={color} stopOpacity={opacity * 0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#ambientGlow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { 
    position: 'absolute', 
    left: -30, 
    right: -30, 
    top: -30, 
    bottom: -30,
    zIndex: -1, // Ensure it stays behind the card
  },
});