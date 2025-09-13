import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../../theme";
import { colors as v2Colors, radii, spacing } from "../../../theme/v2-neutral";

const { width: screenWidth } = Dimensions.get("window");

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
        {/* Subtle accent gradient */}
        <LinearGradient
          colors={[`${v2Colors.accent}20`, `${v2Colors.accent2}20`, "transparent"]}
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
                    <View style={styles.verifiedBadge}>
                      <Feather name="check" size={10} color={v2Colors.bg} />
                    </View>
                  )}
                </View>
                <Text style={styles.timeText}>{formatTime(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Feather name="more-horizontal" size={20} color={v2Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Event Tag */}
          {post.event && (
            <TouchableOpacity 
              style={styles.eventTag}
              onPress={() => onEventPress?.(post.event!.id)}
            >
              <LinearGradient
                colors={[`${v2Colors.accent}26`, `${v2Colors.accent2}26`]}
                style={styles.eventGradient}
              >
                <Feather name="map-pin" size={12} color={v2Colors.accent} />
                <Text style={styles.eventName} numberOfLines={1}>
                  {post.event.name}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Content */}
          <Text style={styles.postContent}>{post.content}</Text>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <View style={styles.mediaWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={screenWidth - spacing(8)}
                decelerationRate="fast"
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
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <View style={styles.actionContent}>
                <Feather 
                  name={liked ? "heart" : "heart"} 
                  size={20} 
                  color={liked ? v2Colors.accent : v2Colors.text.secondary}
                />
                <Text style={[styles.actionCount, liked && styles.likedCount]}>
                  {formatCount(likes)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Feather name="message-circle" size={20} color={v2Colors.text.secondary} />
                <Text style={styles.actionCount}>{formatCount(post.comments)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionContent}>
                <Feather name="share" size={20} color={v2Colors.text.secondary} />
                <Text style={styles.actionCount}>{formatCount(post.shares)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.saveButton]}>
              <Feather name="bookmark" size={20} color={v2Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing(4),
    marginBottom: spacing(4),
  },
  card: {
    backgroundColor: v2Colors.surface1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    position: "relative",
    overflow: "hidden",
    shadowColor: v2Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  rimGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.4,
  },
  content: {
    padding: spacing(4),
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
    gap: spacing(3),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: v2Colors.surface2,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: v2Colors.text.primary,
  },
  verifiedBadge: {
    marginLeft: spacing(1),
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: v2Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: theme.typography.sizes.xs,
    color: v2Colors.text.tertiary,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  moreIcon: {
    fontSize: theme.typography.sizes.lg,
    color: v2Colors.text.secondary,
  },
  eventTag: {
    marginBottom: theme.spacing.sm,
  },
  eventGradient: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.accent}33`,
    gap: spacing(1.5),
  },
  eventName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: v2Colors.text.primary,
  },
  postContent: {
    fontSize: theme.typography.sizes.md,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.md,
    color: v2Colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  mediaWrapper: {
    marginHorizontal: -spacing(4),
    marginBottom: spacing(4),
  },
  mediaContainer: {
    position: "relative",
    width: screenWidth - spacing(8),
    aspectRatio: 1,
    backgroundColor: v2Colors.surface2,
    marginRight: spacing(2),
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    resizeMode: 'cover',
  },
  mediaPagination: {
    position: "absolute",
    top: spacing(3),
    right: spacing(3),
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
  },
  paginationText: {
    fontSize: 12,
    color: v2Colors.text.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: v2Colors.border,
  },
  actionButton: {
    marginRight: spacing(5),
    paddingVertical: spacing(1),
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: v2Colors.text.secondary,
  },
  likedCount: {
    color: v2Colors.accent,
    fontWeight: '600',
  },
  saveButton: {
    marginLeft: "auto",
    marginRight: 0,
  },
});