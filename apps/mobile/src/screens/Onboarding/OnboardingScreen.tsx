import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    icon: "calendar",
    title: "Discover Events",
    description: "Find amazing events happening around you and across the globe",
  },
  {
    id: 2,
    icon: "users",
    title: "Connect with Friends",
    description: "Share experiences and create memories with your community",
  },
  {
    id: 3,
    icon: "camera",
    title: "Capture Moments",
    description: "Take photos, share updates, and relive your favorite events",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate("InterestsScreen");
    }
  };

  const handleSkip = () => {
    navigation.navigate("InterestsScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentOffset={{ x: currentSlide * width, y: 0 }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.iconContainer}>
              <Feather name={slide.icon as any} size={80} color="#000" />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Feather name="arrow-right" size={20} color="#fff" />
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
    alignItems: "flex-end",
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 48,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#000",
    width: 24,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});