import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

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
                <Text style={styles.photoIcon}>📸</Text>
              </View>
            ) : (
              <View style={[styles.photo, styles.lockedPhoto]}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </View>
        ))}
        
        {!isRevealed && (
          <View style={styles.revealOverlay}>
            <Text style={styles.revealIcon}>🔒</Text>
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
    backgroundColor: "white",
    marginBottom: 8,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  viewAllText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
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
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedPhoto: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  revealIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  revealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  revealTime: {
    fontSize: 14,
    color: "white",
  },
});