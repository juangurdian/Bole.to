import React from 'react';
import { View, Text, ImageBackground, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AmbientGlow from './AmbientGlow';
import { colors, spacing, radii, shadow, typography } from '../theme/v2-neutral';

interface EventSquareCardV3Props {
  event: {
    id: string;
    name: string;
    date: string;
    time: string;
    venue: string;
    imageUrl?: string;
    price?: {
      min: number;
      max: number;
    };
    attendeeCount?: number;
    status?: "upcoming" | "live" | "ended";
  };
  onPress: (eventId: string) => void;
}

/**
 * EventSquareCardV3 - Modern photo-first upcoming events card
 * Designed for the "Your Upcoming" section with full-image backgrounds
 * Integrates with v2-neutral design system and subtle ambient glows
 */
export default function EventSquareCardV3({ event, onPress }: EventSquareCardV3Props) {
  // Format date display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date TBD";
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        });
      }
    } catch (error) {
      return "Date TBD";
    }
  };

  // Format time display
  const formatTime = (timeString: string) => {
    if (!timeString) return "Time TBD";
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) return "Time TBD";
      
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Time TBD";
    }
  };

  // Get status color for live/upcoming indicators
  const getStatusColor = () => {
    switch (event.status) {
      case "live":
        return colors.error;
      case "ended":
        return colors.text.tertiary;
      default:
        return colors.accent;
    }
  };

  // Get status display text
  const getStatusText = () => {
    switch (event.status) {
      case "live":
        return "LIVE NOW";
      case "ended":
        return "ENDED";
      default:
        return formatDate(event.date);
    }
  };

  // Parse venue to get location name
  const getVenueName = () => {
    return event.venue?.split(' • ')[0] || 'Venue TBD';
  };

  return (
    <View style={styles.container}>
      {/* Subtle ambient glow behind card */}
      <AmbientGlow color={colors.accent} opacity={0.12} />
      
      <Pressable
        onPress={() => onPress(event.id)}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
      >
        {/* Full image background */}
        <ImageBackground
          source={{ 
            uri: event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=400&fit=crop&crop=center'
          }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Enhanced gradient overlay for optimal text readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
            style={styles.gradientOverlay}
            locations={[0, 0.6, 1]}
          />

          {/* Status badge - top left */}
          {event.status === 'live' && (
            <View style={styles.statusBadge}>
              <View style={[styles.liveDot, { backgroundColor: getStatusColor() }]} />
              <Text style={styles.statusText}>LIVE</Text>
            </View>
          )}

          {/* Event info - bottom overlay */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventName} numberOfLines={2}>
              {event.name}
            </Text>
            
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={12} color={colors.text.tertiary} />
              <Text style={styles.venueText} numberOfLines={1}>
                {getVenueName()}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Feather name="calendar" size={12} color={colors.text.tertiary} />
              <Text style={styles.dateTimeText}>
                {formatDate(event.date)} • {formatTime(event.time)}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const cardSize = 168;

const styles = StyleSheet.create({
  container: {
    width: cardSize,
    height: cardSize,
    marginRight: spacing(3),
  },
  card: {
    width: cardSize,
    height: cardSize,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.ios,
    ...shadow.android,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing(2),
    left: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: typography.weights.extrabold,
    letterSpacing: 0.5,
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing(3),
  },
  eventName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.extrabold,
    lineHeight: typography.lineHeights.tight * typography.sizes.md,
    marginBottom: spacing(2),
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(0.5),
  },
  venueText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing(1),
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dateTimeText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing(1),
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});