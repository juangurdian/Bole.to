import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

interface BadgesTabProps {
  profile: any;
  isLoading: boolean;
  navigation: any;
}

export default function BadgesTab({ profile, isLoading, navigation }: BadgesTabProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionTitle}>
          <View style={styles.titleSkeleton} />
        </View>
        <View style={styles.badgesGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.badgeSkeleton} />
          ))}
        </View>
      </View>
    );
  }

  const badges = profile?.badges || [];
  const earnedBadges = badges.filter(badge => badge.earned);
  const lockedBadges = badges.filter(badge => !badge.earned);

  const renderBadge = ({ item, isEarned }: { item: any; isEarned: boolean }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    return (
      <View style={[
        styles.badgeCard,
        !isEarned && styles.lockedBadgeCard
      ]}>
        <View style={[
          styles.badgeIcon,
          !isEarned && styles.lockedBadgeIcon
        ]}>
          <Text style={[
            styles.badgeEmoji,
            !isEarned && styles.lockedBadgeEmoji
          ]}>
            {isEarned ? "🏆" : "🔒"}
          </Text>
        </View>
        
        <Text style={[
          styles.badgeName,
          !isEarned && styles.lockedBadgeName
        ]}>
          {item.name}
        </Text>
        
        <Text style={[
          styles.badgeDescription,
          !isEarned && styles.lockedBadgeDescription
        ]}>
          {item.description}
        </Text>
        
        {isEarned && item.earnedAt && (
          <Text style={styles.earnedDate}>
            Earned {formatDate(item.earnedAt)}
          </Text>
        )}
        
        {!isEarned && (
          <Text style={styles.unlockHint}>
            Complete the requirement above to unlock
          </Text>
        )}
      </View>
    );
  };

  const renderEarnedBadge = ({ item }: { item: any }) => 
    renderBadge({ item, isEarned: true });
  
  const renderLockedBadge = ({ item }: { item: any }) => 
    renderBadge({ item, isEarned: false });

  return (
    <View style={styles.container}>
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🏆 Earned Badges ({earnedBadges.length})
            </Text>
          </View>
          
          <FlatList
            data={earnedBadges}
            renderItem={renderEarnedBadge}
            keyExtractor={(item) => `earned-${item.id}`}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.badgesGrid}
          />
        </>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🔒 Locked Badges ({lockedBadges.length})
            </Text>
          </View>
          
          <FlatList
            data={lockedBadges}
            renderItem={renderLockedBadge}
            keyExtractor={(item) => `locked-${item.id}`}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.badgesGrid}
          />
        </>
      )}

      {/* Empty State */}
      {badges.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>No badges yet</Text>
          <Text style={styles.emptyMessage}>
            Attend events and engage with the community to earn badges.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  badgesGrid: {
    padding: 16,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  lockedBadgeCard: {
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
    borderStyle: "dashed",
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  lockedBadgeIcon: {
    backgroundColor: "#6c757d",
  },
  badgeEmoji: {
    fontSize: 24,
  },
  lockedBadgeEmoji: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  lockedBadgeName: {
    color: "#6c757d",
  },
  badgeDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  lockedBadgeDescription: {
    color: "#adb5bd",
  },
  earnedDate: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "500",
    textAlign: "center",
  },
  unlockHint: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // Skeleton styles
  titleSkeleton: {
    width: 150,
    height: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  badgeSkeleton: {
    flex: 1,
    height: 150,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    margin: 4,
  },
});