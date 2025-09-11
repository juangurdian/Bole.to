import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AmbientGlow from './AmbientGlow';
import { colors, spacing, radii, shadow, typography } from '../theme/v2-neutral';

interface EventWideCardV3Props {
  event: {
    id: string;
    title: string;
    startsAt: string;
    venue: {
      name: string;
      city: string;
    };
    coverUrl?: string;
    tiers?: Array<{
      price: {
        amount: number;
      };
    }>;
  };
  onPress: (eventId: string) => void;
}

/**
 * EventWideCardV3 - Horizontal layout with left info, right product-style image
 * Designed for "Events Near You" section with modern organized text layout
 */
export default function EventWideCardV3({ event, onPress }: EventWideCardV3Props) {
  // Format date display
  const formatDate = (dateString: string) => {
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
          weekday: "short",
          month: "short", 
          day: "numeric" 
        });
      }
    } catch (error) {
      return "Date TBD";
    }
  };

  // Format time display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "";
    }
  };


  return (
    <View style={styles.container}>
      {/* Subtle ambient glow - indigo for "nearby" events */}
      <AmbientGlow color={colors.accent2} opacity={0.10} />
      
      <Pressable
        onPress={() => onPress(event.id)}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
      >
        {/* Left side - Event information */}
        <View style={styles.leftContent}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={14} color={colors.accent2} />
                <Text style={styles.metaText}>
                  {formatDate(event.startsAt)}
                  {formatTime(event.startsAt) && ` • ${formatTime(event.startsAt)}`}
                </Text>
              </View>
              
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={14} color={colors.accent2} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.venue.name} • {event.venue.city}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right side - Full border image */}
        <View style={styles.rightContent}>
          <Image
            source={{ 
              uri: event.coverUrl || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop&crop=center'
            }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 140,
    marginRight: spacing(4),
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accent2,
    padding: spacing(2),
    position: 'relative',
    overflow: 'hidden',
    ...shadow.ios,
    ...shadow.android,
  },
  leftContent: {
    width: 200,
    justifyContent: 'center',
    paddingRight: spacing(3),
    zIndex: 2,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    lineHeight: typography.lineHeights.tight * typography.sizes.lg,
    marginBottom: spacing(2),
  },
  metaContainer: {
    gap: spacing(1.5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  rightContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 120,
    zIndex: 1,
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
  },
});