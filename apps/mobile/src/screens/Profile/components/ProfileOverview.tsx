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

interface OverviewData {
  recentEvents: Array<{
    id: string;
    title: string;
    date: string;
    coverUrl?: string;
  }>;
  topPhotos: Array<{
    id: string;
    url: string;
    eventName: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    icon: string;
    unlockedAt: string;
  }>;
}

interface ProfileOverviewProps {
  data?: OverviewData;
  onEventPress: (eventId: string) => void;
  navigation: any;
}

export default function ProfileOverview({
  data,
  onEventPress,
  navigation,
}: ProfileOverviewProps) {
  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recent Events */}
      {data.recentEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {data.recentEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => onEventPress(event.id)}
              >
                <View style={styles.eventCardBg}>
                  {event.coverUrl ? (
                    <Image
                      source={{ uri: event.coverUrl }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={theme.colors.gradient.primary}
                      style={styles.eventPlaceholder}
                    >
                      <Text style={styles.eventPlaceholderIcon}>🎪</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.eventOverlay}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top Photos Grid */}
      {data.topPhotos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Photos</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ProfilePhotos")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoGrid}>
            {data.topPhotos.slice(0, 6).map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoItem}
                onPress={() => navigation.navigate("PhotoViewer", { id: photo.id })}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.photoGradient}
                >
                  <Text style={styles.photoEvent} numberOfLines={1}>
                    {photo.eventName}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Achievements */}
      {data.achievements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsGrid}>
            {data.achievements.slice(0, 4).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <LinearGradient
                  colors={["rgba(255,215,0,0.15)", "rgba(255,140,0,0.15)"]}
                  style={styles.achievementGradient}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementTitle} numberOfLines={2}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {achievement.unlockedAt}
                  </Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  seeAll: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  horizontalScroll: {
    gap: theme.spacing.md,
  },
  eventCard: {
    width: 160,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  eventCardBg: {
    flex: 1,
    backgroundColor: "#111623",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  eventPlaceholderIcon: {
    fontSize: 32,
    opacity: 0.6,
  },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  eventTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: theme.typography.sizes.xs,
    color: "rgba(255,255,255,0.7)",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  photoItem: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.xs,
  },
  photoEvent: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.medium,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  achievementCard: {
    width: "48%",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  achievementGradient: {
    padding: theme.spacing.md,
    alignItems: "center",
    backgroundColor: "#111623",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    borderRadius: theme.borderRadius.lg,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  achievementTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  achievementDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    paddingVertical: theme.spacing.xl,
  },
});