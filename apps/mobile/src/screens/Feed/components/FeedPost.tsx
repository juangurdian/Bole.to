import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface PostAuthor {
  id: string;
  name: string;
  avatar?: string;
  verified?: boolean;
}

interface PostEvent {
  id: string;
  name: string;
  coverUrl?: string;
}

interface PostMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface PostData {
  id: string;
  author: PostAuthor;
  event?: PostEvent;
  content: string;
  media?: PostMedia[];
  likes: number;
  comments: number;
  shares: number;
  hasLiked?: boolean;
  createdAt: string;
}

interface FeedPostProps {
  post: PostData;
  onPress: () => void;
  onEventPress?: (eventId: string) => void;
  onProfilePress?: (userId: string) => void;
}

export default function FeedPost({ 
  post, 
  onPress,
  onEventPress,
  onProfilePress 
}: FeedPostProps) {
  const [liked, setLiked] = useState(post.hasLiked || false);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Rim light gradient */}
        <LinearGradient
          colors={["rgba(124,92,255,0.2)", "rgba(0,224,255,0.2)", "transparent"]}
          style={styles.rimGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.authorSection}
              onPress={() => onProfilePress?.(post.author.id)}
            >
              {post.author.avatar ? (
                <Image
                  source={{ uri: post.author.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={theme.colors.gradient.warm}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>
                    {post.author.name[0].toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
              
              <View style={styles.authorInfo}>
                <View style={styles.authorName}>
                  <Text style={styles.authorText}>{post.author.name}</Text>
                  {post.author.verified && (
                    <Text style={styles.verifiedBadge}>✓</Text>
                  )}
                </View>
                <Text style={styles.timeText}>{formatTime(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreIcon}>•••</Text>
            </TouchableOpacity>
          </View>

          {/* Event Tag */}
          {post.event && (
            <TouchableOpacity 
              style={styles.eventTag}
              onPress={() => onEventPress?.(post.event!.id)}
            >
              <LinearGradient
                colors={["rgba(124,92,255,0.15)", "rgba(0,224,255,0.15)"]}
                style={styles.eventGradient}
              >
                <Text style={styles.eventIcon}>🎪</Text>
                <Text style={styles.eventName} numberOfLines={1}>
                  at {post.event.name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.mediaScroll}
              pagingEnabled
            >
              {post.media.map((item, index) => (
                <View key={index} style={styles.mediaContainer}>
                  <Image
                    source={{ uri: item.url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  {post.media!.length > 1 && (
                    <View style={styles.mediaPagination}>
                      <Text style={styles.paginationText}>
                        {index + 1}/{post.media!.length}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <LinearGradient
                colors={liked ? theme.colors.gradient.warm : ["transparent", "transparent"]}
                style={styles.actionGradient}
              >
                <Text style={[styles.actionIcon, liked && styles.likedIcon]}>
                  {liked ? "❤️" : "🤍"}
                </Text>
                <Text style={[styles.actionCount, liked && styles.likedCount]}>
                  {formatCount(likes)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionCount}>{formatCount(post.comments)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Text style={styles.actionIcon}>📤</Text>
                <Text style={styles.actionCount}>{formatCount(post.shares)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.saveButton]}>
              <Text style={styles.actionIcon}>🔖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: "#111623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    overflow: "hidden",
    ...theme.shadows.md,
  },
  rimGradient: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    zIndex: -1,
    opacity: 0.6,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  verifiedBadge: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.primary,
  },
  timeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  moreIcon: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary,
  },
  eventTag: {
    marginBottom: theme.spacing.sm,
  },
  eventGradient: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(124,92,255,0.2)",
  },
  eventIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  eventName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
  },
  postContent: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  mediaScroll: {
    marginHorizontal: -theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  mediaContainer: {
    position: "relative",
  },
  mediaImage: {
    width: 350,
    height: 350,
    marginRight: 2,
  },
  mediaPagination: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.md,
  },
  paginationText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  actionButton: {
    marginRight: theme.spacing.lg,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
  },
  likedCount: {
    color: theme.colors.text.primary,
  },
  saveButton: {
    marginLeft: "auto",
    marginRight: 0,
  },
});