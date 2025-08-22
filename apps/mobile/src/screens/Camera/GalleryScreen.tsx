import React from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";

export default function GalleryScreen({ navigation }: any) {
  const api = useApi();
  const galleryQuery = useQuery({ 
    queryKey: ["event-gallery"], 
    queryFn: api.getEventGallery 
  });

  if (galleryQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Skeleton h={120} />
          <Skeleton h={120} />
          <Skeleton h={120} />
        </View>
      </SafeAreaView>
    );
  }

  if (galleryQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => galleryQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const photos = galleryQuery.data ?? [];
  
  if (!photos.length) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState 
          text="No photos yet" 
          onRetry={() => galleryQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const renderPhoto = ({ item }: any) => (
    <TouchableOpacity style={styles.photoCard}>
      <Card>
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoEmoji}>🖼️</Text>
          <Text style={styles.photoTitle}>{item.title || "Event Photo"}</Text>
        </View>
        
        <View style={styles.photoInfo}>
          <Text style={styles.authorName}>{item.author?.name || "Unknown"}</Text>
          <Text style={styles.photoDate}>
            {new Date(item.createdAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={item => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={galleryQuery.isFetching} onRefresh={() => galleryQuery.refetch()} />}
        renderItem={renderPhoto}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  photoCard: {
    flex: 1,
    margin: 4,
  },
  photoPlaceholder: {
    aspectRatio: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoTitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  photoInfo: {
    alignItems: "center",
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  photoDate: {
    fontSize: 10,
    color: "#999",
  },
});