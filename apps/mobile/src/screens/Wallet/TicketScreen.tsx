import React from "react";
import { View, Text, ScrollView, StyleSheet, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function TicketScreen({ route }: any) {
  const { id } = route.params;
  const api = useApi();
  
  const q = useQuery({ 
    queryKey: ["ticket", id], 
    queryFn: () => api.getTicket(id) 
  });

  if (q.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={200} />
          <Skeleton h={300} />
          <Skeleton h={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (q.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => q.refetch()} />
      </SafeAreaView>
    );
  }

  const ticket = q.data!;
  const isValid = ticket.status === "valid";
  const isUsed = ticket.status === "used";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ticket for ${ticket.event.title}!`,
        title: ticket.event.title,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <View style={styles.ticketHeader}>
            <Text style={styles.eventTitle}>{ticket.event.title}</Text>
            <View style={[
              styles.statusBadge,
              isValid && styles.statusValid,
              isUsed && styles.statusUsed,
              !isValid && !isUsed && styles.statusInvalid
            ]}>
              <Text style={[
                styles.statusText,
                isValid && styles.statusTextValid
              ]}>
                {isValid ? "VALID" : isUsed ? "USED" : "INVALID"}
              </Text>
            </View>
          </View>
          
          <Text style={styles.venue}>
            {ticket.event.venue.name}
          </Text>
          <Text style={styles.city}>{ticket.event.venue.city}</Text>
          
          <Text style={styles.date}>
            {new Date(ticket.event.startsAt).toLocaleDateString()} at{" "}
            {new Date(ticket.event.startsAt).toLocaleTimeString()}
          </Text>
        </Card>

        <Card>
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Ticket QR Code</Text>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrEmoji}>📱</Text>
              <Text style={styles.qrText}>QR Code for</Text>
              <Text style={styles.qrId}>#{ticket.id}</Text>
              <Text style={styles.qrNote}>
                {isValid ? "Show this QR code at the venue" : "This ticket cannot be used"}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.detailsTitle}>Ticket Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket Type:</Text>
            <Text style={styles.detailValue}>{ticket.tier.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>
              ${ticket.tier.price.amount} {ticket.tier.price.currency}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>#{ticket.orderId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket ID:</Text>
            <Text style={styles.detailValue}>#{ticket.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(ticket.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Share Ticket"
            onPress={handleShare}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  statusValid: {
    backgroundColor: "#d4edda",
  },
  statusUsed: {
    backgroundColor: "#fff3cd",
  },
  statusInvalid: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
  },
  statusTextValid: {
    color: "#155724",
  },
  venue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  city: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  qrSection: {
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#dee2e6",
    borderStyle: "dashed",
  },
  qrEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  qrText: {
    fontSize: 14,
    color: "#666",
  },
  qrId: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#999",
    marginTop: 4,
  },
  qrNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  actions: {
    padding: 16,
  },
});