import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Card from "../../../components/Card";

interface HomeSocialDigestWidgetProps {
  socialDigest: any[];
  navigation: any;
}

export default function HomeSocialDigestWidget({ socialDigest, navigation }: HomeSocialDigestWidgetProps) {
  if (!socialDigest.length) {
    return (
      <Card style={styles.container}>
        <Text style={styles.sectionTitle}>Social Updates</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No new activity—follow events to get updates</Text>
        </View>
      </Card>
    );
  }

  const renderSocialItem = (item: any) => {
    switch (item.type) {
      case "announcement":
        return (
          <TouchableOpacity key={item.id} style={styles.socialItem}>
            <Text style={styles.typeIcon}>📣</Text>
            <View style={styles.socialContent}>
              <Text style={styles.socialText}>{item.text}</Text>
              <Text style={styles.socialMeta}>{item.eventTitle} • {formatTime(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        );
      
      case "post":
        return (
          <TouchableOpacity key={item.id} style={styles.socialItem}>
            <Text style={styles.typeIcon}>💬</Text>
            <View style={styles.socialContent}>
              <Text style={styles.socialText}>
                <Text style={styles.userName}>{item.userName}:</Text> {item.text}
              </Text>
              <Text style={styles.socialMeta}>
                {item.eventTitle} • {formatTime(item.createdAt)} • {item.likes} likes
              </Text>
            </View>
          </TouchableOpacity>
        );
      
      case "poll":
        return (
          <View key={item.id} style={styles.socialItem}>
            <Text style={styles.typeIcon}>📊</Text>
            <View style={styles.socialContent}>
              <Text style={styles.socialText}>{item.question}</Text>
              <View style={styles.pollOptions}>
                {item.options.slice(0, 2).map((option: any) => (
                  <TouchableOpacity key={option.id} style={styles.pollOption}>
                    <Text style={styles.pollOptionText}>{option.label}</Text>
                    <Text style={styles.pollPercentage}>{option.pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.socialMeta}>{item.eventTitle} • {formatTime(item.createdAt)}</Text>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Social Updates</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Feed")}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      
      {socialDigest.slice(0, 3).map(renderSocialItem)}
    </Card>
  );
}

function formatTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const minutes = Math.floor(diffHours * 60);
    return `${minutes}m ago`;
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  } else {
    return `${Math.floor(diffHours / 24)}d ago`;
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  socialItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  socialContent: {
    flex: 1,
  },
  socialText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
  userName: {
    fontWeight: "600",
  },
  socialMeta: {
    fontSize: 12,
    color: "#666",
  },
  pollOptions: {
    marginVertical: 8,
  },
  pollOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  pollOptionText: {
    fontSize: 14,
    color: "#333",
  },
  pollPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});