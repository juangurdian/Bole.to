import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const mockResults = {
  events: [
    { id: "1", name: "Summer Music Festival", date: "Jul 15", type: "event" },
    { id: "2", name: "Tech Conference 2024", date: "Aug 20", type: "event" },
  ],
  artists: [
    { id: "3", name: "The Midnight", followers: "250K", type: "artist" },
  ],
  venues: [
    { id: "4", name: "Madison Square Garden", location: "New York", type: "venue" },
  ],
};

export default function SearchResultsScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState(route.params?.query || "");
  const [activeTab, setActiveTab] = useState<"all" | "events" | "artists" | "venues">("all");

  const getFilteredResults = () => {
    if (activeTab === "all") {
      return [...mockResults.events, ...mockResults.artists, ...mockResults.venues];
    }
    return mockResults[activeTab as keyof typeof mockResults] || [];
  };

  const renderResultItem = ({ item }: any) => {
    const getIcon = () => {
      if (item.type === "event") return "calendar";
      if (item.type === "artist") return "music";
      if (item.type === "venue") return "map-pin";
      return "search";
    };

    const getSubtitle = () => {
      if (item.type === "event") return item.date;
      if (item.type === "artist") return `${item.followers} followers`;
      if (item.type === "venue") return item.location;
      return "";
    };

    return (
      <TouchableOpacity style={styles.resultItem}>
        <View style={styles.resultIcon}>
          <Feather name={getIcon() as any} size={24} color="#666" />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.name}</Text>
          <Text style={styles.resultSubtitle}>{getSubtitle()}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, artists, venues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.activeTab]}
          onPress={() => setActiveTab("events")}
        >
          <Text style={[styles.tabText, activeTab === "events" && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "artists" && styles.activeTab]}
          onPress={() => setActiveTab("artists")}
        >
          <Text style={[styles.tabText, activeTab === "artists" && styles.activeTabText]}>
            Artists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "venues" && styles.activeTab]}
          onPress={() => setActiveTab("venues")}
        >
          <Text style={[styles.tabText, activeTab === "venues" && styles.activeTabText]}>
            Venues
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={getFilteredResults()}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    maxHeight: 48,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  resultsContainer: {
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});