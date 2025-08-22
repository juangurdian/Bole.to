import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Card from "../../../components/Card";

interface HomeGalleryTeaserWidgetProps {
  galleries: any[];
  navigation: any;
}

export default function HomeGalleryTeaserWidget({ galleries, navigation }: HomeGalleryTeaserWidgetProps) {
  if (!galleries.length) return null;

  const gallery = galleries[0]; // Show first gallery
  const revealTime = new Date(gallery.revealAt);
  const now = new Date();
  const isRevealed = revealTime <= now;
  
  const getTimeUntilReveal = () => {
    if (isRevealed) return "Photos are ready!";
    
    const diff = revealTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Reveals in ${hours}h ${minutes}m`;
    } else {
      return `Reveals in ${minutes}m`;
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isRevealed ? "📸 Event Photos" : "🎞️ Photos Coming Soon"}
        </Text>
        <Text style={styles.subtitle}>
          {gallery.eventTitle}
        </Text>
      </View>

      <View style={styles.gallery}>
        <View style={styles.previewGrid}>
          {[1, 2, 3, 4].map((index) => (
            <View 
              key={index} 
              style={[
                styles.previewImage,
                !isRevealed && styles.blurredImage
              ]}
            >
              <Text style={styles.previewEmoji}>📷</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.galleryInfo}>
          <Text style={styles.photoCount}>
            {gallery.photoCount} photos
          </Text>
          <Text style={[
            styles.revealText,
            isRevealed && styles.revealTextReady
          ]}>
            {getTimeUntilReveal()}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.viewButton,
          !isRevealed && styles.viewButtonDisabled
        ]}
        onPress={() => {
          if (isRevealed) {
            navigation.navigate("Feed", { 
              screen: "GalleryScreen",
              params: { eventId: gallery.eventId }
            });
          }
        }}
        disabled={!isRevealed}
      >
        <Text style={[
          styles.viewButtonText,
          !isRevealed && styles.viewButtonTextDisabled
        ]}>
          {isRevealed ? "View Gallery" : "Locked"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  gallery: {
    marginBottom: 16,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  previewImage: {
    width: 70,
    height: 70,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  blurredImage: {
    backgroundColor: "#e0e0e0",
    opacity: 0.6,
  },
  previewEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  galleryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  photoCount: {
    fontSize: 14,
    color: "#666",
  },
  revealText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff9500",
  },
  revealTextReady: {
    color: "#34c759",
  },
  viewButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  viewButtonTextDisabled: {
    color: "#999",
  },
});