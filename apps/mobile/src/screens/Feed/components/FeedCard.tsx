import React from "react";
import { View, StyleSheet } from "react-native";
import PostCard from "./PostCard";
import PollCard from "./PollCard";
import AnnouncementCard from "./AnnouncementCard";
import GalleryTeaserCard from "./GalleryTeaserCard";
import UpdateCard from "./UpdateCard";

interface FeedCardProps {
  item: any;
  onOpenEvent: (eventId: string, anchor?: string) => void;
  onRefresh: () => void;
}

export default function FeedCard({ item, onOpenEvent, onRefresh }: FeedCardProps) {
  const renderCard = () => {
    switch (item.type) {
      case "announcement":
        return (
          <AnnouncementCard 
            item={item} 
            onPress={() => onOpenEvent(item.eventId, "feed")} 
          />
        );
      case "post":
        return (
          <PostCard 
            item={item} 
            onOpen={() => onOpenEvent(item.eventId, "feed")}
            onRefresh={onRefresh}
          />
        );
      case "poll":
        return (
          <PollCard 
            item={item} 
            onOpen={() => onOpenEvent(item.eventId, "feed")}
            onRefresh={onRefresh}
          />
        );
      case "gallery":
        return (
          <GalleryTeaserCard 
            item={item} 
            onOpen={() => onOpenEvent(item.eventId, "gallery")} 
          />
        );
      case "update":
        return (
          <UpdateCard 
            item={item} 
            onOpen={() => onOpenEvent(item.eventId)} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderCard()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
});