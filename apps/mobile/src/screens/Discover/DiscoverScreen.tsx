import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";

// Discover Components
import DiscoverHeader from "./components/DiscoverHeader";
import FilterChips from "./components/FilterChips";
import SortBar from "./components/SortBar";
import DiscoverSections from "./components/DiscoverSections";
import AllEventsList from "./components/AllEventsList";

export default function DiscoverScreen({ navigation }: any) {
  const { user } = useAuth();
  const api = useApi();
  
  const [query, setQuery] = useState({
    city: user?.city || "Managua",
    dateRange: "all" as "all" | "tonight" | "weekend",
    categories: [] as string[],
    price: null as { min?: number; max?: number } | null,
    sort: "recommended" as "recommended" | "soonest" | "price_low" | "popular" | "new"
  });

  const [refreshing, setRefreshing] = useState(false);

  // Fetch discover data
  const discoverQuery = useQuery({
    queryKey: ["discover", query],
    queryFn: () => api.discover(query),
    keepPreviousData: true
  });

  // Infinite query for "all events" list
  const allEventsQuery = useInfiniteQuery({
    queryKey: ["discover-all", query],
    queryFn: ({ pageParam = 1 }) => api.discover({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.all.meta.hasMore ? lastPage.all.meta.page + 1 : undefined;
    },
    keepPreviousData: true
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      discoverQuery.refetch(),
      allEventsQuery.refetch()
    ]);
    setRefreshing(false);
  }, [discoverQuery, allEventsQuery]);

  const updateQuery = useCallback((updates: Partial<typeof query>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setQuery(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery(prev => ({
      ...prev,
      dateRange: "all",
      categories: [],
      price: null
    }));
  }, []);

  if (discoverQuery.isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton h={60} />
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={120} />
          <Skeleton h={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (discoverQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => discoverQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const data = discoverQuery.data;
  const allEvents = allEventsQuery.data?.pages.flatMap(page => page.all.data) || [];
  const hasFiltersApplied = query.dateRange !== "all" || query.categories.length > 0 || query.price;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]} // Make SortBar sticky
      >
        {/* Header */}
        <DiscoverHeader
          city={query.city}
          onCityChange={(city) => updateQuery({ city })}
          onSearchPress={() => navigation.navigate("SearchScreen")}
        />

        {/* Filter Chips */}
        <FilterChips
          selectedCategories={query.categories}
          dateRange={query.dateRange}
          isFree={query.price?.max === 0}
          onToggleCategory={toggleCategory}
          onToggleDateRange={(range) => updateQuery({ dateRange: range })}
          onToggleFree={(free) => updateQuery({ 
            price: free ? { max: 0 } : null 
          })}
        />

        {/* Sort Bar - Sticky */}
        <SortBar
          sort={query.sort}
          onSortChange={(sort) => updateQuery({ sort })}
          hasFilters={hasFiltersApplied}
          onClearFilters={clearFilters}
          resultsCount={data?.all.meta.total || 0}
        />

        {/* Sections */}
        {data && (
          <DiscoverSections
            sections={data.sections}
            city={query.city}
            onEventPress={(eventId) => navigation.navigate("EventScreen", { id: eventId })}
            isLoading={discoverQuery.isLoading}
          />
        )}

        {/* All Events List */}
        <AllEventsList
          events={allEvents}
          isLoading={allEventsQuery.isLoading}
          isError={allEventsQuery.isError}
          hasFilters={hasFiltersApplied}
          onEventPress={(eventId) => navigation.navigate("EventScreen", { id: eventId })}
          onRetry={() => allEventsQuery.refetch()}
          onLoadMore={() => {
            if (allEventsQuery.hasNextPage && !allEventsQuery.isFetchingNextPage) {
              allEventsQuery.fetchNextPage();
            }
          }}
          hasNextPage={allEventsQuery.hasNextPage}
          isFetchingNextPage={allEventsQuery.isFetchingNextPage}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Can't find what you want? See all categories
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
    gap: 16,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});