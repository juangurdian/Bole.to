import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors as v2Colors, spacing, radii } from "../../../theme/v2-neutral";

interface EventDescriptionProps {
  description: string;
  collapsedLines?: number;
}

export default function EventDescription({ description, collapsedLines = 4 }: EventDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple line estimation - in a real app you'd measure text properly
  const lines = description.split('\n');
  const needsExpansion = lines.length > collapsedLines;
  
  const displayText = isExpanded || !needsExpansion 
    ? description 
    : lines.slice(0, collapsedLines).join('\n');

  const renderText = () => {
    // Split by paragraphs and render with proper spacing
    const paragraphs = displayText.split('\n\n');
    
    return paragraphs.map((paragraph, index) => (
      <Text key={index} style={styles.paragraph}>
        {paragraph.trim()}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>About</Text>
      
      <View style={styles.content}>
        {renderText()}
        
        {!isExpanded && needsExpansion && (
          <LinearGradient
            colors={['transparent', v2Colors.surface1]}
            style={styles.fadeOverlay}
          />
        )}
      </View>
      
      {needsExpansion && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? "Show less" : "Read more"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: v2Colors.surface1,
    marginBottom: spacing(2),
    marginHorizontal: spacing(4),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: v2Colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: v2Colors.text.primary,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(5),
    paddingBottom: spacing(3),
  },
  content: {
    position: "relative",
    paddingHorizontal: spacing(4),
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: v2Colors.text.primary,
    marginBottom: spacing(3),
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: spacing(4),
    right: spacing(4),
    height: 40,
  },
  expandButton: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: v2Colors.accent,
  },
});