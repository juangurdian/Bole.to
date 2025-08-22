import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface RecentPostsListProps {
  posts: any[];
  navigation: any;
}

export default function RecentPostsList({ posts, navigation }: RecentPostsListProps) {
  const handlePostPress = (post: any) => {
    navigation.navigate("EventScreen", { 
      eventId: post.eventId, 
      eventName: post.eventName,
      anchor: "feed"
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  return (
    <View style={styles.container}>
      {posts.slice(0, 3).map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={[
            styles.postCard,
            index === posts.slice(0, 3).length - 1 && styles.lastPost
          ]}
          onPress={() => handlePostPress(post)}
        >
          <View style={styles.postHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName} numberOfLines={1}>
                {post.eventName}
              </Text>
              <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statText}>❤️ {post.likeCount}</Text>
              <Text style={styles.statText}>💬 {post.commentCount}</Text>
            </View>
          </View>
          
          <Text style={styles.postText} numberOfLines={3}>
            {post.text}
          </Text>
        </TouchableOpacity>
      ))}
      
      {posts.length > 3 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate("Profile", { tab: "posts" })}
        >
          <Text style={styles.viewAllText}>View all posts ({posts.length})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 12,
  },
  lastPost: {
    borderBottomWidth: 0,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  postDate: {
    fontSize: 12,
    color: "#666",
  },
  stats: {
    flexDirection: "row",
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  postText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
});