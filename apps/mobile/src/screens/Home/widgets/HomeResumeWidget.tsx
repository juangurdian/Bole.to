import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Card from "../../../components/Card";

interface HomeResumeWidgetProps {
  resume: {
    orderId: string;
    eventId: string;
    eventTitle: string;
    expiresAt: string;
    itemsCount: number;
    total: number;
  };
  navigation: any;
}

export default function HomeResumeWidget({ resume, navigation }: HomeResumeWidgetProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(resume.expiresAt);
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      } else {
        setTimeLeft(`${seconds}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [resume.expiresAt]);

  const isExpired = timeLeft === "Expired";

  return (
    <Card style={[styles.container, isExpired && styles.expiredContainer]}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>🛒</Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.title}>
            {isExpired ? "Order Expired" : "Continue where you left off"}
          </Text>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {resume.eventTitle}
          </Text>
          <Text style={styles.orderDetails}>
            {resume.itemsCount} item{resume.itemsCount !== 1 ? 's' : ''} • ${resume.total}
          </Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timerText,
            isExpired && styles.expiredText
          ]}>
            {timeLeft}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.resumeButton,
          isExpired && styles.resumeButtonDisabled
        ]}
        onPress={() => {
          if (!isExpired) {
            navigation.navigate("Discover", {
              screen: "CheckoutScreen",
              params: { 
                eventId: resume.eventId,
                resumeOrderId: resume.orderId 
              }
            });
          }
        }}
        disabled={isExpired}
      >
        <Text style={[
          styles.resumeButtonText,
          isExpired && styles.resumeButtonTextDisabled
        ]}>
          {isExpired ? "Start New Order" : "Finish Purchase"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9500",
  },
  expiredContainer: {
    borderLeftColor: "#ff3b30",
    opacity: 0.7,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff3cd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  orderDetails: {
    fontSize: 12,
    color: "#999",
  },
  timerContainer: {
    alignItems: "flex-end",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff9500",
  },
  expiredText: {
    color: "#ff3b30",
  },
  resumeButton: {
    backgroundColor: "#ff9500",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resumeButtonDisabled: {
    backgroundColor: "#f0f0f0",
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  resumeButtonTextDisabled: {
    color: "#999",
  },
});