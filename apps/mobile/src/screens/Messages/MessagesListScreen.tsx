import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const mockConversations = [
  {
    id: "1",
    name: "Summer Music Festival",
    lastMessage: "See you at the main stage!",
    timestamp: "2m ago",
    unread: 2,
    avatar: null,
  },
  {
    id: "2",
    name: "John Doe",
    lastMessage: "Are you going to the concert tonight?",
    timestamp: "1h ago",
    unread: 0,
    avatar: null,
  },
  {
    id: "3",
    name: "Event Support",
    lastMessage: "Your ticket has been confirmed",
    timestamp: "3h ago",
    unread: 1,
    avatar: null,
  },
];

export default function MessagesListScreen({ navigation }: any) {
  const renderConversation = ({ item }: any) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate("ChatScreen", { conversation: item })}
    >
      <View style={styles.avatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={24} color="#666" />
          </View>
        )}
        {item.unread > 0 && <View style={styles.unreadDot} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Feather name="edit" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>Start a conversation to connect with others</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    marginRight: 12,
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#000",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});