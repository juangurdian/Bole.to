import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApi } from "../../../api";

interface PostComposerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  preselectedEventId?: string;
}

const MOCK_USER_EVENTS = [
  { id: "event_001", name: "Electric Nights Festival" },
  { id: "event_002", name: "Comedy Central Live" },
  { id: "event_003", name: "New Year's Eve Bash" },
];

export default function PostComposerSheet({ visible, onClose, onPostCreated, preselectedEventId }: PostComposerSheetProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || "");
  const [postText, setPostText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId]);

  const handlePost = async () => {
    if (!selectedEventId || !postText.trim()) {
      Alert.alert("Missing Information", "Please select an event and write a message.");
      return;
    }

    if (postText.length > 280) {
      Alert.alert("Too Long", "Posts must be 280 characters or less.");
      return;
    }

    setIsPosting(true);
    try {
      await api.createPost(selectedEventId, postText.trim());
      setPostText("");
      setSelectedEventId(preselectedEventId || "");
      onPostCreated();
    } catch (error) {
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    setPostText("");
    setSelectedEventId(preselectedEventId || "");
    onClose();
  };

  const isValid = selectedEventId && postText.trim().length > 0 && postText.length <= 280;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity 
            onPress={handlePost}
            disabled={!isValid || isPosting}
            style={[
              styles.postButton,
              (!isValid || isPosting) && styles.postButtonDisabled
            ]}
          >
            <Text style={[
              styles.postButtonText,
              (!isValid || isPosting) && styles.postButtonTextDisabled
            ]}>
              {isPosting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Event Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose an event</Text>
            <View style={styles.eventList}>
              {MOCK_USER_EVENTS.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventOption,
                    selectedEventId === event.id && styles.eventOptionSelected
                  ]}
                  onPress={() => setSelectedEventId(event.id)}
                >
                  <View style={styles.eventInfo}>
                    <View style={[
                      styles.eventAvatar,
                      selectedEventId === event.id && styles.eventAvatarSelected
                    ]}>
                      <Text style={[
                        styles.eventAvatarText,
                        selectedEventId === event.id && styles.eventAvatarTextSelected
                      ]}>
                        {event.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.eventName,
                      selectedEventId === event.id && styles.eventNameSelected
                    ]}>
                      {event.name}
                    </Text>
                  </View>
                  {selectedEventId === event.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's happening?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share something with other attendees..."
              placeholderTextColor="#999"
              multiline
              value={postText}
              onChangeText={setPostText}
              maxLength={280}
              textAlignVertical="top"
            />
            <View style={styles.charCount}>
              <Text style={[
                styles.charCountText,
                postText.length > 280 && styles.charCountError
              ]}>
                {postText.length}/280
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  postButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: "#ccc",
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  postButtonTextDisabled: {
    color: "#999",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "white",
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  eventList: {
    gap: 8,
  },
  eventOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
  },
  eventOptionSelected: {
    backgroundColor: "#E8F4FD",
    borderColor: "#007AFF",
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventAvatarSelected: {
    backgroundColor: "#007AFF",
  },
  eventAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  eventAvatarTextSelected: {
    color: "white",
  },
  eventName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  eventNameSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
  checkmark: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    backgroundColor: "white",
  },
  charCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  charCountText: {
    fontSize: 14,
    color: "#666",
  },
  charCountError: {
    color: "#FF3B30",
  },
});