// v2-neutral.ts - Photo-first, dark & calm design system
// Neutral dark palette with subtle accents for modern aesthetic

export const colors = {
  bg: '#0A0C10', // page background (near-black)
  surface1: '#0D1016', // card base
  surface2: '#111622', // elevated
  surface3: '#151B2C',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: '#E9EEF7',
    secondary: '#B2BDD1',
    tertiary: '#8894A8',
  },
  // ultra-subtle accents (used for dots, strokes, small pills — not backgrounds)
  accent: '#2EE1FF', // cyan pop
  accent2: '#98A7FF', // indigo pop
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#F43F5E',
};

export const radii = { 
  sm: 10, 
  md: 14, 
  lg: 20, 
  xl: 28 
};

export const spacing = (n: number) => n * 4;

export const shadow = {
  // keep shadows mild; main "glow" comes from the AmbientGlow component
  ios: { 
    shadowColor: 'black', 
    shadowOpacity: 0.25, 
    shadowRadius: 16, 
    shadowOffset: { width: 0, height: 8 } 
  },
  android: { 
    elevation: 4 
  },
};

// Typography system for consistent text styling
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Animation timing for consistent micro-interactions
export const animations = {
  duration: {
    fast: 150,
    medium: 250,
    slow: 350,
  },
  easing: {
    easeOut: [0.25, 0.46, 0.45, 0.94] as const,
    easeIn: [0.55, 0.06, 0.68, 0.19] as const,
    easeInOut: [0.42, 0, 0.58, 1] as const,
  },
};

// Gradient definitions for neutral backgrounds
export const gradients = {
  background: [colors.bg, '#0B0F16', '#0A0C10'],
  cardOverlay: ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.65)'],
  pillBackground: 'rgba(10,12,16,0.55)',
};