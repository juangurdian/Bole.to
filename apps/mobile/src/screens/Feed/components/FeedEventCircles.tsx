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
import { colors as v2Colors, radii, spacing } from "../../../theme/v2-neutral";

interface UserEvent {
  id: string;
  eventId: string;
  eventName: string;
  eventCover?: string;
  hasNewPosts: boolean;
  isViewed?: boolean;
  postCount?: number;
}

interface FeedEventCirclesProps {
  events: UserEvent[];
  onEventPress: (eventId: string) => void;
  onCreateEvent: () => void;
}

export default function FeedEventCircles({ 
  events, 
  onEventPress,
  onCreateEvent 
}: FeedEventCirclesProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create Event Button */}
        <TouchableOpacity 
          style={styles.eventItem}
          onPress={onCreateEvent}
        >
          <View style={styles.addEventContainer}>
            <LinearGradient
              colors={[v2Colors.accent, v2Colors.accent2]}
              style={styles.addEventGradient}
            >
              <Text style={styles.addIcon}>+</Text>
            </LinearGradient>
          </View>
          <Text style={styles.eventLabel}>Create</Text>
        </TouchableOpacity>

        {/* User's Events */}
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventItem}
            onPress={() => onEventPress(event.eventId)}
          >
            <View style={styles.eventRingContainer}>
              {event.hasNewPosts && !event.isViewed ? (
                <LinearGradient
                  colors={[v2Colors.accent, v2Colors.accent2]}
                  style={styles.eventRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.eventInnerRing}>
                    {event.eventCover ? (
                      <Image
                        source={{ uri: event.eventCover }}
                        style={styles.eventCover}
                      />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverEmoji}>🎉</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.eventRing, styles.viewedRing]}>
                  <View style={styles.eventInnerRing}>
                    {event.eventCover ? (
                      <Image
                        source={{ uri: event.eventCover }}
                        style={styles.eventCover}
                      />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverEmoji}>🎉</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {/* New Posts Badge */}
              {event.hasNewPosts && event.postCount && event.postCount > 0 && (
                <View style={styles.countBadge}>
                  <LinearGradient
                    colors={[v2Colors.accent, v2Colors.accent2]}
                    style={styles.countBadgeGradient}
                  >
                    <Text style={styles.countText}>
                      {event.postCount > 99 ? '99+' : event.postCount}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
            <Text style={styles.eventLabel} numberOfLines={1}>
              {event.eventName.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v2Colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing(4),
    gap: spacing(3),
  },
  eventItem: {
    alignItems: "center",
    width: 72,
  },
  addEventContainer: {
    width: 64,
    height: 64,
    marginBottom: spacing(2),
  },
  addEventGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  addIcon: {
    fontSize: 28,
    color: v2Colors.text.primary,
    fontWeight: "300",
  },
  eventRingContainer: {
    width: 64,
    height: 64,
    marginBottom: spacing(2),
    position: "relative",
  },
  eventRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  viewedRing: {
    backgroundColor: v2Colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  eventInnerRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: v2Colors.bg,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  eventCover: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  coverPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: v2Colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  coverEmoji: {
    fontSize: 24,
  },
  eventLabel: {
    fontSize: 12,
    color: v2Colors.text.secondary,
    textAlign: "center",
    fontWeight: '500',
  },
  countBadge: {
    position: "absolute",
    bottom: -2,
    right: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  countBadgeGradient: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: v2Colors.text.primary,
  },
});