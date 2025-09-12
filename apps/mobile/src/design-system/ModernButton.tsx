/**
 * Modern Button Component for Bole.to Mobile App
 * 
 * A comprehensive button system with multiple variants, sizes, states,
 * and accessibility features. Replaces the basic Button component with
 * professional design patterns.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './IconSystem';
import { enhancedTheme, enhancedColors } from './enhancedTheme';
import type { IconSize } from './IconSystem';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

// Button component props
interface ModernButtonProps {
  // Content
  title: string;
  subtitle?: string;
  
  // Appearance
  variant?: ButtonVariant;
  size?: ButtonSize;
  
  // Icons
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: IconSize | number;
  
  // States
  disabled?: boolean;
  loading?: boolean;
  
  // Layout
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Interaction
  onPress: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}


// Button variant configurations
const getVariantConfig = (variant: ButtonVariant) => {
  const configs = {
    primary: {
      useGradient: true,
      gradientColors: [enhancedColors.primary[400], enhancedColors.primary[600]],
      backgroundColor: enhancedColors.primary[500],
      textColor: '#FFFFFF',
      borderColor: 'transparent',
      borderWidth: 0,
      shadow: enhancedTheme.shadows.md,
    },
    secondary: {
      useGradient: false,
      backgroundColor: enhancedTheme.colors.surface.secondary,
      textColor: enhancedTheme.colors.text.primary,
      borderColor: enhancedTheme.colors.border.primary,
      borderWidth: 1,
      shadow: enhancedTheme.shadows.sm,
    },
    tertiary: {
      useGradient: false,
      backgroundColor: 'transparent',
      textColor: enhancedColors.primary[400],
      borderColor: 'transparent',
      borderWidth: 0,
      shadow: undefined,
    },
    ghost: {
      useGradient: false,
      backgroundColor: `${enhancedColors.primary[400]}1A`, // 10% opacity
      textColor: enhancedColors.primary[400],
      borderColor: `${enhancedColors.primary[400]}33`, // 20% opacity
      borderWidth: 1,
      shadow: undefined,
    },
    danger: {
      useGradient: true,
      gradientColors: [enhancedColors.error[500], enhancedColors.error[600]],
      backgroundColor: enhancedColors.error[500],
      textColor: '#FFFFFF',
      borderColor: 'transparent',
      borderWidth: 0,
      shadow: enhancedTheme.shadows.md,
    },
  };
  
  return configs[variant];
};

// Button size configurations
const getSizeConfig = (size: ButtonSize) => {
  const configs = {
    small: {
      height: 32,
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: enhancedTheme.typography.sizes.sm,
      iconSize: 'sm' as IconSize,
      borderRadius: enhancedTheme.borderRadius.sm,
    },
    medium: {
      height: 44, // Accessibility minimum touch target
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: enhancedTheme.typography.sizes.md,
      iconSize: 'md' as IconSize,
      borderRadius: enhancedTheme.borderRadius.md,
    },
    large: {
      height: 52,
      paddingHorizontal: 24,
      paddingVertical: 16,
      fontSize: enhancedTheme.typography.sizes.lg,
      iconSize: 'lg' as IconSize,
      borderRadius: enhancedTheme.borderRadius.lg,
    },
  };
  
  return configs[size];
};

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  subtitle,
  variant = 'primary',
  size = 'medium',
  leftIcon,
  rightIcon,
  iconSize,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  onPress,
  onLongPress,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  
  // Configurations
  const variantConfig = getVariantConfig(variant);
  const sizeConfig = getSizeConfig(size);
  
  // Determine if button is interactive
  const isInteractive = !disabled && !loading;
  
  
  
  const handlePress = () => {
    if (!isInteractive) return;
    onPress();
  };
  
  const handleLongPress = () => {
    if (!isInteractive || !onLongPress) return;
    onLongPress();
  };
  
  // Styles
  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    borderRadius: sizeConfig.borderRadius,
    borderWidth: variantConfig.borderWidth,
    borderColor: variantConfig.borderColor,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    minWidth: fullWidth ? undefined : 100,
    opacity: disabled ? 0.6 : 1,
    ...variantConfig.shadow,
  };
  
  const textStyles: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: enhancedTheme.typography.weights.semibold,
    color: variantConfig.textColor,
    textAlign: 'center',
  };
  
  const subtitleStyles: TextStyle = {
    fontSize: sizeConfig.fontSize - 2,
    fontWeight: enhancedTheme.typography.weights.medium,
    color: variantConfig.textColor,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  };
  
  // Icon size
  const finalIconSize = iconSize || sizeConfig.iconSize;
  
  // Content renderer
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            color={variantConfig.textColor} 
            size={size === 'small' ? 'small' : 'small'}
          />
          <Text style={[textStyles, styles.loadingText]}>Loading...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.contentContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon 
              name={leftIcon}
              size={finalIconSize}
              color={variantConfig.textColor}
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[textStyles, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={subtitleStyles} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            <Icon 
              name={rightIcon}
              size={finalIconSize}
              color={variantConfig.textColor}
            />
          </View>
        )}
      </View>
    );
  };
  
  // Button component
  if (variantConfig.useGradient) {
    return (
      <TouchableOpacity
        style={[style]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={!isInteractive}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
      >
        <LinearGradient
          colors={variantConfig.gradientColors!}
          style={[styles.gradientContainer, containerStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.solidContainer,
        containerStyle,
        { backgroundColor: variantConfig.backgroundColor },
        style,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Button group component for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  style?: ViewStyle;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  direction = 'horizontal',
  spacing = enhancedTheme.spacing.sm,
  style,
}) => {
  return (
    <View style={[
      styles.buttonGroup,
      {
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        gap: spacing,
      },
      style,
    ]}>
      {children}
    </View>
  );
};

// Icon button component for icon-only buttons
interface IconButtonProps {
  icon: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}) => {
  const sizeConfig = getSizeConfig(size);
  const squareSize = sizeConfig.height;
  
  return (
    <ModernButton
      title=""
      variant={variant}
      size={size}
      leftIcon={icon}
      disabled={disabled}
      loading={loading}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      style={[
        {
          width: squareSize,
          paddingHorizontal: 0,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  leftIconContainer: {
    marginRight: enhancedTheme.spacing.xs,
  },
  rightIconContainer: {
    marginLeft: enhancedTheme.spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: enhancedTheme.spacing.xs,
  },
  buttonGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});