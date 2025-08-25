import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { theme } from "../../../theme";
import SectionHeader from "./SectionHeader";

interface SocialUpdate {
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
}

interface SocialUpdatesSectionProps {
  items: SocialUpdate[];
  onUpdatePress?: (updateId: string) => void;
  onViewAllPress?: () => void;
}

export default function SocialUpdatesSection({
  items,
  onUpdatePress = () => {},
  onViewAllPress,
}: SocialUpdatesSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const visibleUpdates = items.slice(0, 4); // Show max 4 updates

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return "📢";
      case "post":
        return "✍️";
      case "poll":
        return "📊";
      case "gallery":
        return "📸";
      case "update":
        return "📝";
      default:
        return "💬";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const renderUpdateCard = (update: SocialUpdate) => (
    <TouchableOpacity
      key={update.id}
      style={styles.updateCard}
      onPress={() => onUpdatePress(update.id)}
      activeOpacity={0.9}
    >
      <View style={styles.cardSurface}>
        {/* Glass overlay for depth */}
        <LinearGradient
          colors={theme.effects.gradientOverlays.cardTop}
          style={styles.glassOverlay}
        />
        <BlurView
          intensity={60}
          tint="dark"
          style={styles.cardHeader}
        >
          <View style={styles.authorInfo}>
            {update.author.avatar ? (
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: update.author.avatar }} 
                  style={styles.authorAvatar}
                />
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  style={styles.avatarBorder}
                />
              </View>
            ) : (
              <LinearGradient
                colors={theme.colors.gradient.accent}
                style={styles.authorAvatarPlaceholder}
              >
                <Text style={styles.authorInitials}>
                  {update.author.name.charAt(0)}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.authorDetails}>
              <Text style={styles.authorName} numberOfLines={1}>
                {update.author.name}
              </Text>
              <Text style={styles.updateTime}>
                {formatTimeAgo(update.timestamp)}
              </Text>
            </View>
          </View>
          
          <LinearGradient
            colors={theme.colors.gradient.warm}
            style={styles.updateType}
          >
            <Text style={styles.typeIcon}>{getUpdateIcon(update.type)}</Text>
          </LinearGradient>
        </BlurView>

        <View style={styles.cardContent}>
          <Text style={styles.updateTitle} numberOfLines={2}>
            {update.title}
          </Text>
          
          {update.description && (
            <Text style={styles.updateDescription} numberOfLines={2}>
              {update.description}
            </Text>
          )}

          {update.event && (
            <LinearGradient
              colors={theme.colors.gradient.accent}
              style={styles.eventTag}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.eventTagText}>
                {update.event.name}
              </Text>
            </LinearGradient>
          )}
        </View>

        {update.media && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: update.media.thumbnail || update.media.url }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {update.media.type === "video" && (
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶️</Text>
              </View>
            )}
          </View>
        )}

        {update.engagement && (
          <BlurView
            intensity={40}
            tint="dark"
            style={styles.engagement}
          >
            <View style={styles.engagementItem}>
              <Text style={styles.engagementIcon}>❤️</Text>
              <Text style={styles.engagementCount}>
                {update.engagement.likes}
              </Text>
            </View>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementIcon}>💬</Text>
              <Text style={styles.engagementCount}>
                {update.engagement.comments}
              </Text>
            </View>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementIcon}>📤</Text>
              <Text style={styles.engagementCount}>
                {update.engagement.shares}
              </Text>
            </View>
          </BlurView>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Social Updates"
        onSeeAll={items.length > 4 ? onViewAllPress : undefined}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {visibleUpdates.map(renderUpdateCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  updateCard: {
    width: 280,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardSurface: {
    backgroundColor: theme.colors.surface.secondary,
    borderWidth: 1.5,
    borderColor: theme.effects.glass.secondary,
    borderRadius: 20,
    padding: theme.spacing.md,
    position: "relative",
    ...theme.shadows.xl,
  },
  glassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.effects.backdrop.dark,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    overflow: "hidden",
    zIndex: 2,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: theme.spacing.sm,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
  },
  avatarBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.borderRadius.round + 2,
    zIndex: -1,
  },
  authorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  authorInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  updateTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  updateType: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardContent: {
    marginBottom: theme.spacing.sm,
  },
  updateTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
    marginBottom: theme.spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  updateDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  eventTag: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  eventTagText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mediaContainer: {
    position: "relative",
    height: 120,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    marginBottom: theme.spacing.sm,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 12,
  },
  engagement: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.effects.backdrop.dark,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    overflow: "hidden",
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs / 2,
  },
  engagementIcon: {
    fontSize: 14,
  },
  engagementCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
  },
});