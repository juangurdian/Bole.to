import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Dimensions 
} from "react-native";

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
        <View style={[
          styles.avatar,
          item.isConnected && styles.avatarConnected
        ]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarConnected: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  connectedIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  moreAvatarContainer: {
    alignItems: "center",
  },
  moreAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  moreAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6c757d",
  },
  avatarSeparator: {
    width: 8,
  },
});