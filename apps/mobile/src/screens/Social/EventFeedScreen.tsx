import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";

export default function EventFeedScreen({ navigation }: any) {
  const api = useApi();
  const postsQuery = useQuery({ queryKey: ["social-posts"], queryFn: api.listPosts });

  if (postsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={120} />
          <Skeleton h={100} />
          <Skeleton h={150} />
        </View>
      </SafeAreaView>
    );
  }

  if (postsQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => postsQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const posts = postsQuery.data ?? [];
  
  if (!posts.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.createPost}>
          <Button
            title="Create First Post"
            onPress={() => navigation.navigate("PostComposer")}
          />
        </View>
        <EmptyState 
          text="No posts yet" 
          onRetry={() => postsQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const renderPost = ({ item }: any) => {
    if (item.type === "poll") {
      return (
        <TouchableOpacity onPress={() => navigation.navigate("PollScreen", { id: item.id })}>
          <Card>
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <Text style={styles.eventName}>{item.event.title}</Text>
              </View>
              <Text style={styles.postTime}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            <Text style={styles.pollQuestion}>📊 {item.content}</Text>
            
            <View style={styles.pollPreview}>
              {item.pollOptions?.slice(0, 2).map((option: any, index: number) => (
                <View key={index} style={styles.pollOption}>
                  <Text style={styles.pollOptionText}>{option.text}</Text>
                  <Text style={styles.pollVotes}>{option.votes} votes</Text>
                </View>
              ))}
              {item.pollOptions && item.pollOptions.length > 2 && (
                <Text style={styles.pollMore}>+{item.pollOptions.length - 2} more options</Text>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <Card>
        <View style={styles.postHeader}>
          <View>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.eventName}>{item.event.title}</Text>
          </View>
          <Text style={styles.postTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <Text style={styles.postContent}>{item.content}</Text>
        
        {item.imageUrl && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>🖼️</Text>
            <Text style={styles.imageText}>Image: {item.imageUrl}</Text>
          </View>
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>👍 {item.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>💬 {item.comments || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.createPost}>
        <Button
          title="Create Post"
          onPress={() => navigation.navigate("PostComposer")}
        />
      </View>
      
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={postsQuery.isFetching} onRefresh={() => postsQuery.refetch()} />}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  createPost: {
    padding: 16,
    paddingBottom: 8,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  eventName: {
    fontSize: 14,
    color: "#666",
  },
  postTime: {
    fontSize: 12,
    color: "#999",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  pollPreview: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  pollOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  pollOptionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  pollVotes: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  pollMore: {
    fontSize: 12,
    color: "#007AFF",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  imagePlaceholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  imageEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  imageText: {
    fontSize: 12,
    color: "#666",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
});