import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function PostComposer({ navigation }: any) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "poll">("text");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const api = useApi();
  const queryClient = useQueryClient();
  
  const eventsQuery = useQuery({ 
    queryKey: ["events"], 
    queryFn: api.listEvents 
  });

  const createPostMutation = useMutation({
    mutationFn: (postData: any) => api.createPost(postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      Alert.alert("Success", "Post created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    },
    onError: () => {
      Alert.alert("Error", "Failed to create post. Please try again.");
    }
  });

  if (eventsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={100} />
          <Skeleton h={200} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (eventsQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => eventsQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const events = eventsQuery.data ?? [];

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, text: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    if (!selectedEventId) {
      Alert.alert("Error", "Please select an event");
      return;
    }

    if (postType === "poll") {
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert("Error", "Please provide at least 2 poll options");
        return;
      }
    }

    const postData = {
      type: postType,
      content: content.trim(),
      eventId: selectedEventId,
      ...(postType === "poll" && {
        pollOptions: pollOptions
          .filter(opt => opt.trim())
          .map(text => ({ text: text.trim(), votes: 0 }))
      })
    };

    await createPostMutation.mutateAsync(postData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <Text style={styles.sectionTitle}>Select Event</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
            {events.map(event => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventChip,
                  selectedEventId === event.id && styles.eventChipSelected
                ]}
                onPress={() => setSelectedEventId(event.id)}
              >
                <Text style={[
                  styles.eventChipText,
                  selectedEventId === event.id && styles.eventChipTextSelected
                ]}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Post Type</Text>
          <View style={styles.postTypeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                postType === "text" && styles.typeButtonSelected
              ]}
              onPress={() => setPostType("text")}
            >
              <Text style={[
                styles.typeButtonText,
                postType === "text" && styles.typeButtonTextSelected
              ]}>
                📝 Text Post
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                postType === "poll" && styles.typeButtonSelected
              ]}
              onPress={() => setPostType("poll")}
            >
              <Text style={[
                styles.typeButtonText,
                postType === "poll" && styles.typeButtonTextSelected
              ]}>
                📊 Poll
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            {postType === "poll" ? "Poll Question" : "What's happening?"}
          </Text>
          <TextInput
            style={styles.contentInput}
            placeholder={postType === "poll" ? "Ask a question..." : "Share your thoughts..."}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {postType === "poll" && (
          <Card>
            <Text style={styles.sectionTitle}>Poll Options</Text>
            {pollOptions.map((option, index) => (
              <View key={index} style={styles.pollOptionRow}>
                <TextInput
                  style={styles.pollOptionInput}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChangeText={(text) => updatePollOption(index, text)}
                />
                {pollOptions.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePollOption(index)}
                  >
                    <Text style={styles.removeButtonText}>❌</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {pollOptions.length < 4 && (
              <TouchableOpacity style={styles.addOptionButton} onPress={addPollOption}>
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
          <Button
            title={createPostMutation.isPending ? "Posting..." : "Post"}
            onPress={handleSubmit}
            loading={createPostMutation.isPending}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  eventScroll: {
    flexDirection: "row",
  },
  eventChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  eventChipSelected: {
    backgroundColor: "#007AFF",
  },
  eventChipText: {
    fontSize: 14,
    color: "#666",
  },
  eventChipTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  postTypeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  typeButtonTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    minHeight: 100,
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pollOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "white",
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 16,
  },
  addOptionButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  addOptionText: {
    fontSize: 16,
    color: "#007AFF",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  submitButton: {
    flex: 1,
  },
});