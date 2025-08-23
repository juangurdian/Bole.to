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
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[theme.colors.surface.card, theme.colors.surface.card]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.authorInfo}>
            {update.author.avatar ? (
              <Image 
                source={{ uri: update.author.avatar }} 
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.authorAvatarPlaceholder}>
                <Text style={styles.authorInitials}>
                  {update.author.name.charAt(0)}
                </Text>
              </View>
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
          
          <View style={styles.updateType}>
            <Text style={styles.typeIcon}>{getUpdateIcon(update.type)}</Text>
          </View>
        </View>

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
            <View style={styles.eventTag}>
              <Text style={styles.eventTagText}>
                {update.event.name}
              </Text>
            </View>
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
          <View style={styles.engagement}>
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
          </View>
        )}
      </LinearGradient>
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
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  cardGradient: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
  },
  authorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surface.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  authorInitials: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.onLight,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.onLight,
    marginBottom: 2,
  },
  updateTime: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  updateType: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 16,
  },
  cardContent: {
    marginBottom: theme.spacing.sm,
  },
  updateTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.onLight,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.md,
    marginBottom: theme.spacing.xs,
  },
  updateDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  eventTag: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  eventTagText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.onLight,
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