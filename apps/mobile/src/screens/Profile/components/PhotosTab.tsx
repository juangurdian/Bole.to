import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../../api";

interface PhotosTabProps {
  profile: any;
  isLoading: boolean;
  navigation: any;
}

export default function PhotosTab({ profile, isLoading: profileLoading, navigation }: PhotosTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "revealed">("all");
  const api = useApi();

  const photosQuery = useInfiniteQuery({
    queryKey: ["profile-photos", selectedFilter],
    queryFn: ({ pageParam }) => 
      api.getMyPhotos({ 
        filter: selectedFilter,
        after: pageParam,
        pageSize: 20 
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  const allPhotos = photosQuery.data?.pages.flatMap(page => page.photos) || [];

  const renderPhoto = ({ item, index }: { item: any; index: number }) => {
    const handlePress = () => {
      navigation.navigate("EventScreen", {
        eventId: item.eventId,
        eventName: item.eventName,
        anchor: "gallery"
      });
    };

    return (
      <TouchableOpacity
        style={[
          styles.photoContainer,
          index % 3 === 1 && styles.middlePhoto
        ]}
        onPress={handlePress}
      >
        <View style={[
          styles.photo,
          !item.isRevealed && styles.unrevealedPhoto
        ]}>
          {item.isRevealed ? (
            <Text style={styles.photoIcon}>📸</Text>
          ) : (
            <View style={styles.unrevealedContent}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.unrevealedText}>Soon</Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText} numberOfLines={1}>
            {item.eventName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.filterSkeleton} />
          ))}
        </View>
        <View style={styles.gridSkeleton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "all" && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "all" && styles.activeFilterText
            ]}
          >
            All Photos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === "revealed" && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter("revealed")}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === "revealed" && styles.activeFilterText
            ]}
          >
            Revealed Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Notice */}
      {profile?.privacy?.photos !== "public" && (
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            {profile.privacy.photos === "followers" 
              ? "👥 Photos visible to followers only"
              : "🔒 Photos are private"
            }
          </Text>
        </View>
      )}

      {/* Photos Grid */}
      {allPhotos.length > 0 ? (
        <FlatList
          data={allPhotos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyMessage}>
            Take photos at events to share your experiences.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeFilterTab: {
    borderBottomColor: "#007AFF",
  },
  filterText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  privacyNotice: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  privacyText: {
    fontSize: 14,
    color: "#007AFF",
    textAlign: "center",
  },
  gridContainer: {
    padding: 16,
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
    fontSize: 20,
  },
  unrevealedContent: {
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  unrevealedText: {
    fontSize: 10,
    color: "#6c757d",
    fontWeight: "500",
  },
  eventBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventBadgeText: {
    fontSize: 9,
    color: "white",
    fontWeight: "500",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // Skeleton styles
  filterSkeleton: {
    flex: 1,
    height: 32,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  gridSkeleton: {
    flex: 1,
    margin: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
});