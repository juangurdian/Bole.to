import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function PollScreen({ route }: any) {
  const { id } = route.params;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const api = useApi();
  const queryClient = useQueryClient();
  
  const pollQuery = useQuery({ 
    queryKey: ["poll", id], 
    queryFn: () => api.getPost(id) 
  });

  const voteMutation = useMutation({
    mutationFn: (optionId: string) => api.votePoll(id, optionId),
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      Alert.alert("Success", "Your vote has been recorded!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to record your vote. Please try again.");
    }
  });

  if (pollQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={120} />
          <Skeleton h={200} />
          <Skeleton h={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (pollQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => pollQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const poll = pollQuery.data!;
  const totalVotes = poll.pollOptions?.reduce((sum: number, option: any) => sum + option.votes, 0) || 0;

  const handleVote = async () => {
    if (!selectedOption) {
      Alert.alert("Error", "Please select an option");
      return;
    }

    await voteMutation.mutateAsync(selectedOption);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <View style={styles.pollHeader}>
            <View>
              <Text style={styles.authorName}>{poll.author.name}</Text>
              <Text style={styles.eventName}>{poll.event.title}</Text>
            </View>
            <Text style={styles.postTime}>
              {new Date(poll.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.pollQuestion}>{poll.content}</Text>
          
          <View style={styles.voteStats}>
            <Text style={styles.totalVotes}>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.optionsTitle}>Poll Options</Text>
          
          {poll.pollOptions?.map((option: any, index: number) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isSelected = selectedOption === option.id;
            
            return (
              <TouchableOpacity
                key={option.id || index}
                style={[
                  styles.pollOption,
                  isSelected && styles.pollOptionSelected,
                  hasVoted && styles.pollOptionDisabled
                ]}
                onPress={() => !hasVoted && setSelectedOption(option.id || `option_${index}`)}
                disabled={hasVoted}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected
                    ]}>
                      {option.text}
                    </Text>
                    
                    {hasVoted && (
                      <View style={styles.resultBar}>
                        <View 
                          style={[
                            styles.resultProgress,
                            { width: `${percentage}%` }
                          ]} 
                        />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.optionStats}>
                    {hasVoted && (
                      <Text style={styles.percentage}>{percentage}%</Text>
                    )}
                    <Text style={styles.voteCount}>
                      {option.votes} vote{option.votes !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.radioButton,
                  isSelected && styles.radioButtonSelected
                ]}>
                  {isSelected && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        {!hasVoted && (
          <View style={styles.actions}>
            <Button
              title={voteMutation.isPending ? "Voting..." : "Submit Vote"}
              onPress={handleVote}
              loading={voteMutation.isPending}
            />
          </View>
        )}

        {hasVoted && (
          <Card>
            <View style={styles.thankYou}>
              <Text style={styles.thankYouEmoji}>🗳️</Text>
              <Text style={styles.thankYouText}>Thanks for voting!</Text>
              <Text style={styles.thankYouSubtext}>
                Poll results are updated in real-time
              </Text>
            </View>
          </Card>
        )}
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
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
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
  pollQuestion: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    lineHeight: 26,
  },
  voteStats: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalVotes: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  pollOption: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  pollOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  pollOptionDisabled: {
    opacity: 0.8,
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  optionLabelSelected: {
    color: "#007AFF",
    fontWeight: "500",
  },
  resultBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  resultProgress: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  optionStats: {
    alignItems: "flex-end",
  },
  percentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  voteCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#007AFF",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  actions: {
    padding: 16,
  },
  thankYou: {
    alignItems: "center",
    paddingVertical: 20,
  },
  thankYouEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  thankYouSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});