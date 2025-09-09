import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "../../api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import { qrValidationService, offlineManifestService } from "../../offline";
import { ManifestAttendee } from "../../offline/OfflineManifestService";

export default function ManualLookupScreen({ route, navigation }: any) {
  const { eventId, checkInListId, checkInListName, eventTitle } = route.params;
  const api = useApi();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ManifestAttendee[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  
  useEffect(() => {
    navigation.setOptions({
      title: `${checkInListName} - Manual Lookup`
    });
  }, [navigation, checkInListName]);

  // Real-time search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);
  
  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      // Search in offline manifest first
      const offlineResults = await offlineManifestService.searchAttendees(checkInListId, query, 20);
      setSearchResults(offlineResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckIn = async (attendee: ManifestAttendee) => {
    if (attendee.checkedIn) {
      Alert.alert(
        'Already Checked In',
        `${attendee.firstName} ${attendee.lastName} was already checked in at ${attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString() : 'unknown time'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Undo Check-in', onPress: () => handleUndoCheckIn(attendee) }
        ]
      );
      return;
    }
    
    Alert.alert(
      'Confirm Check-in',
      `Check in ${attendee.firstName} ${attendee.lastName}?\n${attendee.productName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check In', onPress: () => performCheckIn(attendee) }
      ]
    );
  };
  
  const performCheckIn = async (attendee: ManifestAttendee) => {
    setCheckingIn(attendee.id?.toString() || attendee.attendeeId);
    
    try {
      const result = await qrValidationService.performCheckInByShortId(
        checkInListId,
        attendee.attendeeShortId
      );
      
      if (result.success) {
        Alert.alert('Success', `${attendee.firstName} ${attendee.lastName} has been checked in!`);
        
        // Add to recent check-ins
        setRecentCheckIns(prev => [{
          id: attendee.id || attendee.attendeeId,
          name: `${attendee.firstName} ${attendee.lastName}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productName: attendee.productName,
          action: 'checked_in'
        }, ...prev.slice(0, 9)]);
        
        // Update search results to reflect check-in status
        setSearchResults(prev => prev.map(a => 
          a.id === attendee.id 
            ? { ...a, checkedIn: true, checkedInAt: new Date().toISOString() }
            : a
        ));
        
        // Clear search to show fresh results
        setSearchQuery('');
      } else {
        Alert.alert('Check-in Failed', result.message);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      Alert.alert('Error', 'Check-in failed. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };
  
  const handleUndoCheckIn = async (attendee: ManifestAttendee) => {
    try {
      const result = await qrValidationService.undoCheckIn(checkInListId, attendee.attendeeShortId);
      
      if (result.success) {
        Alert.alert('Success', 'Check-in has been undone');
        
        // Add to recent check-ins
        setRecentCheckIns(prev => [{
          id: attendee.id || attendee.attendeeId,
          name: `${attendee.firstName} ${attendee.lastName}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          productName: attendee.productName,
          action: 'undone'
        }, ...prev.slice(0, 9)]);
        
        // Update search results
        setSearchResults(prev => prev.map(a => 
          a.id === attendee.id 
            ? { ...a, checkedIn: false, checkedInAt: null }
            : a
        ));
      } else {
        Alert.alert('Undo Failed', result.message);
      }
    } catch (error) {
      console.error('Undo failed:', error);
      Alert.alert('Error', 'Failed to undo check-in');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.icon}>🔍</Text>
            <Text style={styles.title}>Manual Ticket Lookup</Text>
            <Text style={styles.subtitle}>
              Enter ticket ID to manually validate entry
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Search Attendees</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by name, email, or attendee ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {loading && <Skeleton h={40} />}
          
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id?.toString() || item.attendeeId}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.attendeeItem,
                      item.checkedIn && styles.attendeeItemCheckedIn,
                      checkingIn === (item.id?.toString() || item.attendeeId) && styles.attendeeItemLoading
                    ]}
                    onPress={() => handleCheckIn(item)}
                    disabled={checkingIn === (item.id?.toString() || item.attendeeId)}
                  >
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.attendeeDetails}>
                        {item.email} • {item.productName}
                      </Text>
                      <Text style={styles.attendeeId}>
                        ID: {item.attendeeShortId}
                      </Text>
                    </View>
                    <View style={styles.attendeeStatus}>
                      {item.checkedIn ? (
                        <View style={styles.checkedInBadge}>
                          <Text style={styles.checkedInText}>✓ Checked In</Text>
                          <Text style={styles.checkedInTime}>
                            {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.checkInButton}>
                          <Text style={styles.checkInButtonText}>Check In</Text>
                        </View>
                      )}
                      {checkingIn === (item.id?.toString() || item.attendeeId) && (
                        <Text style={styles.loadingText}>Processing...</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          
          {searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No attendees found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </Card>

        {recentCheckIns.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentCheckIns.map((checkIn, index) => (
              <View key={index} style={styles.validationItem}>
                <Text style={styles.validationIcon}>
                  {checkIn.action === 'checked_in' ? '✅' : '↩️'}
                </Text>
                <View style={styles.validationInfo}>
                  <Text style={styles.validationName}>{checkIn.name}</Text>
                  <Text style={styles.validationDetails}>
                    {checkIn.productName} • {checkIn.time}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
        
        <Card>
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Search Tips</Text>
            <Text style={styles.helpText}>
              • Search by first name, last name, or email{"\n"}
              • Use attendee ID for exact matches{"\n"}
              • Tap any result to check in or undo
            </Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 16,
    fontFamily: "monospace",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  validationIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  validationInfo: {
    flex: 1,
  },
  validationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  validationDetails: {
    fontSize: 12,
    color: "#666",
  },
  searchResults: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginTop: 8,
  },
  attendeeItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  attendeeItemCheckedIn: {
    backgroundColor: "#f8f9fa",
  },
  attendeeItemLoading: {
    opacity: 0.6,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  attendeeDetails: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  attendeeId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  attendeeStatus: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  checkedInBadge: {
    backgroundColor: "#d4edda",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  checkedInText: {
    fontSize: 12,
    color: "#155724",
    fontWeight: "600",
  },
  checkedInTime: {
    fontSize: 10,
    color: "#155724",
    marginTop: 1,
  },
  checkInButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  checkInButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  helpSection: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  mockInfo: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
  },
  mockTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 8,
  },
  mockDescription: {
    fontSize: 14,
    color: "#1976d2",
    lineHeight: 20,
  },
});