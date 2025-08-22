import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface RecentPhotosGridProps {
  photos: any[];
  navigation: any;
}

export default function RecentPhotosGrid({ photos, navigation }: RecentPhotosGridProps) {
  const handlePhotoPress = (photo: any) => {
    navigation.navigate("EventScreen", { 
      eventId: photo.eventId, 
      eventName: photo.eventName,
      anchor: "gallery"
    });
  };

  const handleViewAllPress = () => {
    navigation.navigate("Profile", { tab: "photos" });
  };

  if (!photos || photos.length === 0) return null;

  const renderPhoto = (photo: any, index: number) => {
    const isRevealed = photo.isRevealed;
    
    return (
      <TouchableOpacity
        key={photo.id}
        style={[
          styles.photoContainer,
          index % 3 === 1 && styles.middlePhoto
        ]}
        onPress={() => handlePhotoPress(photo)}
      >
        <View style={[
          styles.photo,
          !isRevealed && styles.unrevealedPhoto
        ]}>
          {isRevealed ? (
            <Text style={styles.photoIcon}>📸</Text>
          ) : (
            <View style={styles.unrevealedContent}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.unrevealedText}>Soon</Text>
            </View>
          )}
        </View>
        
        {/* Event name badge */}
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText} numberOfLines={1}>
            {photo.eventName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {photos.slice(0, 6).map((photo, index) => renderPhoto(photo, index))}
      </View>
      
      {photos.length > 6 && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllPress}>
          <Text style={styles.viewAllText}>View all photos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoContainer: {
    width: "32%",
    aspectRatio: 1,
    marginBottom: 8,
    position: "relative",
  },
  middlePhoto: {
    marginHorizontal: "2%",
  },
  photo: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  unrevealedPhoto: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  photoIcon: {
    fontSize: 24,
  },
  unrevealedContent: {
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  unrevealedText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
  eventBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "500",
    textAlign: "center",
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
});