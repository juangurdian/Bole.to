import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

interface GalleryTeaserCardProps {
  item: any;
  onOpen: () => void;
}

export default function GalleryTeaserCard({ item, onOpen }: GalleryTeaserCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!item.revealed) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const revealTime = new Date(item.revealAt).getTime();
        const difference = revealTime - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft("Revealed!");
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [item.revealed, item.revealAt]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onOpen} activeOpacity={0.95}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <View style={styles.eventAvatar}>
            <Text style={styles.eventAvatarText}>{item.eventName.charAt(0)}</Text>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{item.eventName}</Text>
            <Text style={styles.timestamp}>
              Gallery • {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.typeIcon}>
          <Text style={styles.typeEmoji}>🎞️</Text>
        </View>
      </View>

      {/* Gallery Grid */}
      <View style={styles.galleryContainer}>
        <View style={styles.galleryGrid}>
          {item.previewUrls.slice(0, 4).map((url: string, index: number) => (
            <View key={index} style={styles.galleryItem}>
              <Image 
                source={{ uri: url }} 
                style={[
                  styles.galleryImage,
                  !item.revealed && styles.galleryImageBlurred
                ]} 
              />
              {!item.revealed && (
                <View style={styles.blurOverlay}>
                  <Text style={styles.blurIcon}>🔒</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Status Overlay */}
        <View style={styles.statusOverlay}>
          {item.revealed ? (
            <View style={styles.revealedBadge}>
              <Text style={styles.revealedIcon}>✨</Text>
              <Text style={styles.revealedText}>Photos revealed!</Text>
            </View>
          ) : (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownIcon}>⏰</Text>
              <Text style={styles.countdownText}>Reveals in {timeLeft}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.galleryDescription}>
          {item.revealed 
            ? "Event photos are now available to view" 
            : "Event photos will be revealed 24 hours after the event"
          }
        </Text>
        
        <TouchableOpacity style={[
          styles.actionButton,
          item.revealed && styles.actionButtonRevealed
        ]}>
          <Text style={[
            styles.actionText,
            item.revealed && styles.actionTextRevealed
          ]}>
            {item.revealed ? "View Photos" : "Remind Me"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 14,
    color: "#666",
  },
  typeIcon: {
    marginLeft: 12,
  },
  typeEmoji: {
    fontSize: 20,
  },
  galleryContainer: {
    position: "relative",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  galleryItem: {
    width: "48.5%",
    aspectRatio: 1,
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  galleryImageBlurred: {
    opacity: 0.3,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  blurIcon: {
    fontSize: 24,
  },
  statusOverlay: {
    position: "absolute",
    top: 8,
    left: 16,
    right: 16,
  },
  revealedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00C851",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  revealedIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  revealedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  countdownIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
  },
  galleryDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonRevealed: {
    backgroundColor: "#007AFF",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  actionTextRevealed: {
    color: "white",
  },
});