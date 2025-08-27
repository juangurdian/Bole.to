import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const interests = [
  { id: "1", name: "Music Festivals", icon: "music" },
  { id: "2", name: "Concerts", icon: "mic" },
  { id: "3", name: "Sports", icon: "activity" },
  { id: "4", name: "Art & Culture", icon: "image" },
  { id: "5", name: "Food & Drink", icon: "coffee" },
  { id: "6", name: "Comedy", icon: "smile" },
  { id: "7", name: "Theater", icon: "film" },
  { id: "8", name: "Nightlife", icon: "moon" },
  { id: "9", name: "Business", icon: "briefcase" },
  { id: "10", name: "Tech", icon: "cpu" },
  { id: "11", name: "Wellness", icon: "heart" },
  { id: "12", name: "Gaming", icon: "monitor" },
];

export default function InterestsScreen({ navigation }: any) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    console.log("Selected interests:", selectedInterests);
    navigation.navigate("LocationPermissionScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContinue}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>
          Select at least 3 topics to personalize your experience
        </Text>

        <View style={styles.grid}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestCard,
                selectedInterests.includes(interest.id) && styles.interestCardSelected,
              ]}
              onPress={() => toggleInterest(interest.id)}
            >
              <Feather
                name={interest.icon as any}
                size={32}
                color={selectedInterests.includes(interest.id) ? "#fff" : "#000"}
              />
              <Text
                style={[
                  styles.interestText,
                  selectedInterests.includes(interest.id) && styles.interestTextSelected,
                ]}
              >
                {interest.name}
              </Text>
              {selectedInterests.includes(interest.id) && (
                <View style={styles.checkmark}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedInterests.length < 3 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedInterests.length < 3}
        >
          <Text style={styles.continueButtonText}>
            Continue ({selectedInterests.length} selected)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  interestCard: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  interestCardSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  interestText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  interestTextSelected: {
    color: "#fff",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  continueButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});