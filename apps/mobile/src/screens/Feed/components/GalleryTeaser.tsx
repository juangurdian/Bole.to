import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface GalleryTeaserProps {
  photos: any[];
  revealAt?: string;
  onOpen: () => void;
}

export default function GalleryTeaser({ photos, revealAt, onOpen }: GalleryTeaserProps) {
  const isRevealed = !revealAt || new Date() > new Date(revealAt);
  
  const getTimeUntilReveal = () => {
    if (!revealAt) return null;
    const now = new Date();
    const revealTime = new Date(revealAt);
    const diffMs = revealTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours > 0 ? `${diffHours}h` : `${Math.floor(diffMs / (1000 * 60))}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Photos</Text>
        {isRevealed && (
          <TouchableOpacity onPress={onOpen}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.grid} onPress={onOpen}>
        {photos.slice(0, 4).map((photo, index) => (
          <View
            key={photo.id}
            style={[
              styles.photoSlot,
              index % 2 === 1 && styles.rightPhoto,
              index >= 2 && styles.bottomPhoto
            ]}
          >
            {isRevealed ? (
              <View style={styles.photo}>
                <Feather name="image" size={20} color={v2Colors.text.tertiary} />
              </View>
            ) : (
              <View style={[styles.photo, styles.lockedPhoto]}>
                <Feather name="lock" size={16} color={v2Colors.text.tertiary} />
              </View>
            )}
          </View>
        ))}
        
        {!isRevealed && (
          <View style={styles.revealOverlay}>
            <Feather name="lock" size={32} color={v2Colors.text.primary} />
            <Text style={styles.revealTitle}>Photos locked</Text>
            <Text style={styles.revealTime}>
              Reveals in {getTimeUntilReveal()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    padding: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(3),
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
  },
  viewAllText: {
    fontSize: 16,
    color: v2Colors.accent,
    fontWeight: '500' as const,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 200,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: v2Colors.surface2,
  },
  photoSlot: {
    width: "50%",
    height: "50%",
    padding: 1,
  },
  rightPhoto: {
    paddingLeft: 0,
  },
  bottomPhoto: {
    paddingTop: 0,
  },
  photo: {
    flex: 1,
    backgroundColor: v2Colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedPhoto: {
    backgroundColor: v2Colors.surface1,
    borderWidth: 2,
    borderColor: v2Colors.border,
    borderStyle: "dashed",
  },
  photoIcon: {
    fontSize: 24,
  },
  lockIcon: {
    fontSize: 16,
  },
  revealOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${v2Colors.bg}90`,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.md,
  },
  revealIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  revealTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
    marginBottom: spacing(1),
    marginTop: spacing(2),
  },
  revealTime: {
    fontSize: 14,
    color: v2Colors.text.secondary,
  },
});