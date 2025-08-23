import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

interface SkeletonRowProps {
  kind: "tiles" | "events" | "feed" | "galleries";
}

export default function SkeletonRow({ kind }: SkeletonRowProps) {
  const renderTiles = () => (
    <View style={styles.tilesContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.tile} />
      ))}
    </View>
  );

  const renderEvents = () => (
    <View style={styles.eventsContainer}>
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={styles.eventCard} />
      ))}
    </View>
  );

  const renderFeed = () => (
    <View style={styles.feedContainer}>
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={styles.feedCard} />
      ))}
    </View>
  );

  const renderGalleries = () => (
    <View style={styles.galleriesContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.galleryCard} />
      ))}
    </View>
  );

  const renderContent = () => {
    switch (kind) {
      case "tiles":
        return renderTiles();
      case "events":
        return renderEvents();
      case "feed":
        return renderFeed();
      case "galleries":
        return renderGalleries();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.dimensions.sectionGap,
  },
  header: {
    height: 24,
    width: 120,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.dimensions.screenPadding,
    marginBottom: theme.spacing.md,
  },
  tilesContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.dimensions.screenPadding,
    gap: theme.spacing.md,
  },
  tile: {
    flex: 1,
    height: theme.dimensions.quickActionHeight,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  eventsContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.dimensions.screenPadding,
    gap: theme.spacing.md,
  },
  eventCard: {
    width: 280,
    height: 160,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  feedContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.dimensions.screenPadding,
    gap: theme.spacing.md,
  },
  feedCard: {
    width: 280,
    height: 200,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  galleriesContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.dimensions.screenPadding,
    gap: theme.spacing.md,
  },
  galleryCard: {
    width: 160,
    height: 140,
    backgroundColor: theme.colors.surface.secondary,
    borderRadius: theme.borderRadius.lg,
  },
});