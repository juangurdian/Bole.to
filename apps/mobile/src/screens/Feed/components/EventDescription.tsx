import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";

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
          <View style={styles.fadeOverlay} />
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
    backgroundColor: "white",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  content: {
    position: "relative",
    paddingHorizontal: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backgroundImage: "linear-gradient(transparent, white)",
  },
  expandButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  expandButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
});