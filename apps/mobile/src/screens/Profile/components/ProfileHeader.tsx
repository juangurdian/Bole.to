import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../../auth/useAuth";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface ProfileHeaderProps {
  profile: any;
  isLoading: boolean;
  onEditPress: () => void;
}

export default function ProfileHeader({ profile, isLoading, onEditPress }: ProfileHeaderProps) {
  const { user, isUsingHiEvents } = useAuth();
  
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

  // Use profile data if available, otherwise fall back to auth user
  const displayProfile = profile || user;
  if (!displayProfile) return null;

  // Helper to get display name based on profile source
  const getDisplayName = (profile: any) => {
    if (isUsingHiEvents) {
      // Hi.Events user structure
      return profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
    } else {
      // Gateway user structure
      return profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
    }
  };

  // Helper to get user handle/username
  const getDisplayHandle = (profile: any) => {
    if (isUsingHiEvents) {
      // Hi.Events doesn't have handles, use email prefix or account name
      return profile.email?.split('@')[0] || profile.currentAccount?.name || 'user';
    } else {
      // Gateway has handles
      return profile.handle || profile.email?.split('@')[0] || 'user';
    }
  };

  // Helper to get bio/description
  const getDisplayBio = (profile: any) => {
    if (isUsingHiEvents) {
      // Hi.Events doesn't have bio in user profile
      return profile.profile?.bio || null;
    } else {
      return profile.bio || null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = getDisplayName(displayProfile);
  const displayHandle = getDisplayHandle(displayProfile);
  const displayBio = getDisplayBio(displayProfile);

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
        <LinearGradient
          colors={[v2Colors.accent, v2Colors.accent2]}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>
            {getInitials(displayName)}
          </Text>
        </LinearGradient>
        <View style={styles.editAvatarOverlay}>
          <Feather name="edit-2" size={12} color={v2Colors.text.primary} />
        </View>
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          {(displayProfile.roles?.includes("promoter") || displayProfile.role === "promoter") && (
            <View style={styles.promoterBadge}>
              <Feather name="star" size={16} color={v2Colors.accent} />
            </View>
          )}
          {isUsingHiEvents && displayProfile.currentAccount && (
            <View style={styles.hiEventsBadge}>
              <Text style={styles.hiEventsBadgeText}>Hi.Events</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.handle}>@{displayHandle}</Text>
        
        {displayBio && (
          <Text style={styles.bio}>{displayBio}</Text>
        )}

        {/* Show Hi.Events account info if available */}
        {isUsingHiEvents && displayProfile.currentAccount && (
          <View style={styles.accountInfo}>
            <Text style={styles.accountInfoText}>
              Account: {displayProfile.currentAccount.name}
            </Text>
            {displayProfile.accounts && displayProfile.accounts.length > 1 && (
              <Text style={styles.accountInfoText}>
                {displayProfile.accounts.length} accounts available
              </Text>
            )}
          </View>
        )}

        {renderBadges()}
        
        {displayProfile.privacy?.profile === "private" && (
          <View style={styles.privacyBanner}>
            <Feather name="lock" size={14} color={v2Colors.text.secondary} style={{ marginRight: spacing(1) }} />
            <Text style={styles.privacyText}>Your profile is private</Text>
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
    backgroundColor: v2Colors.surface1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(5),
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  avatarContainer: {
    alignSelf: "center",
    position: "relative",
    marginBottom: spacing(4),
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: v2Colors.text.primary,
  },
  editAvatarOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: v2Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: v2Colors.surface1,
  },
  editAvatarText: {
    fontSize: 12,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: spacing(4),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing(1),
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: v2Colors.text.primary,
    marginRight: spacing(2),
  },
  promoterBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${v2Colors.accent}20`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.accent,
  },
  handle: {
    fontSize: 16,
    color: v2Colors.text.secondary,
    marginBottom: spacing(2),
    fontWeight: '500',
  },
  bio: {
    fontSize: 16,
    color: v2Colors.text.primary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing(3),
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: spacing(3),
    gap: spacing(1.5),
  },
  badge: {
    backgroundColor: `${v2Colors.accent}15`,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.accent}40`,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: v2Colors.accent,
  },
  privacyBanner: {
    backgroundColor: v2Colors.surface2,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    marginTop: spacing(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  privacyText: {
    fontSize: 14,
    color: v2Colors.text.secondary,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: `${v2Colors.accent}15`,
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.accent,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: v2Colors.accent,
    textAlign: "center",
  },
  // Skeleton styles
  avatarSkeleton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: v2Colors.surface2,
    alignSelf: "center",
    marginBottom: spacing(4),
  },
  nameSkeleton: {
    width: 140,
    height: 28,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
    marginBottom: spacing(2),
  },
  handleSkeleton: {
    width: 100,
    height: 16,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
    marginBottom: spacing(3),
  },
  bioSkeleton: {
    width: 220,
    height: 48,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.sm,
    marginBottom: spacing(4),
  },
  editButtonSkeleton: {
    height: 48,
    backgroundColor: v2Colors.surface2,
    borderRadius: radii.md,
  },
  // Hi.Events specific styles
  hiEventsBadge: {
    backgroundColor: v2Colors.accent2,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: radii.sm,
    marginLeft: spacing(2),
  },
  hiEventsBadgeText: {
    color: v2Colors.text.primary,
    fontSize: 10,
    fontWeight: "600",
  },
  accountInfo: {
    backgroundColor: v2Colors.surface2,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    marginTop: spacing(2),
  },
  accountInfoText: {
    fontSize: 13,
    color: v2Colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing(0.5),
  },
});