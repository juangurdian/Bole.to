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

interface GalleryTeaserSmallProps {
  gallery: {
    eventId: string;
    eventTitle: string;
    thumbUrls: string[];
    releasedAt: string;
  };
  onPress: (eventId: string) => void;
}

export default function GalleryTeaserSmall({ gallery, onPress }: GalleryTeaserSmallProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const releaseTime = new Date(dateString);
    const diffMs = now.getTime() - releaseTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const displayThumbs = gallery.thumbUrls.slice(0, 4);
  const remainingCount = gallery.thumbUrls.length - 4;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(gallery.eventId)}
      activeOpacity={0.9}
    >
      {/* Glass overlay for depth */}
      <LinearGradient
        colors={theme.effects.gradientOverlays.cardTop}
        style={styles.glassOverlay}
      />
      
      <BlurView
        intensity={60}
        tint="dark"
        style={styles.header}
      >
        <Text style={styles.eventTitle} numberOfLines={1}>
          {gallery.eventTitle}
        </Text>
        <LinearGradient
          colors={theme.colors.gradient.accent}
          style={styles.timeChip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.timeAgo}>{formatTimeAgo(gallery.releasedAt)}</Text>
        </LinearGradient>
      </BlurView>

      <View style={styles.thumbnailGrid}>
        {displayThumbs.map((url, index) => (
          <View
            key={index}
            style={[
              styles.thumbnailSlot,
              index % 2 === 1 && styles.rightThumbnail,
              index >= 2 && styles.bottomThumbnail,
            ]}
          >
            <Image source={{ uri: url }} style={styles.thumbnail} />
            {index === 3 && remainingCount > 0 && (
              <BlurView
                intensity={80}
                tint="dark"
                style={styles.remainingOverlay}
              >
                <LinearGradient
                  colors={theme.colors.gradient.warm}
                  style={styles.remainingBadge}
                >
                  <Text style={styles.remainingText}>+{remainingCount}</Text>
                </LinearGradient>
              </BlurView>
            )}
          </View>
        ))}
      </View>

      <LinearGradient
        colors={["transparent", theme.colors.gradient.primary[0]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomGradient}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.effects.glass.secondary,
    position: "relative",
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    zIndex: 1,
  },
  header: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.effects.backdrop.dark,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    overflow: "hidden",
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeChip: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
  },
  timeAgo: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 100,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.effects.glass.primary,
  },
  thumbnailSlot: {
    width: "50%",
    height: "50%",
    padding: 1,
  },
  rightThumbnail: {
    paddingLeft: 0,
  },
  bottomThumbnail: {
    paddingTop: 0,
  },
  thumbnail: {
    flex: 1,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: 2,
  },
  remainingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.effects.backdrop.darker,
  },
  remainingBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.md,
  },
  remainingText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    opacity: 0.8,
  },
});