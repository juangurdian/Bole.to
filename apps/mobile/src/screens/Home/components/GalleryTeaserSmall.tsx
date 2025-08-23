import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      <View style={styles.header}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {gallery.eventTitle}
        </Text>
        <Text style={styles.timeAgo}>{formatTimeAgo(gallery.releasedAt)}</Text>
      </View>

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
              <View style={styles.remainingOverlay}>
                <LinearGradient
                  colors={["transparent", "rgba(10, 13, 20, 0.8)"]}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.remainingText}>+{remainingCount}</Text>
              </View>
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 100,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
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
  },
  remainingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  remainingText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
});