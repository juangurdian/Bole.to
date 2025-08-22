import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView 
} from "react-native";

interface BasicsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export default function BasicsStep({ data, onUpdate }: BasicsStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={data?.title || ""}
            onChangeText={(value) => handleChange("title", value)}
            placeholder="Enter your event title"
            maxLength={80}
          />
          <Text style={styles.helpText}>
            {(data?.title || "").length}/80 characters
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={data?.category || ""}
            onChangeText={(value) => handleChange("category", value)}
            placeholder="e.g., Music, Sports, Party"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Organizer Name</Text>
          <TextInput
            style={styles.input}
            value={data?.organizerName || ""}
            onChangeText={(value) => handleChange("organizerName", value)}
            placeholder="Your name or organization"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={data?.description || ""}
            onChangeText={(value) => handleChange("description", value)}
            placeholder="Tell people what your event is about..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>
            Minimum 30 characters ({(data?.description || "").length}/30)
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Age Restriction</Text>
          <TextInput
            style={styles.input}
            value={data?.ageRestriction || ""}
            onChangeText={(value) => handleChange("ageRestriction", value)}
            placeholder="All ages, 18+, 21+"
          />
        </View>
      </View>

      <View style={styles.validationContainer}>
        <Text style={styles.validationTitle}>Requirements</Text>
        <Text style={[styles.validationItem, (data?.title?.length >= 3) && styles.validationSuccess]}>
          ✓ Title at least 3 characters
        </Text>
        <Text style={[styles.validationItem, data?.category && styles.validationSuccess]}>
          ✓ Category selected
        </Text>
        <Text style={[styles.validationItem, (data?.description?.length >= 30) && styles.validationSuccess]}>
          ✓ Description at least 30 characters
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 100,
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  validationContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  validationItem: {
    fontSize: 14,
    color: "#dc3545",
    marginBottom: 4,
  },
  validationSuccess: {
    color: "#28a745",
  },
});