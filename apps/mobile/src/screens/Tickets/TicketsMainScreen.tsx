import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WalletScreen from "../Wallet/WalletScreen";
import MyEventsScreen from "../MyEvents/MyEventsScreen";

const { width } = Dimensions.get("window");

export type TicketsTab = "tickets" | "events";

interface TicketsMainScreenProps {
  navigation: any;
}

export default function TicketsMainScreen({ navigation }: TicketsMainScreenProps) {
  const [selectedTab, setSelectedTab] = useState<TicketsTab>("tickets");

  const renderTabContent = () => {
    if (selectedTab === "tickets") {
      return <WalletScreen navigation={navigation} />;
    } else {
      return <MyEventsScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Segmented Control Header */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segment,
            selectedTab === "tickets" && styles.activeSegment
          ]}
          onPress={() => setSelectedTab("tickets")}
        >
          <Text
            style={[
              styles.segmentText,
              selectedTab === "tickets" && styles.activeSegmentText
            ]}
          >
            My Tickets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segment,
            selectedTab === "events" && styles.activeSegment
          ]}
          onPress={() => setSelectedTab("events")}
        >
          <Text
            style={[
              styles.segmentText,
              selectedTab === "events" && styles.activeSegmentText
            ]}
          >
            My Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: "#007AFF",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeSegmentText: {
    color: "white",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
});