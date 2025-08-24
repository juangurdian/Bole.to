import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  hasNewStory: boolean;
  isViewed?: boolean;
}

interface FeedStoriesProps {
  stories: Story[];
  onStoryPress: (storyId: string) => void;
  onAddStory: () => void;
}

export default function FeedStories({ 
  stories, 
  onStoryPress,
  onAddStory 
}: FeedStoriesProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button */}
        <TouchableOpacity 
          style={styles.storyItem}
          onPress={onAddStory}
        >
          <View style={styles.addStoryContainer}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.addStoryGradient}
            >
              <Text style={styles.addIcon}>+</Text>
            </LinearGradient>
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </TouchableOpacity>

        {/* Stories */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onStoryPress(story.id)}
          >
            <View style={styles.storyRingContainer}>
              {story.hasNewStory && !story.isViewed ? (
                <LinearGradient
                  colors={[...theme.colors.gradient.warm, ...theme.colors.gradient.accent]}
                  style={styles.storyRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.storyInnerRing}>
                    {story.userAvatar ? (
                      <Image
                        source={{ uri: story.userAvatar }}
                        style={styles.storyAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={theme.colors.gradient.primary}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarText}>
                          {story.userName[0].toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.storyRing, styles.viewedRing]}>
                  <View style={styles.storyInnerRing}>
                    {story.userAvatar ? (
                      <Image
                        source={{ uri: story.userAvatar }}
                        style={styles.storyAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#333", "#222"]}
                        style={styles.avatarPlaceholder}
                      >
                        <Text style={styles.avatarText}>
                          {story.userName[0].toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </View>
              )}
              
              {/* Live Badge */}
              {story.hasNewStory && !story.isViewed && (
                <View style={styles.liveBadge}>
                  <LinearGradient
                    colors={theme.colors.gradient.warm}
                    style={styles.liveBadgeGradient}
                  >
                    <Text style={styles.liveText}>LIVE</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {story.userName.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  storyItem: {
    alignItems: "center",
    width: 72,
  },
  addStoryContainer: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.xs,
  },
  addStoryGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addIcon: {
    fontSize: 28,
    color: theme.colors.white,
    fontWeight: "300",
  },
  storyRingContainer: {
    width: 64,
    height: 64,
    marginBottom: theme.spacing.xs,
    position: "relative",
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  viewedRing: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  storyInnerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.bg,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  storyLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  liveBadge: {
    position: "absolute",
    bottom: -2,
    right: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  liveBadgeGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: 8,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
});