import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useApi } from "../../../api";

interface PostCardProps {
  item: any;
  onOpen: () => void;
  onRefresh: () => void;
}

export default function PostCard({ item, onOpen, onRefresh }: PostCardProps) {
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [liked, setLiked] = useState(item.liked);
  const [isLiking, setIsLiking] = useState(false);
  const api = useApi();

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await api.toggleLike(item.id);
      setLikeCount(result.likeCount);
      setLiked(result.liked);
    } catch (error) {
      Alert.alert("Error", "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else {
      return `${Math.floor(diffHours / 24)}d`;
    }
  };

  const getEventChip = () => {
    const eventDate = new Date(item.createdAt);
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
    
    if (eventDate.toDateString() === today) {
      return "Today";
    } else if (eventDate.toDateString() === tomorrow) {
      return "Tomorrow";
    }
    return null;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onOpen} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <View style={styles.eventAvatar}>
            <Text style={styles.eventAvatarText}>{item.eventName.charAt(0)}</Text>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventName} numberOfLines={1}>{item.eventName}</Text>
            <View style={styles.subInfo}>
              <Text style={styles.authorName}>{item.author.name}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
              {getEventChip() && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <View style={styles.eventChip}>
                    <Text style={styles.eventChipText}>{getEventChip()}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.typeIcon}>
          <Text style={styles.typeEmoji}>💬</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.postText}>{item.text}</Text>
        
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image 
              source={{ uri: item.mediaUrls[0] }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, liked && styles.actionButtonLiked]} 
          onPress={handleLike}
          disabled={isLiking}
        >
          <Text style={[styles.actionIcon, liked && styles.actionIconLiked]}>
            {liked ? "❤️" : "🤍"}
          </Text>
          <Text style={[styles.actionText, liked && styles.actionTextLiked]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.commentCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👀</Text>
          <Text style={styles.actionText}>Open</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  subInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 14,
    color: "#666",
  },
  dot: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 4,
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  eventChip: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eventChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
  },
  typeIcon: {
    marginLeft: 12,
  },
  typeEmoji: {
    fontSize: 20,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  mediaContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionButtonLiked: {
    // Special styling for liked state
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionIconLiked: {
    // Will be overridden by emoji change
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  actionTextLiked: {
    color: "#FF3B30",
  },
});