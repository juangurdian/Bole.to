import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert, Vibration, TouchableOpacity, Dimensions, Modal, Animated, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { qrValidationService, syncService, offlineManifestService } from "../../offline";
import { CheckInResult } from "../../offline/QRValidationService";
import { ManifestAttendee } from "../../offline/OfflineManifestService";
import NetInfo from '@react-native-community/netinfo';

export default function ScannerScreen({ route, navigation }: any) {
  const { eventId, checkInListId, checkInListName, eventTitle } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState({ 
    totalScans: 0, 
    successfulCheckIns: 0, 
    duplicateAttempts: 0, 
    errors: 0,
    sessionStart: new Date()
  });
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Animation refs
  const scannerPulseAnim = useRef(new Animated.Value(1)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const statsUpdateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      title: `${checkInListName} Scanner`
    });
    
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected || false);
    });
    
    // Load offline status
    loadOfflineStatus();
    
    // Start scanner pulse animation
    startPulseAnimation();
    
    return () => {
      unsubscribe();
    };
  }, [navigation, checkInListName]);
  
  // Load offline status
  const loadOfflineStatus = async () => {
    try {
      const status = await offlineManifestService.getOfflineStatus(checkInListId);
      setOfflineStatus(status);
    } catch (error) {
      console.warn('Failed to load offline status:', error);
    }
  };
  
  // Start pulse animation for scanner frame
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scannerPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scannerPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Animate overlay fade in/out
  const animateOverlay = (show: boolean) => {
    Animated.timing(overlayFadeAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Animate success feedback
  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(successScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Animate stats update
  const animateStatsUpdate = () => {
    Animated.sequence([
      Animated.timing(statsUpdateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(statsUpdateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Play sound feedback
  const playSoundFeedback = async (type: 'success' | 'error' | 'scan') => {
    try {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'error') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([0, 100, 100, 100]);
      } else if (type === 'scan') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  };
  
  // Update session stats
  const updateStats = (type: 'scan' | 'success' | 'duplicate' | 'error') => {
    setSessionStats(prev => {
      const updated = { ...prev };
      
      if (type === 'scan') updated.totalScans += 1;
      else if (type === 'success') updated.successfulCheckIns += 1;
      else if (type === 'duplicate') updated.duplicateAttempts += 1;
      else if (type === 'error') updated.errors += 1;
      
      return updated;
    });
    
    animateStatsUpdate();
  };

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    // Prevent duplicate scans of the same code
    if (data === lastScannedCode || !scanning) {
      return;
    }

    setLastScannedCode(data);
    setScanning(false);
    
    // Clear any existing timeout
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }

    try {
      // Provide immediate feedback
      await playSoundFeedback('scan');
      updateStats('scan');
      
      console.log('Scanned QR code:', data);
      
      // Validate and process the QR code
      const result = await qrValidationService.performCheckIn(data);
      
      setCheckInResult(result);
      setShowResult(true);
      animateOverlay(true);
      
      if (result.success) {
        // Success feedback
        await playSoundFeedback('success');
        animateSuccess();
        setScanCount(prev => prev + 1);
        updateStats('success');
        
        // Add to recent check-ins
        if (result.attendee) {
          setRecentCheckIns(prev => [{
            id: result.attendee!.id,
            name: `${result.attendee!.firstName} ${result.attendee!.lastName}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            productName: result.attendee!.productName,
            timestamp: new Date()
          }, ...prev.slice(0, 4)]);
        }
      } else {
        // Handle different error types
        if (result.message.includes('already checked in')) {
          updateStats('duplicate');
        } else {
          updateStats('error');
        }
        
        // Error feedback
        await playSoundFeedback('error');
      }
      
      // Auto-resume scanning after 3 seconds
      scanTimeout.current = setTimeout(() => {
        setShowResult(false);
        setLastScannedCode(null);
        setScanning(true);
        animateOverlay(false);
      }, 3000);
      
    } catch (error) {
      console.error('QR scan processing failed:', error);
      updateStats('error');
      await playSoundFeedback('error');
      
      Alert.alert(
        'Scan Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'OK', onPress: () => setScanning(true) }]
      );
    }
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes.'
        );
        return;
      }
    }
    
    // Check offline status before starting
    if (!offlineStatus?.isOfflineReady && !isOnline) {
      Alert.alert(
        'Offline Mode Unavailable',
        'You need to be online or have synced the manifest to scan QR codes.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setScanning(true);
    setLastScannedCode(null);
    setShowResult(false);
    animateOverlay(false);
  };

  const stopScanning = () => {
    setScanning(false);
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }
  };

  const handleManualLookup = () => {
    stopScanning();
    navigation.navigate("ManualLookupScreen", { 
      eventId, 
      checkInListId, 
      checkInListName,
      eventTitle 
    });
  };

  const handleUndoCheckIn = async () => {
    if (!checkInResult?.attendee) return;
    
    try {
      const result = await qrValidationService.undoCheckIn(
        checkInListId, 
        checkInResult.attendee.attendeeShortId
      );
      
      if (result.success) {
        Alert.alert('Success', 'Check-in has been undone');
        setCheckInResult(null);
        setShowResult(false);
        setScanning(true);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Undo check-in failed:', error);
      Alert.alert('Error', 'Failed to undo check-in');
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to scan QR codes for check-in.
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Enhanced Status Bar */}
      <View style={styles.statusBar}>
        <Animated.View style={[styles.statusItem, { transform: [{ scale: statsUpdateAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }]}>
          <Text style={styles.statusNumber}>{sessionStats.successfulCheckIns}</Text>
          <Text style={styles.statusLabel}>Checked In</Text>
        </Animated.View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusNumber}>{sessionStats.totalScans}</Text>
          <Text style={styles.statusLabel}>Total Scans</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={[styles.statusNumber, { 
            color: sessionStats.errors > 0 ? '#dc3545' : '#28a745' 
          }]}>{sessionStats.errors}</Text>
          <Text style={styles.statusLabel}>Errors</Text>
        </View>
        <TouchableOpacity 
          style={styles.statusItem}
          onPress={() => navigation.navigate('StaffSyncScreen', { checkInListId })}
        >
          <Text style={[styles.statusNumber, { 
            color: isOnline ? '#28a745' : offlineStatus?.isOfflineReady ? '#ffc107' : '#dc3545'
          }]}>
            {isOnline ? '🌐' : offlineStatus?.isOfflineReady ? '📱' : '⚠️'}
          </Text>
          <Text style={styles.statusLabel}>
            {isOnline ? 'Online' : offlineStatus?.isOfflineReady ? 'Offline Ready' : 'Sync Needed'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        {scanning ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            {/* Enhanced Scanner Overlay */}
            <View style={styles.overlay}>
              <Animated.View style={[
                styles.scannerFrame,
                { transform: [{ scale: scannerPulseAnim }] }
              ]}>
                <View style={styles.corner} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                {/* Scanning line animation */}
                <View style={styles.scanningLine} />
              </Animated.View>
              
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={styles.instructionGradient}
              >
                <Text style={styles.instructionText}>
                  Position QR code within the frame
                </Text>
                <Text style={styles.instructionSubtext}>
                  {isOnline ? 'Online Mode' : offlineStatus?.isOfflineReady ? 'Offline Mode' : 'Sync Required'}
                </Text>
              </LinearGradient>
            </View>
          </CameraView>
        ) : (
          <View style={styles.scannerPlaceholder}>
            <Text style={styles.placeholderEmoji}>📷</Text>
            <Text style={styles.placeholderText}>QR Code Scanner</Text>
            <Text style={styles.placeholderSubtext}>
              Tap "Start Scanning" to begin
            </Text>
          </View>
        )}
      </View>

      {/* Enhanced Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Check-ins</Text>
            <Text style={styles.recentCount}>{recentCheckIns.length}</Text>
          </View>
          {recentCheckIns.slice(0, 3).map((checkIn, index) => {
            const isRecent = checkIn.timestamp && (new Date().getTime() - new Date(checkIn.timestamp).getTime()) < 30000; // 30 seconds
            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.recentItem,
                  isRecent && styles.recentItemHighlight
                ]}
              >
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{checkIn.name}</Text>
                  <Text style={styles.recentDetails}>{checkIn.productName} • {checkIn.time}</Text>
                </View>
                <View style={[styles.recentBadge, isRecent && styles.recentBadgeHighlight]}>
                  <Text style={styles.recentBadgeText}>✓</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        <Button
          title={scanning ? "Stop Scanning" : "Start Scanning"}
          onPress={scanning ? stopScanning : startScanning}
          style={scanning ? styles.stopButton : styles.startButton}
        />
        <Button
          title="Manual Lookup"
          onPress={handleManualLookup}
          style={styles.manualButton}
        />
      </View>
      
      {/* Session Stats Footer */}
      <View style={styles.sessionStats}>
        <Text style={styles.sessionStatsTitle}>Session Stats</Text>
        <View style={styles.sessionStatsRow}>
          <View style={styles.sessionStatItem}>
            <Text style={styles.sessionStatValue}>{sessionStats.successfulCheckIns}</Text>
            <Text style={styles.sessionStatLabel}>Success</Text>
          </View>
          <View style={styles.sessionStatItem}>
            <Text style={styles.sessionStatValue}>{sessionStats.duplicateAttempts}</Text>
            <Text style={styles.sessionStatLabel}>Duplicates</Text>
          </View>
          <View style={styles.sessionStatItem}>
            <Text style={styles.sessionStatValue}>
              {sessionStats.totalScans > 0 ? Math.round((sessionStats.successfulCheckIns / sessionStats.totalScans) * 100) : 0}%
            </Text>
            <Text style={styles.sessionStatLabel}>Success Rate</Text>
          </View>
          <View style={styles.sessionStatItem}>
            <Text style={styles.sessionStatValue}>
              {Math.round((new Date().getTime() - sessionStats.sessionStart.getTime()) / 60000)}m
            </Text>
            <Text style={styles.sessionStatLabel}>Duration</Text>
          </View>
        </View>
      </View>

      {/* Check-in Result Modal */}
      <Modal
        visible={showResult}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModal}>
            {checkInResult?.success ? (
              <Animated.View style={{ transform: [{ scale: successScaleAnim }] }}>
                <View style={styles.successIcon}>
                  <Text style={styles.successEmoji}>✅</Text>
                </View>
                <Text style={styles.resultTitle}>Check-in Successful!</Text>
                <Text style={styles.resultName}>
                  {checkInResult.attendee?.firstName} {checkInResult.attendee?.lastName}
                </Text>
                <Text style={styles.resultDetails}>
                  {checkInResult.attendee?.productName}
                </Text>
                <Text style={styles.resultTime}>
                  {new Date().toLocaleString()}
                </Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity 
                    style={[styles.resultButton, styles.undoButton]} 
                    onPress={handleUndoCheckIn}
                  >
                    <Text style={styles.undoButtonText}>Undo Check-in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.resultButton, styles.continueButton]} 
                    onPress={() => {
                      setShowResult(false);
                      setScanning(true);
                    }}
                  >
                    <Text style={styles.continueButtonText}>Continue Scanning</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ) : (
              <>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorEmoji}>❌</Text>
                </View>
                <Text style={styles.resultTitle}>Check-in Failed</Text>
                <Text style={styles.errorMessage}>{checkInResult?.message}</Text>
                {checkInResult?.attendee && (
                  <>
                    <Text style={styles.resultName}>
                      {checkInResult.attendee.firstName} {checkInResult.attendee.lastName}
                    </Text>
                    <Text style={styles.resultDetails}>
                      {checkInResult.attendee.productName}
                    </Text>
                  </>
                )}
                <TouchableOpacity 
                  style={[styles.resultButton, styles.continueButton]} 
                  onPress={() => {
                    setShowResult(false);
                    setScanning(true);
                  }}
                >
                  <Text style={styles.continueButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statusBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  scannerContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 0,
  },
  instructionGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  scannerPlaceholder: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 24,
    color: "white",
    fontWeight: "600",
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  recentContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  recentDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  recentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#28a745",
    alignItems: "center",
    justifyContent: "center",
  },
  recentBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  controls: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "white",
  },
  startButton: {
    backgroundColor: "#28a745",
    flex: 2,
  },
  stopButton: {
    backgroundColor: "#dc3545",
    flex: 2,
  },
  manualButton: {
    backgroundColor: "#6c757d",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultModal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: width * 0.8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#28a745",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dc3545",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 40,
    color: "white",
  },
  errorEmoji: {
    fontSize: 40,
    color: "white",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  resultName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  resultDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  resultTime: {
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  undoButton: {
    backgroundColor: "#ffc107",
  },
  continueButton: {
    backgroundColor: "#007AFF",
  },
  undoButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  continueButtonText: {
    color: "white",
    fontWeight: "600",
  },
  instructionSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  scanningLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#007AFF",
    opacity: 0.8,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentCount: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recentItemHighlight: {
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  recentBadgeHighlight: {
    backgroundColor: "#20c997",
    transform: [{ scale: 1.2 }],
  },
  sessionStats: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sessionStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  sessionStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sessionStatItem: {
    alignItems: "center",
  },
  sessionStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  sessionStatLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
});