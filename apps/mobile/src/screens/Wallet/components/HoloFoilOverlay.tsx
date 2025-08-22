import React from "react";
import { View, StyleSheet } from "react-native";

interface HoloFoilOverlayProps {
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  intensity: number;
}

export default function HoloFoilOverlay({ 
  primaryColor, 
  secondaryColor, 
  pattern, 
  intensity 
}: HoloFoilOverlayProps) {

  const getPatternGradient = () => {
    switch (pattern) {
      case "electric_waves":
        return `linear-gradient(45deg, ${primaryColor}33, ${secondaryColor}33, ${primaryColor}33)`;
      case "diamond_burst":
        return `radial-gradient(circle, ${primaryColor}44, ${secondaryColor}44, ${primaryColor}44)`;
      case "laugh_lines":
        return `linear-gradient(90deg, ${primaryColor}22, ${secondaryColor}22, ${primaryColor}22)`;
      case "celebration_burst":
        return `conic-gradient(${primaryColor}55, ${secondaryColor}55, ${primaryColor}55)`;
      case "jazz_notes":
        return `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}33)`;
      default:
        return `linear-gradient(45deg, ${primaryColor}33, ${secondaryColor}33)`;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base holographic layer */}
      <View 
        style={[
          styles.layer, 
          { 
            backgroundColor: primaryColor,
            opacity: intensity * 0.08,
          }
        ]} 
      />
      
      {/* Pattern layer */}
      <View 
        style={[
          styles.layer, 
          { 
            backgroundColor: secondaryColor,
            opacity: intensity * 0.05,
          }
        ]} 
      />

      {/* Micro patterns */}
      {pattern === "diamond_burst" && (
        <View style={styles.diamondPattern}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View 
              key={i}
              style={[
                styles.diamond,
                {
                  backgroundColor: i % 2 === 0 ? primaryColor : secondaryColor,
                  opacity: intensity * 0.1,
                  left: `${20 + (i * 12)}%`,
                  top: `${30 + ((i % 2) * 20)}%`,
                }
              ]} 
            />
          ))}
        </View>
      )}

      {pattern === "electric_waves" && (
        <View style={styles.wavePattern}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View 
              key={i}
              style={[
                styles.wave,
                {
                  backgroundColor: primaryColor,
                  opacity: intensity * 0.06,
                  transform: [{ rotate: `${i * 15}deg` }],
                  top: `${i * 25}%`,
                }
              ]} 
            />
          ))}
        </View>
      )}

      {/* Foil reflection spots */}
      <View style={styles.reflectionSpots}>
        <View 
          style={[
            styles.spot,
            {
              backgroundColor: "rgba(255,255,255," + (intensity * 0.15) + ")",
              top: "20%",
              left: "70%",
            }
          ]} 
        />
        <View 
          style={[
            styles.spot,
            {
              backgroundColor: "rgba(255,255,255," + (intensity * 0.1) + ")",
              top: "60%",
              left: "30%",
              width: 12,
              height: 12,
            }
          ]} 
        />
        <View 
          style={[
            styles.spot,
            {
              backgroundColor: "rgba(255,255,255," + (intensity * 0.08) + ")",
              top: "80%",
              left: "80%",
              width: 6,
              height: 6,
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  diamondPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  diamond: {
    position: "absolute",
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
  },
  wavePattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wave: {
    position: "absolute",
    width: "120%",
    height: 2,
    left: "-10%",
  },
  reflectionSpots: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  spot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});