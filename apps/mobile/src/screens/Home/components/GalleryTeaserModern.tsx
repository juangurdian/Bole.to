import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";

interface GalleryTeaserModernProps {
  gallery: {
    eventId: string;
    eventTitle: string;
    revealAt?: string;
    releasedAt?: string;
    previewUrls: string[];
    photoCount: number;
  };
  onPress: () => void;
}

export default function GalleryTeaserModern({ gallery, onPress }: GalleryTeaserModernProps) {
  const isReleased = !!gallery.releasedAt;
  const timeUntilReveal = gallery.revealAt ? 
    Math.max(0, Math.floor((new Date(gallery.revealAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

  const getStatusInfo = () => {
    if (isReleased) {
      return {
        text: "Photos Released",
        gradient: theme.colors.gradient.accent,
        icon: "✨"
      };
    } else if (timeUntilReveal <= 24 && timeUntilReveal > 0) {
      return {
        text: `${timeUntilReveal}h to reveal`,
        gradient: theme.colors.gradient.warm,
        icon: "⏰"
      };
    } else {
      return {
        text: "Coming Soon",
        gradient: theme.colors.gradient.primary,
        icon: "🔒"
      };
    }
  };

  const status = getStatusInfo();
  const displayUrls = gallery.previewUrls.slice(0, 4);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Enhanced glow effect */}
        <LinearGradient
          colors={[
            ...status.gradient,
            status.gradient[0] + "30",
            "transparent"
          ]}
          style={styles.outerGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Premium gradient border */}
        <LinearGradient
          colors={status.gradient}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.cardInner}>
          {/* Glassmorphism header */}
          <BlurView intensity={100} tint="dark" style={styles.header}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.1)",
                "rgba(255,255,255,0.05)"
              ]}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {gallery.eventTitle}
                  </Text>
                  
                  {/* Enhanced status chip */}
                  <View style={styles.statusContainer}>
                    <LinearGradient
                      colors={status.gradient}
                      style={styles.statusGradient}
                    >
                      <Text style={styles.statusIcon}>{status.icon}</Text>
                      <Text style={styles.statusText}>{status.text}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Enhanced photo grid */}
          <View style={styles.photoGrid}>
            {displayUrls.map((url, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image
                  source={{ uri: url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                
                {/* Glass overlay for unreleased photos */}
                {!isReleased && (
                  <BlurView intensity={80} tint="dark" style={styles.photoOverlay}>
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.05)"
                      ]}
                      style={styles.overlayGradient}
                    >
                      <Text style={styles.lockIcon}>🔒</Text>
                    </LinearGradient>
                  </BlurView>
                )}
                
                {/* Enhanced image border */}
                <LinearGradient
                  colors={[
                    ...status.gradient,
                    "transparent"
                  ]}
                  style={styles.imageBorder}
                />
              </View>
            ))}
          </View>

          {/* Modern footer with photo count */}
          <BlurView intensity={80} tint="dark" style={styles.footer}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.08)",
                "rgba(255,255,255,0.02)"
              ]}
              style={styles.footerGradient}
            >
              <View style={styles.footerContent}>
                <View style={styles.countContainer}>
                  <Text style={styles.countIcon}>📸</Text>
                  <Text style={styles.countText}>
                    {gallery.photoCount} {gallery.photoCount === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
                
                {!isReleased && (
                  <View style={styles.remainingContainer}>
                    <LinearGradient
                      colors={status.gradient}
                      style={styles.remainingBadge}
                    >
                      <Text style={styles.remainingText}>
                        +{Math.max(0, gallery.photoCount - 4)} more
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </LinearGradient>
            
            {/* Bottom accent */}
            <LinearGradient
              colors={[...status.gradient, "transparent"]}
              style={styles.bottomAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </BlurView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    marginRight: theme.spacing.md,
  },
  card: {
    height: 200,
    borderRadius: theme.borderRadius.xl,
    position: "relative",
    overflow: "hidden",
  },
  outerGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: theme.borderRadius.xl + 4,
    zIndex: -2,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: theme.borderRadius.xl + 1,
    zIndex: -1,
  },
  cardInner: {
    flex: 1,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  header: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  statusGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    gap: theme.spacing.xs,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  photoGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  photoContainer: {
    width: "48%",
    aspectRatio: 1,
    position: "relative",
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.md,
  },
  lockIcon: {
    fontSize: 20,
    opacity: 0.8,
  },
  imageBorder: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: theme.borderRadius.md + 1,
    zIndex: -1,
    opacity: 0.6,
  },
  footer: {
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  footerGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  countIcon: {
    fontSize: 14,
  },
  countText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  remainingContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  remainingBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  remainingText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  bottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
});