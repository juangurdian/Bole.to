import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Svg, Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { theme } from "../../theme";

interface BoletoTabItemProps {
  label: string;
  iconType: "home" | "search" | "tickets" | "feed" | "profile";
  active: boolean;
  onPress: () => void;
  testID?: string;
}


export default function BoletoTabItem({
  label,
  iconType,
  active,
  onPress,
  testID,
}: BoletoTabItemProps) {
  const handlePress = () => {
    onPress();
  };

  const renderIcon = () => {
    const iconSize = 24;
    const iconColor = active ? theme.colors.nav.white : theme.colors.nav.textDim;

    if (iconType === "tickets") {
      if (active) {
        // Gradient ticket stub with glow
        return (
          <View style={styles.ticketIconContainer}>
            {/* Blue glow */}
            <View
              style={[
                styles.glowBox,
                {
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
                  shadowColor: theme.colors.nav.glowOrange,
                  ...theme.shadows.glow,
                },
              ]}
            />
            {/* Gradient ticket icon */}
            <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
              <Defs>
                <SvgGradient id="ticketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={theme.colors.gradient.ticket[0]} />
                  <Stop offset="100%" stopColor={theme.colors.gradient.ticket[1]} />
                </SvgGradient>
              </Defs>
              <Path
                d="M20 12V6.5C20 5.67 19.33 5 18.5 5H15.5C14.95 5 14.5 4.55 14.5 4S13.95 3 13.5 3H10.5C9.95 3 9.5 3.45 9.5 4S8.95 5 8.5 5H5.5C4.67 5 4 5.67 4 6.5V12C4.83 12 5.5 12.67 5.5 13.5S4.83 15 4 15V17.5C4 18.33 4.67 19 5.5 19H8.5C8.95 19 9.5 19.45 9.5 20S10.05 21 10.5 21H13.5C14.05 21 14.5 20.55 14.5 20S15.05 19 15.5 19H18.5C19.33 19 20 18.33 20 17.5V15C19.17 15 18.5 14.33 18.5 13.5S19.17 12 20 12Z"
                fill="url(#ticketGrad)"
              />
            </Svg>
          </View>
        );
      } else {
        // Outline ticket stub
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
            <Path
              d="M20 12V6.5C20 5.67 19.33 5 18.5 5H15.5C14.95 5 14.5 4.55 14.5 4S13.95 3 13.5 3H10.5C9.95 3 9.5 3.45 9.5 4S8.95 5 8.5 5H5.5C4.67 5 4 5.67 4 6.5V12C4.83 12 5.5 12.67 5.5 13.5S4.83 15 4 15V17.5C4 18.33 4.67 19 5.5 19H8.5C8.95 19 9.5 19.45 9.5 20S10.05 21 10.5 21H13.5C14.05 21 14.5 20.55 14.5 20S15.05 19 15.5 19H18.5C19.33 19 20 18.33 20 17.5V15C19.17 15 18.5 14.33 18.5 13.5S19.17 12 20 12ZM18 16.5V17H16V16.5C16 15.67 15.33 15 14.5 15H13.5V13.5H14.5C15.33 13.5 16 12.83 16 12V7H18V7.5C18 8.33 18.67 9 19.5 9H20V10.5H19.5C18.67 10.5 18 11.17 18 12V16.5Z"
              fill="none"
              stroke={iconColor}
              strokeWidth={1.5}
            />
          </Svg>
        );
      }
    }

    // Other icons using vector icons
    switch (iconType) {
      case "home":
        return <Feather name="home" size={iconSize} color={iconColor} />;
      case "search":
        return <Feather name="search" size={iconSize} color={iconColor} />;
      case "feed":
        return <Ionicons name="menu-outline" size={iconSize} color={iconColor} />;
      case "profile":
        return <Feather name="user" size={iconSize} color={iconColor} />;
      default:
        return <Feather name="circle" size={iconSize} color={iconColor} />;
    }
  };

  const labelColor = iconType === "tickets" && active 
    ? theme.colors.nav.white 
    : active 
    ? theme.colors.nav.white 
    : theme.colors.nav.textDim;

  return (
    <TouchableOpacity
      style={[styles.container]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} tab`}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {renderIcon()}
        </View>
        <Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    height: 28,
  },
  ticketIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  glowBox: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    textAlign: "center",
  },
});