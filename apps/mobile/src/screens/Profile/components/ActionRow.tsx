import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface ActionRowProps {
  onSharePress: () => void;
  onSettingsPress: () => void;
}

export default function ActionRow({ onSharePress, onSettingsPress }: ActionRowProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
        <Feather name="share-2" size={18} color={v2Colors.accent} />
        <Text style={styles.actionText}>Share Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
        <Feather name="smartphone" size={18} color={v2Colors.accent} />
        <Text style={styles.actionText}>QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
        <Feather name="settings" size={18} color={v2Colors.accent} />
        <Text style={styles.actionText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: v2Colors.surface1,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    gap: spacing(3),
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v2Colors.surface2,
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
    gap: spacing(2),
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: v2Colors.text.primary,
  },
});