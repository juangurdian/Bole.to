import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Dimensions 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface Attendee {
  id: string;
  name: string;
  isConnected?: boolean;
}

interface AttendeesRailProps {
  attendees: Attendee[];
  totalCount: number;
  mode: "visitor" | "attendee";
}

const { width: screenWidth } = Dimensions.get("window");

export default function AttendeesRail({ attendees, totalCount, mode }: AttendeesRailProps) {
  const visibleAttendees = attendees.slice(0, 20); // Show max 20 in rail
  const hasMoreAttendees = totalCount > visibleAttendees.length;

  const renderAttendeeAvatar = ({ item, index }: { item: Attendee; index: number }) => {
    // Show first 15 avatars, then a "+N more" if needed
    if (index >= 15) return null;
    
    if (index === 14 && hasMoreAttendees) {
      const remainingCount = totalCount - 15;
      return (
        <TouchableOpacity style={styles.moreAvatarContainer} key="more">
          <View style={styles.moreAvatar}>
            <Text style={styles.moreAvatarText}>+{remainingCount}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    const initials = item.name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <TouchableOpacity style={styles.avatarContainer} key={item.id}>
        <LinearGradient
          colors={[v2Colors.accent, v2Colors.accent2]}
          style={[
            styles.avatar,
            item.isConnected && styles.avatarConnected
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        {item.isConnected && <View style={styles.connectedIndicator} />}
      </TouchableOpacity>
    );
  };

  const getAttendeesText = () => {
    if (totalCount === 0) return "No attendees yet";
    if (totalCount === 1) return "1 attendee";
    return `${totalCount.toLocaleString()} attendees`;
  };

  const getSubtitleText = () => {
    if (mode === "visitor") return "Get tickets to see who's going";
    
    const connectedCount = attendees.filter(a => a.isConnected).length;
    if (connectedCount === 0) return "Connect with other attendees";
    if (connectedCount === 1) return "1 connection attending";
    return `${connectedCount} connections attending`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getAttendeesText()}</Text>
        <Text style={styles.subtitle}>{getSubtitleText()}</Text>
      </View>

      {visibleAttendees.length > 0 && (
        <View style={styles.railContainer}>
          <FlatList
            data={visibleAttendees}
            renderItem={renderAttendeeAvatar}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            ItemSeparatorComponent={() => <View style={styles.avatarSeparator} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  header: {
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(0.5),
  },
  subtitle: {
    fontSize: 14,
    color: v2Colors.text.secondary,
  },
  railContainer: {
    marginTop: 4,
  },
  rail: {
    paddingVertical: 4,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: v2Colors.surface1,
  },
  avatarConnected: {
    borderColor: v2Colors.success,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: v2Colors.bg,
  },
  connectedIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: v2Colors.success,
    borderWidth: 2,
    borderColor: v2Colors.surface1,
  },
  moreAvatarContainer: {
    alignItems: "center",
  },
  moreAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: v2Colors.surface2,
    borderWidth: 2,
    borderColor: v2Colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  moreAvatarText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: v2Colors.text.secondary,
  },
  avatarSeparator: {
    width: 8,
  },
});