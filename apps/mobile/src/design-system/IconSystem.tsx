/**
 * Professional Icon System for Bole.to Mobile App
 * 
 * Replaces emoji icons with professional Feather icons while maintaining
 * the existing custom ticket icon for brand consistency.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Svg, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';
import { enhancedColors } from './enhancedTheme';

// Icon size system
export const iconSizes = {
  xs: 12,   // Inline text icons
  sm: 16,   // List item icons, small buttons
  md: 20,   // Form inputs, medium buttons  
  lg: 24,   // Navigation, primary actions
  xl: 32,   // Feature highlights, empty states
  xxl: 48,  // Onboarding, major features
} as const;

export type IconSize = keyof typeof iconSizes;

// Icon variants
export type IconVariant = 'filled' | 'outline' | 'minimal';

// Professional icon mapping (replaces emojis)
export const iconMap = {
  // Core actions (replacing emojis)
  search: 'search',           // 🔍 -> search
  location: 'map-pin',        // 📍 -> map-pin
  notifications: 'bell',      // 🔔 -> bell
  promotions: 'gift',         // 🎁 -> gift
  mobile: 'smartphone',       // 📱 -> smartphone
  profile: 'user',           // 👤 -> user
  favorites: 'heart',         // ❤️ -> heart
  calendar: 'calendar',       // 📅 -> calendar
  tags: 'tag',               // 🏷️ -> tag
  
  // Navigation
  home: 'home',
  discover: 'search',
  feed: 'menu',
  tickets: 'custom-ticket',   // Keep custom gradient ticket
  
  // Common actions
  share: 'share-2',
  settings: 'settings',
  help: 'help-circle',
  info: 'info',
  check: 'check',
  close: 'x',
  plus: 'plus',
  minus: 'minus',
  edit: 'edit-3',
  delete: 'trash-2',
  download: 'download',
  upload: 'upload',
  
  // Navigation arrows
  arrow: {
    left: 'arrow-left',
    right: 'arrow-right',
    up: 'arrow-up',
    down: 'arrow-down',
  },
  
  // Chevrons
  chevron: {
    left: 'chevron-left',
    right: 'chevron-right',
    up: 'chevron-up',
    down: 'chevron-down',
  },
  
  // Media
  camera: 'camera',
  image: 'image',
  video: 'video',
  play: 'play',
  pause: 'pause',
  
  // Communication
  message: 'message-circle',
  mail: 'mail',
  phone: 'phone',
  
  // Status
  warning: 'alert-triangle',
  error: 'alert-circle',
  success: 'check-circle',
  loading: 'loader',
  
  // Social
  like: 'heart',
  comment: 'message-circle',
  bookmark: 'bookmark',
  
  // Events
  event: 'calendar',
  venue: 'map-pin',
  time: 'clock',
  date: 'calendar',
  
  // Payment
  card: 'credit-card',
  money: 'dollar-sign',
  
  // Other
  filter: 'filter',
  sort: 'arrow-up-down',
  refresh: 'refresh-cw',
  external: 'external-link',
  copy: 'copy',
} as const;

// Icon color system
export const iconColors = {
  primary: enhancedColors.primary[400],
  secondary: enhancedColors.neutrals.dark[100],
  tertiary: enhancedColors.neutrals.dark[300],
  success: enhancedColors.success[500],
  error: enhancedColors.error[500],
  warning: enhancedColors.warning[500],
  onPrimary: '#FFFFFF',
  onSecondary: enhancedColors.neutrals.dark[50],
} as const;

// Custom Ticket Icon Component (maintains existing gradient)
interface CustomTicketIconProps {
  size: number;
  active?: boolean;
  colors?: [string, string];
}

export const CustomTicketIcon: React.FC<CustomTicketIconProps> = ({ 
  size, 
  active = false,
  colors = theme.colors.gradient.ticket as [string, string]
}) => {
  if (active) {
    return (
      <View style={styles.ticketIconContainer}>
        {/* Blue glow */}
        <View
          style={[
            styles.glowBox,
            {
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
              shadowColor: theme.colors.nav.glowBlue,
              ...theme.shadows.glow,
            },
          ]}
        />
        {/* Orange glow */}
        <View
          style={[
            styles.glowBox,
            {
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
              shadowColor: theme.colors.nav.glowOrange,
              ...theme.shadows.glow,
            },
          ]}
        />
        {/* Gradient ticket icon */}
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <SvgGradient id="ticketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </SvgGradient>
          </Defs>
          <Path
            d="M20 12V6.5C20 5.67 19.33 5 18.5 5H15.5C14.95 5 14.5 4.55 14.5 4S13.95 3 13.5 3H10.5C9.95 3 9.5 3.45 9.5 4S8.95 5 8.5 5H5.5C4.67 5 4 5.67 4 6.5V12C4.83 12 5.5 12.67 5.5 13.5S4.83 15 4 15V17.5C4 18.33 4.67 19 5.5 19H8.5C8.95 19 9.5 19.45 9.5 20S10.05 21 10.5 21H13.5C14.05 21 14.5 20.55 14.5 20S15.05 19 15.5 19H18.5C19.33 19 20 18.33 20 17.5V15C19.17 15 18.5 14.33 18.5 13.5S19.17 12 20 12Z"
            fill="url(#ticketGrad)"
          />
        </Svg>
      </View>
    );
  }
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 12V6.5C20 5.67 19.33 5 18.5 5H15.5C14.95 5 14.5 4.55 14.5 4S13.95 3 13.5 3H10.5C9.95 3 9.5 3.45 9.5 4S8.95 5 8.5 5H5.5C4.67 5 4 5.67 4 6.5V12C4.83 12 5.5 12.67 5.5 13.5S4.83 15 4 15V17.5C4 18.33 4.67 19 5.5 19H8.5C8.95 19 9.5 19.45 9.5 20S10.05 21 10.5 21H13.5C14.05 21 14.5 20.55 14.5 20S15.05 19 15.5 19H18.5C19.33 19 20 18.33 20 17.5V15C19.17 15 18.5 14.33 18.5 13.5S19.17 12 20 12ZM18 16.5V17H16V16.5C16 15.67 15.33 15 14.5 15H13.5V13.5H14.5C15.33 13.5 16 12.83 16 12V7H18V7.5C18 8.33 18.67 9 19.5 9H20V10.5H19.5C18.67 10.5 18 11.17 18 12V16.5Z"
        fill="none"
        stroke={iconColors.secondary}
        strokeWidth={1.5}
      />
    </Svg>
  );
};

// Main Icon Component
interface IconProps {
  name: keyof typeof iconMap | string;
  size?: IconSize | number;
  color?: string;
  variant?: IconVariant;
  style?: any;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = iconColors.secondary,
  variant = 'outline',
  style,
  testID,
}) => {
  const iconSize = typeof size === 'number' ? size : iconSizes[size];
  
  // Handle custom ticket icon
  if (name === 'custom-ticket' || name === 'tickets') {
    return (
      <CustomTicketIcon 
        size={iconSize} 
        active={false}
        testID={testID}
      />
    );
  }
  
  // Handle nested icon names (like arrow.left)
  let iconName = name;
  if (typeof name === 'string' && name.includes('.')) {
    const [category, direction] = name.split('.');
    const categoryMap = iconMap[category as keyof typeof iconMap];
    if (typeof categoryMap === 'object' && direction in categoryMap) {
      iconName = categoryMap[direction as keyof typeof categoryMap];
    }
  } else if (name in iconMap) {
    const mappedIcon = iconMap[name as keyof typeof iconMap];
    iconName = typeof mappedIcon === 'string' ? mappedIcon : name;
  }
  
  return (
    <Feather 
      name={iconName as any}
      size={iconSize}
      color={color}
      style={style}
      testID={testID}
    />
  );
};

// Quick Action Icon Replacement Component
interface QuickActionIconProps {
  type: 'search' | 'location' | 'promotions' | 'tickets' | 'notifications';
  size?: IconSize | number;
  active?: boolean;
  style?: any;
}

export const QuickActionIcon: React.FC<QuickActionIconProps> = ({
  type,
  size = 'lg',
  active = false,
  style,
}) => {
  const iconSize = typeof size === 'number' ? size : iconSizes[size];
  const color = active ? iconColors.onPrimary : iconColors.secondary;
  
  switch (type) {
    case 'search':
      return <Icon name="search" size={iconSize} color={color} style={style} />;
    case 'location':
      return <Icon name="location" size={iconSize} color={color} style={style} />;
    case 'promotions':
      return <Icon name="promotions" size={iconSize} color={color} style={style} />;
    case 'notifications':
      return <Icon name="notifications" size={iconSize} color={color} style={style} />;
    case 'tickets':
      return <CustomTicketIcon size={iconSize} active={active} />;
    default:
      return <Icon name="help-circle" size={iconSize} color={color} style={style} />;
  }
};

// Icon with Background Component
interface IconWithBackgroundProps extends IconProps {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
}

export const IconWithBackground: React.FC<IconWithBackgroundProps> = ({
  backgroundColor = enhancedColors.primary[400],
  borderRadius = 8,
  padding = 8,
  ...iconProps
}) => {
  return (
    <View style={[
      styles.iconBackground,
      {
        backgroundColor,
        borderRadius,
        padding,
      }
    ]}>
      <Icon {...iconProps} color={iconColors.onPrimary} />
    </View>
  );
};

// Utility function to get icon name from emoji
export const getIconFromEmoji = (emoji: string): keyof typeof iconMap => {
  const emojiToIcon: Record<string, keyof typeof iconMap> = {
    '🔍': 'search',
    '📍': 'location', 
    '🔔': 'notifications',
    '🎫': 'tickets',
    '🎁': 'promotions',
    '📱': 'mobile',
    '👤': 'profile',
    '❤️': 'favorites',
    '📅': 'calendar',
    '🏷️': 'tags',
  };
  
  return emojiToIcon[emoji] || 'help-circle';
};

// Accessibility helper for icons
export const getIconAccessibilityProps = (iconName: string, label?: string) => {
  return {
    accessibilityRole: 'image' as const,
    accessibilityLabel: label || `${iconName} icon`,
    importantForAccessibility: 'yes' as const,
  };
};

const styles = StyleSheet.create({
  ticketIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});