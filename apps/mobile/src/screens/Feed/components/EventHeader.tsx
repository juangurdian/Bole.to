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
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

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
        <LinearGradient
          colors={[v2Colors.accent, v2Colors.accent2]}
          style={styles.heroImagePlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="music" size={64} color={v2Colors.bg} />
        </LinearGradient>
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />
        
        {/* Top Navigation Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.navButton} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={v2Colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.navButton} onPress={onShare}>
              <Feather name="share" size={18} color={v2Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={onSave}>
              <Feather 
                name={event.you?.following ? "heart" : "heart"} 
                size={18} 
                color={event.you?.following ? v2Colors.accent : v2Colors.text.primary}
                fill={event.you?.following ? v2Colors.accent : 'none'}
              />
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
    justifyContent: "center",
    alignItems: "center",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(2),
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${v2Colors.bg}80`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.border}60`,
  },
  navActions: {
    flexDirection: "row",
    gap: spacing(2),
  },
  bottomOverlays: {
    position: "absolute",
    bottom: spacing(4),
    left: spacing(4),
    right: spacing(4),
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
  },
  chip: {
    backgroundColor: `${v2Colors.bg}90`,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${v2Colors.border}40`,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: v2Colors.text.primary,
  },
  countdownPill: {
    backgroundColor: v2Colors.accent,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: radii.xl,
    marginTop: spacing(1),
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: v2Colors.bg,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});