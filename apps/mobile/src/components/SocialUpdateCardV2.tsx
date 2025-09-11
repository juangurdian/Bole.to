import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AmbientGlow from './AmbientGlow';
import { colors, spacing, radii, shadow, typography } from '../theme/v2-neutral';

interface SocialUpdateCardV2Props {
  update: {
    id: string;
    type: "announcement" | "post" | "poll" | "gallery" | "update";
    title: string;
    description?: string;
    timestamp: string;
    author: {
      name: string;
      avatar?: string;
    };
    event?: {
      name: string;
      date: string;
    };
    media?: {
      type: "image" | "video";
      url: string;
      thumbnail?: string;
    };
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
  onPress: (updateId: string) => void;
}

/**
 * SocialUpdateCardV2 - Modern social update card design
 * Shows who posted, when, what they posted, and clear event context
 * Designed to entice users to open and go to event feed
 */
export default function SocialUpdateCardV2({ update, onPress }: SocialUpdateCardV2Props) {
  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}d`;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "announcement": return "megaphone";
      case "post": return "edit";
      case "poll": return "bar-chart-2";
      case "gallery": return "camera";
      case "update": return "file-text";
      default: return "message-square";
    }
  };

  // Get engagement total
  const getTotalEngagement = () => {
    if (!update.engagement) return 0;
    return update.engagement.likes + update.engagement.comments + update.engagement.shares;
  };

  return (
    <View style={styles.container}>
      {/* Subtle ambient glow */}
      <AmbientGlow color={colors.accent} opacity={0.08} />
      
      <Pressable
        onPress={() => onPress(update.id)}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
      >
        {/* Header - Author & Time */}
        <View style={styles.header}>
          <View style={styles.authorSection}>
            {update.author.avatar ? (
              <Image 
                source={{ uri: update.author.avatar }} 
                style={styles.authorAvatar}
              />
            ) : (
              <View style={[styles.authorAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.authorInitials}>
                  {update.author.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>
                {update.author.name}
              </Text>
              <View style={styles.metaRow}>
                <Feather 
                  name={getTypeIcon(update.type) as keyof typeof Feather.glyphMap} 
                  size={12} 
                  color={colors.text.tertiary} 
                />
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(update.timestamp)}
                </Text>
              </View>
            </View>
          </View>

          {/* Engagement indicator */}
          {getTotalEngagement() > 0 && (
            <View style={styles.engagementBadge}>
              <Feather name="heart" size={12} color={colors.accent} />
              <Text style={styles.engagementCount}>
                {getTotalEngagement()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.updateTitle} numberOfLines={2}>
            {update.title}
          </Text>
          
          {update.description && (
            <Text style={styles.updateDescription} numberOfLines={2}>
              {update.description}
            </Text>
          )}
        </View>

        {/* Media Preview */}
        {update.media && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: update.media.thumbnail || update.media.url }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {update.media.type === "video" && (
              <View style={styles.playButton}>
                <Feather name="play" size={16} color={colors.text.primary} />
              </View>
            )}
            
            {/* Media type indicator */}
            <View style={styles.mediaTypeIndicator}>
              <Feather 
                name={update.media.type === "video" ? "video" : "image"} 
                size={12} 
                color={colors.text.secondary} 
              />
            </View>
          </View>
        )}

        {/* Event Context - Always displayed, clear and prominent */}
        <View style={styles.eventContext}>
          <View style={styles.eventIndicator}>
            <View style={styles.eventIconContainer}>
              <Feather name="calendar" size={14} color={colors.text.primary} />
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventLabel}>From Event</Text>
              <Text style={styles.eventName} numberOfLines={1}>
                {update.event?.name || 'Event Name'}
              </Text>
            </View>
          </View>
          
          {/* Enhanced Call to action */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>View Event Feed</Text>
            <Feather name="arrow-right" size={14} color={colors.text.primary} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    marginRight: spacing(4),
  },
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surface3,
    padding: spacing(4),
    ...shadow.ios,
    ...shadow.android,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(3),
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    marginRight: spacing(3),
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitials: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing(0.5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  timeAgo: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  engagementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    backgroundColor: colors.surface2,
    borderRadius: 999,
  },
  engagementCount: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  content: {
    marginBottom: spacing(3),
  },
  updateTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    lineHeight: typography.lineHeights.tight * typography.sizes.lg,
    marginBottom: spacing(2),
  },
  updateDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },
  mediaContainer: {
    position: 'relative',
    height: 140,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing(3),
    backgroundColor: colors.surface2,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaTypeIndicator: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: 999,
  },
  eventContext: {
    borderTopWidth: 1,
    borderTopColor: colors.surface3,
    paddingTop: spacing(3),
    backgroundColor: colors.surface2,
    marginHorizontal: -spacing(4),
    marginBottom: -spacing(4),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4),
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  eventIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  eventIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(3),
  },
  eventDetails: {
    flex: 1,
  },
  eventLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing(0.5),
  },
  eventName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    flex: 1,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: colors.surface3,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.2,
  },
});