import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";

export type TicketsTab = "tickets" | "events";

interface TicketSegmentedProps {
  selectedTab: TicketsTab;
  onTabChange: (tab: TicketsTab) => void;
}

export default function TicketSegmented({ selectedTab, onTabChange }: TicketSegmentedProps) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            selectedTab === "tickets" && styles.activeSegment
          ]}
          onPress={() => onTabChange("tickets")}
          activeOpacity={0.8}
        >
          {selectedTab === "tickets" ? (
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.segmentText, styles.activeSegmentText]}>
                My Tickets
              </Text>
            </LinearGradient>
          ) : (
            <Text style={styles.segmentText}>
              My Tickets
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segment,
            selectedTab === "events" && styles.activeSegment
          ]}
          onPress={() => onTabChange("events")}
          activeOpacity={0.8}
        >
          {selectedTab === "events" ? (
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.segmentText, styles.activeSegmentText]}>
                My Events
              </Text>
            </LinearGradient>
          ) : (
            <Text style={styles.segmentText}>
              My Events
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: theme.spacing.xs,
    height: 48,
  },
  segment: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  activeSegment: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  activeGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  segmentText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
  },
  activeSegmentText: {
    color: theme.colors.text.primary,
  },
});