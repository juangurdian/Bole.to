import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AmbientGlow from './AmbientGlow';
import { colors, spacing, radii, shadow, typography } from '../theme/v2-neutral';

interface PhotoGalleryCardV2Props {
  gallery: {
    eventId: string;
    eventTitle: string;
    thumbUrls: string[];
    releasedAt: string;
  };
  onPress: (eventId: string) => void;
}

/**
 * PhotoGalleryCardV2 - Modern released photos gallery card
 * Matches v2-neutral design system with refined, clean aesthetic
 * Features photo grid, event info, and subtle ambient glow
 */
export default function PhotoGalleryCardV2({ gallery, onPress }: PhotoGalleryCardV2Props) {
  // Format time ago
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
    <View style={styles.container}>
      {/* Subtle ambient glow */}
      <AmbientGlow color={colors.accent2} opacity={0.08} />
      
      <Pressable
        onPress={() => onPress(gallery.eventId)}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
      >
        {/* Header - Event title and time */}
        <View style={styles.header}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {gallery.eventTitle}
            </Text>
            <View style={styles.metaRow}>
              <Feather name="camera" size={12} color={colors.text.tertiary} />
              <Text style={styles.photoCount}>
                {gallery.thumbUrls.length} photos
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.timeAgo}>
                {formatTimeAgo(gallery.releasedAt)}
              </Text>
            </View>
          </View>

          {/* Release indicator */}
          <View style={styles.releaseIndicator}>
            <View style={styles.releaseDot} />
            <Text style={styles.releaseText}>New</Text>
          </View>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {displayThumbs.map((url, index) => (
            <View
              key={index}
              style={[
                styles.photoSlot,
                index % 2 === 1 && styles.rightPhoto,
                index >= 2 && styles.bottomPhoto,
              ]}
            >
              <Image 
                source={{ uri: url }} 
                style={styles.photo}
                resizeMode="cover"
              />
              
              {/* Show remaining count on last photo */}
              {index === 3 && remainingCount > 0 && (
                <View style={styles.remainingOverlay}>
                  <Text style={styles.remainingCount}>+{remainingCount}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* View Gallery CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>View Gallery</Text>
          <Feather name="arrow-right" size={14} color={colors.text.tertiary} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    marginRight: spacing(4),
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing(3),
    ...shadow.ios,
    ...shadow.android,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(3),
  },
  eventInfo: {
    flex: 1,
    paddingRight: spacing(2),
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing(1),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  photoCount: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  separator: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  timeAgo: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  releaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    backgroundColor: colors.surface2,
    borderRadius: 999,
  },
  releaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent2,
  },
  releaseText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 120,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  photoSlot: {
    width: '50%',
    height: '50%',
    padding: 0.5,
  },
  rightPhoto: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  bottomPhoto: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  photo: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 2,
  },
  remainingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  remainingCount: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ctaText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
});