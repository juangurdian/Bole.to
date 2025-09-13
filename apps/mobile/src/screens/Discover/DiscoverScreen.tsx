import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import { theme } from "../../theme";
import { colors as v2Colors } from "../../theme/v2-neutral";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import NewHomeTopBarNeutral from "../../components/NewHomeTopBarNeutral";

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

  const handleOpenNotifications = () => {
    navigation.navigate("Notifications");
  };

  if (discoverQuery.isLoading && !refreshing) {
    return (
      <LinearGradient
        colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <NewHomeTopBarNeutral
            style={{
              marginBottom: 4,
            }}
            city={query.city}
            onSearch={() => navigation.navigate("SearchScreen")}
            onNotifications={handleOpenNotifications}
          />
          <View style={styles.filterWrapper}>
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
          <View style={styles.loadingContainer}>
            <Skeleton h={60} />
            <Skeleton h={40} />
            <Skeleton h={40} />
            <Skeleton h={120} />
            <Skeleton h={200} />
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (discoverQuery.isError) {
    return (
      <LinearGradient
        colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <NewHomeTopBarNeutral
            style={{
              marginBottom: 4,
            }}
            city={query.city}
            onSearch={() => navigation.navigate("SearchScreen")}
            onNotifications={handleOpenNotifications}
          />
          <View style={styles.filterWrapper}>
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
          <ErrorState onRetry={() => discoverQuery.refetch()} />
        </ScrollView>
      </LinearGradient>
    );
  }

  const data = discoverQuery.data;
  const allEvents = allEventsQuery.data?.pages.flatMap(page => page.all.data) || [];
  const hasFiltersApplied = query.dateRange !== "all" || query.categories.length > 0 || query.price;

  return (
    <LinearGradient
      colors={[v2Colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={v2Colors.bg} translucent />
      
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 90 + 24, // bottom inset + tab bar height + spacing
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={v2Colors.text.primary}
            titleColor={v2Colors.text.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* New Home Top Bar - matches home page design */}
        <NewHomeTopBarNeutral
          style={{
            marginBottom: 4,
          }}
          city={query.city}
          onSearch={() => navigation.navigate("SearchScreen")}
          onNotifications={handleOpenNotifications}
        />
        
        {/* Filter Bar - moved right below search bar */}
        <View style={styles.filterWrapper}>
          <StickyFilterBar
            selectedCategories={query.categories}
            dateRange={query.dateRange}
            isFree={query.price?.max === 0}
            sort={query.sort}
            hasFilters={hasFiltersApplied}
            resultsCount={data?.all?.meta?.total || 0}
            onToggleCategory={toggleCategory}
            onToggleDateRange={(range) => updateQuery({ dateRange: range })}
            onToggleFree={(free) => updateQuery({ 
              price: free ? { max: 0 } : null 
            })}
            onSortChange={(sort) => updateQuery({ sort })}
            onClearFilters={clearFilters}
          />
        </View>
        
        {/* Results Count - moved below filters */}
        {(data?.all?.meta?.total || 0) > 0 && (
          <View style={styles.resultsCountContainer}>
            <Text style={styles.resultsCountText}>
              {data?.all?.meta?.total || 0} event{(data?.all?.meta?.total || 0) !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  filterWrapper: {
    backgroundColor: "rgba(0,0,0,0.1)",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  resultsCountContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    alignItems: "flex-start",
  },
  resultsCountText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
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