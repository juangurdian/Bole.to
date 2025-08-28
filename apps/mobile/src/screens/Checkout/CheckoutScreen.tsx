import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStripe } from '@stripe/stripe-react-native';
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function CheckoutScreen({ route, navigation }: any) {
  const { eventId, items } = route.params;
  const api = useApi();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processing, setProcessing] = useState(false);
  const [paymentSheetInitialized, setPaymentSheetInitialized] = useState(false);
  
  const eventQuery = useQuery({ 
    queryKey: ["event", eventId], 
    queryFn: () => api.getEvent(eventId) 
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Create order through real API
      const order = await api.createOrder(eventId, items);
      return order;
    },
    onSuccess: async (order) => {
      try {
        // Get payment intent from Hi.Events backend
        const paymentIntent = await api.createPaymentIntent(eventId, order.short_id);
        
        // Initialize Stripe Payment Sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.client_secret,
          merchantDisplayName: 'Boleto Events',
          defaultBillingDetails: {
            name: 'Customer', // Could be populated from user profile
          },
          allowsDelayedPaymentMethods: false,
          returnURL: 'boleto://payment-success',
        });

        if (initError) {
          console.error('Payment sheet initialization failed:', initError);
          Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.');
          return;
        }

        setPaymentSheetInitialized(true);
        
        // Present payment sheet
        const { error: paymentError } = await presentPaymentSheet();
        
        if (paymentError) {
          console.error('Payment failed:', paymentError);
          handlePaymentError(paymentError);
          return;
        }
        
        // Payment successful - navigate to confirmation
        navigation.navigate('OrderConfirmation', { 
          orderId: order.id,
          orderShortId: order.short_id,
          eventId: eventId 
        });
        
      } catch (error: any) {
        console.error('Payment process failed:', error);
        Alert.alert('Payment Error', error.message || 'Payment failed. Please try again.');
      }
    },
    onError: (error: any) => {
      handleNetworkError(error);
    }
  });

  const handlePaymentError = (error: any) => {
    let errorMessage = 'Payment failed. Please try again.';
    let showRetryOption = true;
    
    switch (error.code) {
      case 'Canceled':
        errorMessage = 'Payment was cancelled. You can try again when ready.';
        showRetryOption = true;
        break;
      case 'Failed':
        errorMessage = 'Payment failed. Please check your card details and try again.';
        showRetryOption = true;
        break;
      case 'PaymentMethodRequired':
        errorMessage = 'Please select a payment method to continue.';
        showRetryOption = true;
        break;
      case 'Incomplete':
        errorMessage = 'Payment incomplete. Please try again or use a different payment method.';
        showRetryOption = true;
        break;
      case 'InsufficientFunds':
        errorMessage = 'Insufficient funds. Please try a different payment method.';
        showRetryOption = true;
        break;
      case 'CardDeclined':
        errorMessage = 'Your card was declined. Please try a different payment method.';
        showRetryOption = true;
        break;
      case 'ExpiredCard':
        errorMessage = 'Your card has expired. Please use a different payment method.';
        showRetryOption = true;
        break;
      case 'IncorrectCvc':
        errorMessage = 'Incorrect CVC code. Please check and try again.';
        showRetryOption = true;
        break;
      case 'ProcessingError':
        errorMessage = 'Processing error occurred. Please try again in a moment.';
        showRetryOption = true;
        break;
      case 'AuthenticationRequired':
        errorMessage = '3D Secure authentication failed. Please try again.';
        showRetryOption = true;
        break;
      default:
        // Check for network/connectivity errors
        if (error.message?.toLowerCase().includes('network') || 
            error.message?.toLowerCase().includes('connection') ||
            error.message?.toLowerCase().includes('timeout')) {
          errorMessage = 'Network connection issue. Please check your internet and try again.';
        } else {
          errorMessage = error.message || 'Payment failed. Please try again.';
        }
        showRetryOption = true;
    }
    
    const alertButtons: any[] = [{ text: 'OK', style: 'cancel' }];
    
    if (showRetryOption) {
      alertButtons.push({ 
        text: 'Retry Payment', 
        onPress: () => handlePayment(),
        style: 'default' 
      });
    }
    
    Alert.alert('Payment Error', errorMessage, alertButtons);
  };

  const handleNetworkError = (error: any) => {
    console.error('Network error during order creation:', error);
    
    let errorMessage = 'Network error. Please check your connection and try again.';
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      errorMessage = 'Connection timeout. Please check your internet connection.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (error.response?.status === 422) {
      errorMessage = 'Invalid order data. Please refresh and try again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Event not found. Please refresh and try again.';
    }
    
    Alert.alert('Connection Error', errorMessage, [
      { text: 'OK', style: 'cancel' },
      { text: 'Retry', onPress: () => handlePayment(), style: 'default' }
    ]);
  };"}

  if (eventQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Skeleton h={120} />
          <Skeleton h={200} />
          <Skeleton h={80} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (eventQuery.isError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState onRetry={() => eventQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const event = eventQuery.data!;
  const tiers = event.tiers || [];
  
  const orderItems = items.map((item: any) => {
    const tier = tiers.find(t => t.id === item.tierId);
    return {
      ...item,
      tier,
      subtotal: tier ? tier.price.amount * item.qty : 0
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await createOrderMutation.mutateAsync({
        eventId,
        items: items.map((item: any) => ({
          tierId: item.tierId,
          quantity: item.qty
        }))
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Card>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.venue}>{event.venue.name}, {event.venue.city}</Text>
          <Text style={styles.date}>
            {new Date(event.startsAt).toLocaleDateString()} at{" "}
            {new Date(event.startsAt).toLocaleTimeString()}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {orderItems.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.tier.name}</Text>
                <Text style={styles.itemDetails}>
                  ${item.tier.price.amount} × {item.qty}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ${item.subtotal} {item.tier.price.currency}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ${total} {orderItems[0]?.tier.price.currency || "USD"}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentLabel}>💳 Credit/Debit Card</Text>
            <Text style={styles.paymentDescription}>
              Pay securely with Stripe
            </Text>
            {paymentSheetInitialized && (
              <View style={styles.paymentReady}>
                <Text style={styles.paymentReadyText}>✅ Payment ready</Text>
              </View>
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title={processing ? "Processing..." : `Pay $${total}`}
            onPress={handlePayment}
            loading={processing}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  venue: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: "#007AFF",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDetails: {
    fontSize: 14,
    color: "#666",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
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
    fontSize: 20,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  paymentMethod: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: "#666",
  },
  paymentReady: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e8f5e8",
    borderRadius: 4,
  },
  paymentReadyText: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "500",
  },
  actions: {
    padding: 16,
  },
});