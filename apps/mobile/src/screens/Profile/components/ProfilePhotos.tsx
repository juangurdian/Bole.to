import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

interface Photo {
  id: string;
  url: string;
  eventName: string;
  date: string;
}

interface ProfilePhotosProps {
  photos?: Photo[];
  onPhotoPress: (photoId: string) => void;
}

export default function ProfilePhotos({ photos, onPhotoPress }: ProfilePhotosProps) {
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📸</Text>
        <Text style={styles.emptyText}>No photos yet</Text>
      </View>
    );
  }

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => onPhotoPress(item.id)}
    >
      <Image source={{ uri: item.url }} style={styles.photoImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.photoOverlay}
      >
        <Text style={styles.photoEvent} numberOfLines={1}>
          {item.eventName}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={photos}
      renderItem={renderPhoto}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.xs,
  },
  photoEvent: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.medium,
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
});