import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
          <Feather name="map-pin" size={18} color={v2Colors.accent} />
        </View>
        <View style={styles.locationText}>
          <Text style={styles.venueName} numberOfLines={1}>
            {event.venue.name}
          </Text>
          <Text style={styles.cityName} numberOfLines={1}>
            {event.venue.city}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={v2Colors.text.tertiary} />
      </TouchableOpacity>

      {/* Organizer Row */}
      <TouchableOpacity style={styles.organizerRow} onPress={onOpenOrganizer}>
        <LinearGradient
          colors={[v2Colors.accent, v2Colors.accent2]}
          style={styles.organizerAvatar}
        >
          <Text style={styles.organizerAvatarText}>
            {getInitials(event.organizer.name)}
          </Text>
        </LinearGradient>
        <View style={styles.organizerText}>
          <View style={styles.organizerNameRow}>
            <Text style={styles.organizerName} numberOfLines={1}>
              {event.organizer.name}
            </Text>
            {event.organizer.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color={v2Colors.text.primary} />
              </View>
            )}
          </View>
          <Text style={styles.organizerLabel}>Organizer</Text>
        </View>
        <Feather name="chevron-right" size={18} color={v2Colors.text.tertiary} />
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
    backgroundColor: v2Colors.surface1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(5),
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    lineHeight: 38,
    marginBottom: spacing(4),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v2Colors.border,
  },
  locationIcon: {
    width: 36,
    height: 36,
    backgroundColor: `${v2Colors.accent}15`,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing(3),
  },
  locationIconText: {
    fontSize: 16,
  },
  locationText: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(0.5),
  },
  cityName: {
    fontSize: 14,
    color: v2Colors.text.secondary,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v2Colors.border,
  },
  organizerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing(3),
  },
  organizerAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: v2Colors.bg,
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
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginRight: spacing(1.5),
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: v2Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  organizerLabel: {
    fontSize: 14,
    color: v2Colors.text.secondary,
  },
  chevron: {
    fontSize: 18,
    color: "#c7c7cc",
    fontWeight: "300",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing(4),
    gap: spacing(2),
  },
  tag: {
    backgroundColor: v2Colors.surface2,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: v2Colors.text.primary,
  },
});