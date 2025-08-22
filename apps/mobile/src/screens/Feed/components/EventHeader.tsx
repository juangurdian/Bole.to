import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const HERO_HEIGHT = (screenWidth * 9) / 16; // 16:9 aspect ratio

interface EventHeaderProps {
  event: any;
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
}

export default function EventHeader({ event, onBack, onShare, onSave }: EventHeaderProps) {
  const insets = useSafeAreaInsets();

  const formatDate = () => {
    const startDate = new Date(event.startsAt);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    };
    return startDate.toLocaleDateString("en-US", options);
  };

  const getMinPrice = () => {
    const availableTiers = event.pricing.tiers.filter(t => !t.soldOut && t.active !== false);
    if (availableTiers.length === 0) return null;
    
    const minPrice = Math.min(...availableTiers.map(t => t.price));
    return minPrice;
  };

  const isWithin24Hours = () => {
    const now = new Date();
    const startDate = new Date(event.startsAt);
    const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  const getTimeUntilStart = () => {
    const now = new Date();
    const startDate = new Date(event.startsAt);
    const diffMs = startDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const minPrice = getMinPrice();
  const timeUntilStart = getTimeUntilStart();
  const showCountdown = isWithin24Hours();

  return (
    <View style={styles.container}>
      {/* Hero Image with Gradient Overlay */}
      <View style={[styles.heroContainer, { height: HERO_HEIGHT }]}>
        <View style={styles.heroImagePlaceholder}>
          <Text style={styles.heroImageIcon}>🎵</Text>
        </View>
        
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
        
        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.navButton} onPress={onBack}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.navButton} onPress={onShare}>
              <Text style={styles.navButtonText}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onSave}>
              <Text style={styles.navButtonText}>
                {event.you?.following ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Bottom Overlays */}
        <View style={styles.bottomOverlays}>
          {/* Date Chip */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>{formatDate()}</Text>
          </View>
          
          {/* City Chip */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>{event.venue.city}</Text>
          </View>
          
          {/* Price/Status Chip */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {event.pricing.saleStatus === "SOLD_OUT" 
                ? "Sold out"
                : event.pricing.saleStatus === "NOT_STARTED"
                ? "Soon"
                : minPrice 
                ? `From $${minPrice}`
                : "Free"
              }
            </Text>
          </View>
          
          {/* Countdown Pill (if within 24h) */}
          {showCountdown && timeUntilStart && (
            <View style={styles.countdownPill}>
              <Text style={styles.countdownText}>Starts in {timeUntilStart}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  heroContainer: {
    position: "relative",
    width: "100%",
  },
  heroImagePlaceholder: {
    flex: 1,
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImageIcon: {
    fontSize: 48,
    color: "white",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  navActions: {
    flexDirection: "row",
    gap: 8,
  },
  bottomOverlays: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  countdownPill: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});