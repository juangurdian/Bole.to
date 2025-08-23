import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
} from "react-native";
import { theme } from "../../../theme";
import SectionHeader from "./SectionHeader";
import GalleryTeaserSmall from "./GalleryTeaserSmall";

interface ReleasedGallery {
  eventId: string;
  eventTitle: string;
  thumbUrls: string[];
  releasedAt: string;
}

interface ReleasedPhotosSectionProps {
  items: ReleasedGallery[];
  onGalleryPress?: (eventId: string) => void;
  onSeeAll?: () => void;
}

export default function ReleasedPhotosSection({ 
  items, 
  onGalleryPress = () => {}, 
  onSeeAll 
}: ReleasedPhotosSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const renderGalleryCard = ({ item }: { item: ReleasedGallery }) => (
    <GalleryTeaserSmall
      gallery={item}
      onPress={onGalleryPress}
    />
  );

  return (
    <View style={styles.container}>
      <SectionHeader 
        title="Released Photos" 
        onSeeAll={onSeeAll}
      />
      
      <FlatList
        data={items}
        renderItem={renderGalleryCard}
        keyExtractor={(item) => item.eventId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.dimensions.sectionGap,
  },
  listContent: {
    paddingHorizontal: theme.dimensions.screenPadding,
  },
});