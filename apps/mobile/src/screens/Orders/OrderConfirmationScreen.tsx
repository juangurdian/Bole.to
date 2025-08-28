import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function OrderConfirmationScreen({ route, navigation }: any) {
  const { orderId, orderShortId, eventId } = route.params;
  const api = useApi();
  
  const orderQuery = useQuery({ 
    queryKey: ["order", orderId], 
    queryFn: () => api.getOrder(orderId) 
  });

  // Query payment intent status to show payment confirmation
  const paymentIntentQuery = useQuery({ 
    queryKey: ["paymentIntent", eventId, orderShortId], 
    queryFn: () => orderShortId && eventId ? api.getPaymentIntent(eventId, orderShortId) : null,
    enabled: !!orderShortId && !!eventId
  });

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={200} />
          <Skeleton h={150} />
          <Skeleton h={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (orderQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => orderQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data!;
  const paymentIntent = paymentIntentQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.successHeader}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your payment was successful and tickets have been added to your wallet
          </Text>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID:</Text>
            <Text style={styles.detailValue}>#{order.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Event:</Text>
            <Text style={styles.detailValue}>{order.event.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Venue:</Text>
            <Text style={styles.detailValue}>
              {order.event.venue.name}, {order.event.venue.city}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(order.event.startsAt).toLocaleDateString()} at{" "}
              {new Date(order.event.startsAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusConfirmed]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </Card>

        {paymentIntent && (
          <Card>
            <Text style={styles.sectionTitle}>Payment Confirmation</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Status:</Text>
              <Text style={[styles.detailValue, styles.statusPaid]}>
                {paymentIntent.status?.toUpperCase() || 'PAID'}
              </Text>
            </View>
            {paymentIntent.id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment ID:</Text>
                <Text style={[styles.detailValue, styles.paymentId]}>
                  {paymentIntent.id}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method:</Text>
              <Text style={styles.detailValue}>💳 Card Payment</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Charged:</Text>
              <Text style={[styles.detailValue, styles.statusPaid]}>
                ${paymentIntent.amount} {paymentIntent.currency?.toUpperCase()}
              </Text>
            </View>
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Tickets</Text>
          {order.tickets?.map((ticket: any, index: number) => (
            <View key={ticket.id} style={styles.ticketRow}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketType}>{ticket.tier.name}</Text>
                <Text style={styles.ticketId}>#{ticket.id}</Text>
              </View>
              <View style={styles.ticketPrice}>
                <Text style={styles.priceAmount}>
                  ${ticket.tier.price.amount}
                </Text>
                <Text style={styles.priceCurrency}>
                  {ticket.tier.price.currency}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalAmount}>
              ${order.totalAmount} {order.currency}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <View style={styles.nextSteps}>
            <View style={styles.nextStep}>
              <Text style={styles.stepIcon}>📱</Text>
              <Text style={styles.stepText}>
                Your tickets are now available in your wallet
              </Text>
            </View>
            <View style={styles.nextStep}>
              <Text style={styles.stepIcon}>🎫</Text>
              <Text style={styles.stepText}>
                Show your QR code at the venue for entry
              </Text>
            </View>
            <View style={styles.nextStep}>
              <Text style={styles.stepIcon}>📧</Text>
              <Text style={styles.stepText}>
                A confirmation email has been sent to you
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="View My Tickets"
            onPress={() => navigation.navigate("WalletTab")}
            style={styles.primaryButton}
          />
          <Button
            title="Back to Events"
            onPress={() => navigation.navigate("DiscoverTab")}
            style={styles.secondaryButton}
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
  successHeader: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
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
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  statusConfirmed: {
    color: "#28a745",
    fontWeight: "600",
  },
  statusPaid: {
    color: "#007AFF",
    fontWeight: "600",
  },
  paymentId: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#666",
  },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ticketInfo: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ticketId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  ticketPrice: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  priceCurrency: {
    fontSize: 12,
    color: "#666",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#007AFF",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nextSteps: {
    gap: 16,
  },
  nextStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
  },
});