import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Card from "../../components/Card";
import Button from "../../components/Button";

// Widget Components
import HomeTopBar from "./widgets/HomeTopBar";
import HomeHeroModule from "./widgets/HomeHeroModule";
import HomeQuickActions from "./widgets/HomeQuickActions";
import HomeUpcomingWidget from "./widgets/HomeUpcomingWidget";
import HomeSocialDigestWidget from "./widgets/HomeSocialDigestWidget";
import HomeDiscoverWidget from "./widgets/HomeDiscoverWidget";
import HomeGalleryTeaserWidget from "./widgets/HomeGalleryTeaserWidget";
import HomeResumeWidget from "./widgets/HomeResumeWidget";

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const api = useApi();
  
  const homeQuery = useQuery({ 
    queryKey: ["home-payload"], 
    queryFn: api.getHomePayload,
    refetchOnMount: true
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await homeQuery.refetch();
    setRefreshing(false);
  };

  if (homeQuery.isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={60} />
          <Skeleton h={200} />
          <Skeleton h={120} />
          <Skeleton h={150} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (homeQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => homeQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const data = homeQuery.data;
  if (!data) return null;

  const hasUpcomingWithin7Days = data.upcoming.some((event: any) => 
    new Date(event.startsAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <HomeTopBar 
          city={data.user.city}
          unreadCount={data.unreadNotifications}
          onSearchPress={() => navigation.navigate("Discover", { screen: "SearchScreen" })}
          onNotificationsPress={() => navigation.navigate("Profile", { screen: "NotificationsScreen" })}
          onProfilePress={() => navigation.navigate("Profile")}
        />

        {/* Hero Module - contextual */}
        <HomeHeroModule 
          hasUpcomingWithin7Days={hasUpcomingWithin7Days}
          nextEvent={data.upcoming[0]}
          city={data.user.city}
          navigation={navigation}
        />

        {/* Quick Actions Row */}
        <HomeQuickActions 
          userRoles={data.user.roles}
          navigation={navigation}
        />

        {/* Resume/Continue Checkout - show early if exists */}
        {data.resume && (
          <HomeResumeWidget 
            resume={data.resume}
            navigation={navigation}
          />
        )}

        {/* Your Upcoming - priority if has events within 7 days */}
        {hasUpcomingWithin7Days && data.upcoming.length > 0 && (
          <HomeUpcomingWidget 
            upcoming={data.upcoming}
            navigation={navigation}
          />
        )}

        {/* Social Updates */}
        {data.socialDigest.length > 0 && (
          <HomeSocialDigestWidget 
            socialDigest={data.socialDigest}
            navigation={navigation}
          />
        )}

        {/* Gallery Teasers - pin if reveal today */}
        {data.galleries.length > 0 && (
          <HomeGalleryTeaserWidget 
            galleries={data.galleries}
            navigation={navigation}
          />
        )}

        {/* Discover Near You */}
        <HomeDiscoverWidget 
          discover={data.discover}
          city={data.user.city}
          navigation={navigation}
        />

        {/* Your Upcoming - lower priority if no events within 7 days */}
        {!hasUpcomingWithin7Days && data.upcoming.length > 0 && (
          <HomeUpcomingWidget 
            upcoming={data.upcoming}
            navigation={navigation}
          />
        )}

        {/* Promoter Tools - role gated */}
        {data.promoterStats && (
          <Card style={styles.promoterCard}>
            <View style={styles.promoterHeader}>
              <Text style={styles.sectionTitle}>📊 Promoter Dashboard</Text>
            </View>
            <View style={styles.promoterStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{data.promoterStats.linkShares}</Text>
                <Text style={styles.statLabel}>Link Shares</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{data.promoterStats.conversions}</Text>
                <Text style={styles.statLabel}>Conversions</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>${data.promoterStats.revenue}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </View>
            <Button 
              title="Share Your Link" 
              onPress={() => {}} 
              style={styles.shareButton}
            />
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  promoterCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  promoterHeader: {
    marginBottom: 16,
  },
  promoterStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  shareButton: {
    backgroundColor: "#007AFF",
  },
  bottomSpacer: {
    height: 32,
  },
});