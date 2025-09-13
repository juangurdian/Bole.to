import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../../../theme";
import { colors as v2Colors, radii, spacing } from "../../../theme/v2-neutral";

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
            <View style={styles.activeSegment}>
              <Text style={[styles.segmentText, styles.activeSegmentText]}>
                My Tickets
              </Text>
            </View>
          ) : (
            <Text style={styles.segmentText}>
              My Tickets
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment]}
          onPress={() => onTabChange("events")}
          activeOpacity={0.8}
        >
          {selectedTab === "events" ? (
            <View style={styles.activeSegment}>
              <Text style={[styles.segmentText, styles.activeSegmentText]}>
                My Events
              </Text>
            </View>
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
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: v2Colors.surface1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    padding: spacing(1),
    height: 44,
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.md,
    marginHorizontal: spacing(0.5),
  },
  activeSegment: {
    backgroundColor: v2Colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing(3),
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: v2Colors.text.secondary,
  },
  activeSegmentText: {
    color: v2Colors.text.primary,
  },
});