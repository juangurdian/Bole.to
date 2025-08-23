import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import { theme } from "../../theme";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";

// Discover Components
import DiscoverHeader from "./components/DiscoverHeader";
import StickyFilterBar from "./components/StickyFilterBar";
import DiscoverSections from "./components/DiscoverSections";
import AllEventsList from "./components/AllEventsList";

export default function DiscoverScreen({ navigation }: any) {
  const { user } = useAuth();
  const api = useApi();
  const insets = useSafeAreaInsets();
  
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} translucent />
        <LinearGradient
          colors={["rgba(124,92,255,0.25)", "rgba(0,224,255,0.15)", "transparent"]}
          style={styles.atmosphereGradient}
        />
        <View style={[styles.headerContainer, { top: insets.top }]}>
          <DiscoverHeader
            city={query.city}
            onCityChange={(city) => updateQuery({ city })}
            onSearchPress={() => navigation.navigate("SearchScreen")}
          />
        </View>
        <View style={[styles.stickyFilterContainer, { top: insets.top + 56 }]}>
          <StickyFilterBar
            selectedCategories={query.categories}
            dateRange={query.dateRange}
            isFree={query.price?.max === 0}
            sort={query.sort}
            hasFilters={hasFiltersApplied}
            resultsCount={0}
            onToggleCategory={toggleCategory}
            onToggleDateRange={(range) => updateQuery({ dateRange: range })}
            onToggleFree={(free) => updateQuery({ 
              price: free ? { max: 0 } : null 
            })}
            onSortChange={(sort) => updateQuery({ sort })}
            onClearFilters={clearFilters}
          />
        </View>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 56 + 64 + 12 }]}>
          <Skeleton h={60} />
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={120} />
          <Skeleton h={200} />
        </View>
      </View>
    );
  }

  if (discoverQuery.isError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} translucent />
        <LinearGradient
          colors={["rgba(124,92,255,0.25)", "rgba(0,224,255,0.15)", "transparent"]}
          style={styles.atmosphereGradient}
        />
        <View style={[styles.headerContainer, { top: insets.top }]}>
          <DiscoverHeader
            city={query.city}
            onCityChange={(city) => updateQuery({ city })}
            onSearchPress={() => navigation.navigate("SearchScreen")}
          />
        </View>
        <View style={[styles.stickyFilterContainer, { top: insets.top + 56 }]}>
          <StickyFilterBar
            selectedCategories={query.categories}
            dateRange={query.dateRange}
            isFree={query.price?.max === 0}
            sort={query.sort}
            hasFilters={hasFiltersApplied}
            resultsCount={0}
            onToggleCategory={toggleCategory}
            onToggleDateRange={(range) => updateQuery({ dateRange: range })}
            onToggleFree={(free) => updateQuery({ 
              price: free ? { max: 0 } : null 
            })}
            onSortChange={(sort) => updateQuery({ sort })}
            onClearFilters={clearFilters}
          />
        </View>
        <View style={{ paddingTop: insets.top + 56 + 64 + 12 }}>
          <ErrorState onRetry={() => discoverQuery.refetch()} />
        </View>
      </View>
    );
  }

  const data = discoverQuery.data;
  const allEvents = allEventsQuery.data?.pages.flatMap(page => page.all.data) || [];
  const hasFiltersApplied = query.dateRange !== "all" || query.categories.length > 0 || query.price;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} translucent />
      
      {/* Atmosphere Gradient */}
      <LinearGradient
        colors={["rgba(124,92,255,0.25)", "rgba(0,224,255,0.15)", "transparent"]}
        style={styles.atmosphereGradient}
      />
      
      {/* Header - Absolutely Positioned */}
      <View style={[styles.headerContainer, { top: insets.top }]}>
        <DiscoverHeader
          city={query.city}
          onCityChange={(city) => updateQuery({ city })}
          onSearchPress={() => navigation.navigate("SearchScreen")}
        />
      </View>
      
      {/* Sticky Filter Bar */}
      <View style={[styles.stickyFilterContainer, { top: insets.top + 56 }]}>
        <StickyFilterBar
          selectedCategories={query.categories}
          dateRange={query.dateRange}
          isFree={query.price?.max === 0}
          sort={query.sort}
          hasFilters={hasFiltersApplied}
          resultsCount={data?.all.meta.total || 0}
          onToggleCategory={toggleCategory}
          onToggleDateRange={(range) => updateQuery({ dateRange: range })}
          onToggleFree={(free) => updateQuery({ 
            price: free ? { max: 0 } : null 
          })}
          onSortChange={(sort) => updateQuery({ sort })}
          onClearFilters={clearFilters}
        />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { 
          paddingTop: insets.top + 56 + 64 + 12, // top inset + header height + filter bar height + spacing
          paddingBottom: insets.bottom + 90 + 24 // bottom inset + tab bar height + spacing
        }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.text.primary}
            titleColor={theme.colors.text.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  atmosphereGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 0,
  },
  headerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  stickyFilterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: "rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Dynamic padding is applied inline
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  footer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
});