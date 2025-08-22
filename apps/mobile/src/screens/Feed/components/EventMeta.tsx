import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";

interface EventMetaProps {
  event: any;
  onOpenMap: () => void;
  onOpenOrganizer: () => void;
}

export default function EventMeta({ event, onOpenMap, onOpenOrganizer }: EventMetaProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Event Title */}
      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>

      {/* Location Row */}
      <TouchableOpacity style={styles.locationRow} onPress={onOpenMap}>
        <View style={styles.locationIcon}>
          <Text style={styles.locationIconText}>📍</Text>
        </View>
        <View style={styles.locationText}>
          <Text style={styles.venueName} numberOfLines={1}>
            {event.venue.name}
          </Text>
          <Text style={styles.cityName} numberOfLines={1}>
            {event.venue.city}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Organizer Row */}
      <TouchableOpacity style={styles.organizerRow} onPress={onOpenOrganizer}>
        <View style={styles.organizerAvatar}>
          <Text style={styles.organizerAvatarText}>
            {getInitials(event.organizer.name)}
          </Text>
        </View>
        <View style={styles.organizerText}>
          <View style={styles.organizerNameRow}>
            <Text style={styles.organizerName} numberOfLines={1}>
              {event.organizer.name}
            </Text>
            {event.organizer.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.organizerLabel}>Organizer</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Tags Row */}
      <View style={styles.tagsRow}>
        {event.categories.map((category: string, index: number) => (
          <View key={category} style={styles.tag}>
            <Text style={styles.tagText}>{category}</Text>
          </View>
        ))}
        {event.policies.minAge && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{event.policies.minAge}+</Text>
          </View>
        )}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 34,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationIcon: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 16,
  },
  locationText: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  cityName: {
    fontSize: 14,
    color: "#666",
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  organizerAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  organizerText: {
    flex: 1,
  },
  organizerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 6,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  organizerLabel: {
    fontSize: 14,
    color: "#666",
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
    fontWeight: "300",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
});