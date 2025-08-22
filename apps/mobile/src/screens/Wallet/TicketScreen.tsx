import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Share, TouchableOpacity, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Skeleton from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import Button from "../../components/Button";
import HoloFoilOverlay from "./components/HoloFoilOverlay";
import * as Brightness from "expo-brightness";

const { width, height } = Dimensions.get("window");

export default function TicketScreen({ route }: any) {
  const { id } = route.params;
  const [isFullscreenQR, setIsFullscreenQR] = useState(false);
  const [originalBrightness, setOriginalBrightness] = useState(0.5);
  const api = useApi();
  
  const q = useQuery({ 
    queryKey: ["ticket", id], 
    queryFn: () => api.getTicket(id) 
  });

  useEffect(() => {
    if (isFullscreenQR) {
      // Store original brightness and set to max for QR scanning
      Brightness.getBrightnessAsync().then(brightness => {
        setOriginalBrightness(brightness);
        Brightness.setBrightnessAsync(1.0);
      });
    } else {
      // Restore original brightness
      Brightness.setBrightnessAsync(originalBrightness);
    }

    return () => {
      Brightness.setBrightnessAsync(originalBrightness);
    };
  }, [isFullscreenQR]);

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

  const handleQRPress = () => {
    if (!isValid) {
      Alert.alert("Invalid Ticket", "This ticket cannot be used for entry.");
      return;
    }
    setIsFullscreenQR(true);
  };

  const formatDateTime = () => {
    const date = new Date(ticket.event.startsAt);
    return date.toLocaleDateString(undefined, { 
      weekday: "long",
      month: "long", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const getSeatDisplay = () => {
    if (ticket.seatInfo?.seat === "Standing") {
      return `${ticket.seatInfo.section} • Standing`;
    }
    return `${ticket.seatInfo?.section} • Row ${ticket.seatInfo?.row} • Seat ${ticket.seatInfo?.seat}`;
  };

  if (isFullscreenQR) {
    return (
      <View style={styles.fullscreenQR}>
        <TouchableOpacity 
          style={styles.qrCloseArea}
          onPress={() => setIsFullscreenQR(false)}
          activeOpacity={1}
        >
          <View style={styles.qrContainer}>
            <HoloFoilOverlay
              primaryColor={ticket.event.holographicTheme.primaryColor}
              secondaryColor={ticket.event.holographicTheme.secondaryColor}
              pattern={ticket.event.holographicTheme.foilPattern}
              intensity={0.8}
            />
            
            <View style={styles.qrHeader}>
              <Text style={styles.qrEventTitle}>{ticket.event.title}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsFullscreenQR(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.qrCodeArea}>
              <View style={styles.qrCode}>
                <Text style={styles.qrCodeText}>{ticket.qrCode}</Text>
                <Text style={styles.qrCodeSubtext}>⬛⬜⬛⬜⬛⬜</Text>
                <Text style={styles.qrCodeSubtext}>⬜⬛⬜⬛⬜⬛</Text>
                <Text style={styles.qrCodeSubtext}>⬛⬜⬛⬜⬛⬜</Text>
              </View>
              
              <View style={styles.qrInfo}>
                <Text style={styles.qrTicketId}>#{ticket.id.slice(-8).toUpperCase()}</Text>
                <Text style={styles.qrSeat}>{getSeatDisplay()}</Text>
                <Text style={styles.qrTier}>{ticket.tier.name}</Text>
              </View>
            </View>

            <View style={styles.qrFooter}>
              <Text style={styles.qrInstructions}>
                Show this QR code to venue staff for entry
              </Text>
              <Text style={styles.qrDateTime}>{formatDateTime()}</Text>
            </View>

            <View style={styles.securityStrip}>
              <Text style={styles.securityText}>
                {ticket.holographicData.microtext}
              </Text>
              <Text style={styles.serialNumber}>
                {ticket.holographicData.serialNumber}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Ticket Display */}
        <View style={styles.ticketContainer}>
          <HoloFoilOverlay
            primaryColor={ticket.event.holographicTheme.primaryColor}
            secondaryColor={ticket.event.holographicTheme.secondaryColor}
            pattern={ticket.event.holographicTheme.foilPattern}
            intensity={ticket.event.holographicTheme.shimmerIntensity}
          />
          
          <View style={styles.ticketHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{ticket.event.title}</Text>
              <Text style={styles.venue}>{ticket.event.venue.name}</Text>
              <Text style={styles.city}>{ticket.event.venue.city}</Text>
              <Text style={styles.dateTime}>{formatDateTime()}</Text>
            </View>
            
            <View style={styles.statusSection}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isValid ? "#00C851" : isUsed ? "#FF8800" : "#FF4444" }
              ]}>
                <Text style={styles.statusText}>
                  {isValid ? "VALID" : isUsed ? "USED" : "INVALID"}
                </Text>
              </View>
              <Text style={styles.price}>${ticket.price.toFixed(0)}</Text>
            </View>
          </View>

          {/* QR Code Section */}
          <TouchableOpacity 
            style={styles.qrSection}
            onPress={handleQRPress}
            disabled={!isValid}
          >
            <View style={styles.qrPreview}>
              <Text style={styles.qrEmoji}>⬛</Text>
              <Text style={styles.qrLabel}>
                {isValid ? "Tap for full-screen QR" : "Ticket Invalid"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Ticket Details */}
          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TIER</Text>
              <Text style={styles.detailValue}>{ticket.tier.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SEAT</Text>
              <Text style={styles.detailValue}>{getSeatDisplay()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TICKET ID</Text>
              <Text style={styles.detailValue}>#{ticket.id.slice(-8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Security Strip */}
          <View style={styles.securityFooter}>
            <Text style={styles.microtextFooter}>
              {ticket.holographicData.microtext}
            </Text>
            <Text style={styles.serialFooter}>
              {ticket.holographicData.serialNumber}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Share Ticket"
            onPress={handleShare}
            style={styles.shareButton}
          />
          {isValid && (
            <Button
              title="Show QR Code"
              onPress={handleQRPress}
              style={styles.qrButton}
            />
          )}
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <Text style={styles.infoTitle}>Important Information</Text>
          <Text style={styles.infoText}>
            • Arrive 30 minutes before the event start time
          </Text>
          <Text style={styles.infoText}>
            • Keep your ticket QR code secure and don't share screenshots
          </Text>
          <Text style={styles.infoText}>
            • No re-entry policy applies
          </Text>
          <Text style={styles.infoText}>
            • Contact support if you have any issues
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  content: {
    padding: 16,
  },
  ticketContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 16,
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    lineHeight: 28,
  },
  venue: {
    fontSize: 16,
    color: "#BBB",
    marginBottom: 4,
    fontWeight: "500",
  },
  city: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  statusSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  qrSection: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#333",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  qrPreview: {
    alignItems: "center",
  },
  qrEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  ticketDetails: {
    padding: 24,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    fontFamily: "monospace",
  },
  securityFooter: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  microtextFooter: {
    fontSize: 8,
    color: "#666",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  serialFooter: {
    fontSize: 8,
    color: "#888",
    fontFamily: "monospace",
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: "#333",
  },
  qrButton: {
    backgroundColor: "#007AFF",
  },
  additionalInfo: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#BBB",
    lineHeight: 20,
    marginBottom: 4,
  },
  // Fullscreen QR Styles
  fullscreenQR: {
    flex: 1,
    backgroundColor: "#000",
  },
  qrCloseArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#333",
    position: "relative",
  },
  qrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  qrEventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  qrCodeArea: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  qrCodeSubtext: {
    fontSize: 20,
    fontFamily: "monospace",
    color: "#000",
    lineHeight: 22,
  },
  qrInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrTicketId: {
    fontSize: 16,
    fontFamily: "monospace",
    color: "white",
    fontWeight: "700",
    marginBottom: 4,
  },
  qrSeat: {
    fontSize: 14,
    color: "#BBB",
    marginBottom: 2,
  },
  qrTier: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  qrFooter: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  qrInstructions: {
    fontSize: 14,
    color: "#BBB",
    textAlign: "center",
    marginBottom: 8,
  },
  qrDateTime: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  securityStrip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityText: {
    fontSize: 8,
    color: "#666",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  serialNumber: {
    fontSize: 8,
    color: "#888",
    fontFamily: "monospace",
  },
});