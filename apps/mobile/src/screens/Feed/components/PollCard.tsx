import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useApi } from "../../../api";

interface PollCardProps {
  item: any;
  onOpen: () => void;
  onRefresh: () => void;
}

export default function PollCard({ item, onOpen, onRefresh }: PollCardProps) {
  const [options, setOptions] = useState(item.options);
  const [userVoteId, setUserVoteId] = useState(item.userVoteId);
  const [isVoting, setIsVoting] = useState(false);
  const api = useApi();

  const handleVote = async (optionId: string) => {
    if (isVoting || userVoteId) return; // Prevent double voting
    
    setIsVoting(true);
    try {
      const result = await api.votePoll(item.id, optionId);
      setOptions(result.options);
      setUserVoteId(optionId);
    } catch (error) {
      Alert.alert("Error", "Failed to submit vote");
    } finally {
      setIsVoting(false);
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

  const getTotalVotes = () => {
    return options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
  };

  const getPercentage = (votes: number) => {
    const total = getTotalVotes();
    return total > 0 ? Math.round((votes / total) * 100) : 0;
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
              <Text style={styles.organizer}>From Organizer</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.typeIcon}>
          <Text style={styles.typeEmoji}>📊</Text>
        </View>
      </View>

      {/* Poll Question */}
      <View style={styles.body}>
        <Text style={styles.question}>{item.question}</Text>
        
        {/* Poll Options */}
        <View style={styles.pollOptions}>
          {options.map((option: any) => {
            const percentage = getPercentage(option.votes);
            const isSelected = userVoteId === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  isSelected && styles.pollOptionSelected,
                  userVoteId && !isSelected && styles.pollOptionUnselected
                ]}
                onPress={() => handleVote(option.id)}
                disabled={!!userVoteId || isVoting}
              >
                <View style={styles.pollOptionContent}>
                  <Text style={[
                    styles.pollOptionText,
                    isSelected && styles.pollOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {userVoteId && (
                    <Text style={[
                      styles.pollPercentage,
                      isSelected && styles.pollPercentageSelected
                    ]}>
                      {percentage}%
                    </Text>
                  )}
                </View>
                {userVoteId && (
                  <View 
                    style={[
                      styles.pollBar,
                      isSelected && styles.pollBarSelected,
                      { width: `${percentage}%` }
                    ]} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {userVoteId && (
          <View style={styles.pollStats}>
            <Text style={styles.pollStatsText}>
              {getTotalVotes()} votes • Poll by organizer
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Comment</Text>
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
  organizer: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
  question: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    color: "#333",
    marginBottom: 16,
  },
  pollOptions: {
    gap: 8,
  },
  pollOption: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  pollOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E8F4FD",
  },
  pollOptionUnselected: {
    opacity: 0.7,
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    zIndex: 2,
    position: "relative",
  },
  pollOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  pollOptionTextSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
  pollPercentage: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  pollPercentageSelected: {
    color: "#007AFF",
  },
  pollBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#007AFF",
    opacity: 0.15,
    zIndex: 1,
  },
  pollBarSelected: {
    opacity: 0.25,
  },
  pollStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  pollStatsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
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
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});