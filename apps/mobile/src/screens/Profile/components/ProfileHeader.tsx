import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator 
} from "react-native";

interface ProfileHeaderProps {
  profile: any;
  isLoading: boolean;
  onEditPress: () => void;
}

export default function ProfileHeader({ profile, isLoading, onEditPress }: ProfileHeaderProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.avatarSkeleton} />
        <View style={styles.infoContainer}>
          <View style={styles.nameSkeleton} />
          <View style={styles.handleSkeleton} />
          <View style={styles.bioSkeleton} />
        </View>
        <View style={styles.editButtonSkeleton} />
      </View>
    );
  }

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const renderBadges = () => {
    if (!profile.badges) return null;

    const earnedBadges = profile.badges.filter(badge => badge.earned);
    if (earnedBadges.length === 0) return null;

    return (
      <View style={styles.badgesContainer}>
        {earnedBadges.slice(0, 3).map((badge) => (
          <View key={badge.id} style={styles.badge}>
            <Text style={styles.badgeText}>{badge.name}</Text>
          </View>
        ))}
        {earnedBadges.length > 3 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>+{earnedBadges.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity style={styles.avatarContainer} onPress={onEditPress}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(profile.name)}
          </Text>
        </View>
        <View style={styles.editAvatarOverlay}>
          <Text style={styles.editAvatarText}>✏️</Text>
        </View>
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.roles?.includes("promoter") && (
            <View style={styles.promoterBadge}>
              <Text style={styles.promoterBadgeText}>🎪</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.handle}>@{profile.handle}</Text>
        
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {renderBadges()}
        
        {profile.privacy?.profile === "private" && (
          <View style={styles.privacyBanner}>
            <Text style={styles.privacyText}>🔒 Your profile is private</Text>
          </View>
        )}
      </View>

      {/* Edit Button */}
      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  avatarContainer: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#666",
  },
  editAvatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  editAvatarText: {
    fontSize: 12,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  promoterBadge: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  promoterBadgeText: {
    fontSize: 16,
  },
  handle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
    gap: 6,
  },
  badge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  privacyBanner: {
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE69C",
    marginTop: 8,
  },
  privacyText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
  },
  editButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
  },
  // Skeleton styles
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: 16,
  },
  nameSkeleton: {
    width: 120,
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  handleSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 12,
  },
  bioSkeleton: {
    width: 200,
    height: 44,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 16,
  },
  editButtonSkeleton: {
    height: 44,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
});