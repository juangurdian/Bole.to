import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface FeedComposerButtonProps {
  onPress: () => void;
}

export default function FeedComposerButton({ onPress }: FeedComposerButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.innerCircle}>
          <Text style={styles.icon}>✏️</Text>
        </View>
      </LinearGradient>
      
      {/* Pulse animation effect */}
      <LinearGradient
        colors={[...theme.colors.gradient.primary, "transparent"]}
        style={styles.pulseRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  innerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    top: -4,
    left: -4,
    opacity: 0.3,
    zIndex: -1,
  },
});