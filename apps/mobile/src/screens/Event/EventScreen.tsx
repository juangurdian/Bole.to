import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useApi } from "../../api";
import { theme } from "../../theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const HERO_HEIGHT = screenHeight * 0.45;

export default function EventScreen({ route, navigation }: any) {
  const { id } = route.params;
  const api = useApi();
  const scrollY = useSharedValue(0);
  const [selectedTiers, setSelectedTiers] = useState<{[key: string]: number}>({});
  const [totalAmount, setTotalAmount] = useState(0);
  
  const q = useQuery({ 
    queryKey: ["event", id], 
    queryFn: () => api.getEvent(id) 
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT - 100],
      [0, 1],
      "clamp"
    );
    return { opacity };
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0, HERO_HEIGHT],
      [1.5, 1, 0.8],
      "clamp"
    );
    return {
      transform: [{ scale }],
    };
  });

  if (q.isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.loadingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="loader" size={32} color={theme.colors.white} />
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (q.isError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load event</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => q.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const event = q.data!;
  const tiers = event.tiers || [];

  const updateQuantity = (tierId: string, change: number) => {
    setSelectedTiers(prev => {
      const newQuantity = Math.max(0, (prev[tierId] || 0) + change);
      const newTiers = { ...prev, [tierId]: newQuantity };
      
      // Calculate total
      const total = Object.entries(newTiers).reduce((sum, [tid, qty]) => {
        const tier = tiers.find(t => t.id === tid);
        return sum + (tier ? tier.price.amount * qty : 0);
      }, 0);
      setTotalAmount(total);
      
      return newTiers;
    });
  };

  const proceedToCheckout = () => {
    const items = Object.entries(selectedTiers)
      .filter(([_, qty]) => qty > 0)
      .map(([tierId, qty]) => ({ tierId, qty }));
    
    if (items.length === 0) {
      return;
    }
    
    navigation.navigate("CheckoutScreen", { eventId: id, items });
  };

  const hasSelection = Object.values(selectedTiers).some(qty => qty > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header - Shows on scroll */}
      <Animated.View style={[styles.fixedHeader, headerAnimatedStyle]}>
        <BlurView intensity={90} tint="dark" style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
            <TouchableOpacity>
              <Feather name="share-2" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
          <Image
            source={{ uri: event.coverUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800" }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,13,20,0.7)", theme.colors.bg]}
            style={styles.heroGradient}
          />
          
          {/* Floating Back Button */}
          <TouchableOpacity 
            style={styles.floatingBackButton}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={80} tint="dark" style={styles.backButtonBlur}>
              <Feather name="arrow-left" size={24} color={theme.colors.white} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.content}>
          {/* Event Info Card */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={["rgba(17,22,35,0.95)", "rgba(21,27,44,0.95)"]}
              style={styles.cardGradient}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              
              <View style={styles.eventMeta}>
                <View style={styles.metaRow}>
                  <View style={styles.metaIcon}>
                    <Feather name="calendar" size={16} color={theme.colors.gradient.primary[0]} />
                  </View>
                  <Text style={styles.metaText}>
                    {new Date(event.startsAt).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                
                <View style={styles.metaRow}>
                  <View style={styles.metaIcon}>
                    <Feather name="clock" size={16} color={theme.colors.gradient.primary[0]} />
                  </View>
                  <Text style={styles.metaText}>
                    {new Date(event.startsAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.venueRow}>
                <Feather name="map-pin" size={18} color={theme.colors.gradient.accent[0]} />
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{event.venue.name}</Text>
                  <Text style={styles.venueAddress}>{event.venue.city}</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={theme.colors.gradient.dark}
                    style={styles.actionGradient}
                  >
                    <Feather name="heart" size={20} color={theme.colors.text.secondary} />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={theme.colors.gradient.dark}
                    style={styles.actionGradient}
                  >
                    <Feather name="bell" size={20} color={theme.colors.text.secondary} />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={theme.colors.gradient.dark}
                    style={styles.actionGradient}
                  >
                    <Feather name="users" size={20} color={theme.colors.text.secondary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Description Card */}
          {event.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Tickets Section */}
          {tiers.length > 0 && (
            <View style={styles.ticketsSection}>
              <Text style={styles.sectionTitle}>Select Tickets</Text>
              
              {tiers.map((tier, index) => (
                <View key={tier.id} style={styles.ticketCard}>
                  <LinearGradient
                    colors={
                      selectedTiers[tier.id] 
                        ? ["rgba(124,92,255,0.1)", "rgba(0,224,255,0.1)"]
                        : ["rgba(17,22,35,0.95)", "rgba(21,27,44,0.95)"]
                    }
                    style={styles.ticketGradient}
                  >
                    <View style={styles.ticketHeader}>
                      <View>
                        <Text style={styles.ticketName}>{tier.name}</Text>
                        <View style={styles.ticketPrice}>
                          <Text style={styles.priceSymbol}>$</Text>
                          <Text style={styles.priceAmount}>{tier.price.amount}</Text>
                          <Text style={styles.priceCurrency}>{tier.price.currency}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.availabilityBadge}>
                        <Text style={styles.availabilityText}>
                          {tier.remaining} left
                        </Text>
                      </View>
                    </View>

                    {tier.description && (
                      <Text style={styles.ticketDescription}>{tier.description}</Text>
                    )}

                    <View style={styles.quantitySection}>
                      <TouchableOpacity
                        style={[styles.quantityButton, (!selectedTiers[tier.id] || selectedTiers[tier.id] === 0) && styles.quantityButtonDisabled]}
                        onPress={() => updateQuantity(tier.id, -1)}
                        disabled={!selectedTiers[tier.id] || selectedTiers[tier.id] === 0}
                      >
                        <Feather name="minus" size={20} color={theme.colors.white} />
                      </TouchableOpacity>
                      
                      <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>{selectedTiers[tier.id] || 0}</Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.quantityButton, styles.quantityButtonAdd]}
                        onPress={() => updateQuantity(tier.id, 1)}
                      >
                        <LinearGradient
                          colors={theme.colors.gradient.primary}
                          style={styles.quantityButtonGradient}
                        >
                          <Feather name="plus" size={20} color={theme.colors.white} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}

          {/* Bottom Spacing for FAB */}
          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Floating Checkout Button */}
      {hasSelection && (
        <View style={styles.floatingCheckout}>
          <BlurView intensity={90} tint="dark" style={styles.checkoutBlur}>
            <View style={styles.checkoutContent}>
              <View>
                <Text style={styles.checkoutLabel}>Total</Text>
                <Text style={styles.checkoutAmount}>${totalAmount.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity onPress={proceedToCheckout}>
                <LinearGradient
                  colors={theme.colors.gradient.primary}
                  style={styles.checkoutButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.checkoutButtonText}>Continue</Text>
                  <Feather name="arrow-right" size={20} color={theme.colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  retryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    flex: 1,
    marginHorizontal: theme.spacing.lg,
    textAlign: "center",
  },
  heroSection: {
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.6,
  },
  floatingBackButton: {
    position: "absolute",
    top: 50,
    left: theme.spacing.lg,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    marginTop: -80,
    paddingHorizontal: theme.spacing.lg,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  cardGradient: {
    padding: theme.spacing.xl,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  eventMeta: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,224,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.secondary,
  },
  venueInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  venueName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  quickActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    height: 44,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  descriptionCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  ticketsSection: {
    marginBottom: theme.spacing.xl,
  },
  ticketCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  ticketGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.lg,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  ticketName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  ticketPrice: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceSymbol: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.gradient.primary[0],
    marginRight: 2,
  },
  priceAmount: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.gradient.primary[0],
  },
  priceCurrency: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  availabilityBadge: {
    backgroundColor: "rgba(0,224,255,0.1)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,224,255,0.2)",
  },
  availabilityText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.gradient.accent[0],
    fontWeight: theme.typography.weights.medium,
  },
  ticketDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityButtonAdd: {
    overflow: "hidden",
  },
  quantityButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: "center",
  },
  quantityText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  floatingCheckout: {
    position: "absolute",
    bottom: 20,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  checkoutBlur: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  checkoutContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  checkoutLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  checkoutAmount: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    gap: theme.spacing.sm,
  },
  checkoutButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});