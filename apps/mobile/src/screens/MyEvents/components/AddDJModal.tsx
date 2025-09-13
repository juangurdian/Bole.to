import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../../theme/v2-neutral';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DJ } from '../DJLineupScreen';

interface AddDJModalProps {
  visible: boolean;
  editingDJ?: DJ;
  existingDJs: DJ[];
  onClose: () => void;
  onSave: (djData: Omit<DJ, 'id' | 'order' | 'color'>) => void;
}

interface DJFormData {
  name: string;
  genre: string[];
  bio: string;
  socialMedia: {
    instagram: string;
    soundcloud: string;
    spotify: string;
    website: string;
  };
  performanceTime: {
    startTime: Date;
    endTime: Date;
  };
  isHeadliner: boolean;
  musicStyle: string;
  status: 'confirmed' | 'pending' | 'declined';
}

const popularGenres = [
  'House', 'Techno', 'Progressive', 'Trance', 'Deep House', 'Tech House',
  'Minimal', 'Electro', 'Drum & Bass', 'Dubstep', 'Ambient', 'Disco',
  'Funk', 'Soul', 'Hip Hop', 'R&B', 'Pop', 'Rock', 'Indie', 'Electronic'
];

const musicStyles = [
  'High Energy', 'Melodic', 'Underground', 'Commercial', 'Experimental',
  'Classic', 'Modern', 'Atmospheric', 'Driving', 'Groovy', 'Euphoric'
];

export default function AddDJModal({
  visible,
  editingDJ,
  existingDJs,
  onClose,
  onSave,
}: AddDJModalProps) {
  const [formData, setFormData] = useState<DJFormData>({
    name: '',
    genre: [],
    bio: '',
    socialMedia: {
      instagram: '',
      soundcloud: '',
      spotify: '',
      website: '',
    },
    performanceTime: {
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
    },
    isHeadliner: false,
    musicStyle: '',
    status: 'pending',
  });

  const [showDatePicker, setShowDatePicker] = useState<{
    field: 'start' | 'end' | null;
    mode: 'date' | 'time';
  }>({ field: null, mode: 'time' });

  const [showGenreSelector, setShowGenreSelector] = useState(false);
  const [customGenre, setCustomGenre] = useState('');

  useEffect(() => {
    if (editingDJ) {
      setFormData({
        name: editingDJ.name,
        genre: editingDJ.genre,
        bio: editingDJ.bio || '',
        socialMedia: {
          instagram: editingDJ.socialMedia.instagram || '',
          soundcloud: editingDJ.socialMedia.soundcloud || '',
          spotify: editingDJ.socialMedia.spotify || '',
          website: editingDJ.socialMedia.website || '',
        },
        performanceTime: editingDJ.performanceTime,
        isHeadliner: editingDJ.isHeadliner,
        musicStyle: editingDJ.musicStyle,
        status: editingDJ.status,
      });
    } else {
      // Reset form for new DJ
      const defaultStartTime = new Date();
      defaultStartTime.setHours(22, 0, 0, 0); // Default to 10 PM
      const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000);
      
      setFormData({
        name: '',
        genre: [],
        bio: '',
        socialMedia: {
          instagram: '',
          soundcloud: '',
          spotify: '',
          website: '',
        },
        performanceTime: {
          startTime: defaultStartTime,
          endTime: defaultEndTime,
        },
        isHeadliner: false,
        musicStyle: '',
        status: 'pending',
      });
    }
  }, [editingDJ, visible]);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker({ field: null, mode: 'time' });
    }
    
    if (selectedDate && showDatePicker.field) {
      const field = showDatePicker.field;
      
      setFormData(prev => ({
        ...prev,
        performanceTime: {
          ...prev.performanceTime,
          [field === 'start' ? 'startTime' : 'endTime']: selectedDate,
        },
      }));
    }
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre].slice(0, 5), // Max 5 genres
    }));
  };

  const addCustomGenre = () => {
    if (customGenre.trim() && !formData.genre.includes(customGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genre: [...prev.genre, customGenre.trim()].slice(0, 5),
      }));
      setCustomGenre('');
    }
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter the DJ name');
      return;
    }
    if (formData.genre.length === 0) {
      Alert.alert('Error', 'Please select at least one genre');
      return;
    }
    if (!formData.musicStyle.trim()) {
      Alert.alert('Error', 'Please select a music style');
      return;
    }
    if (formData.performanceTime.endTime <= formData.performanceTime.startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Check for time conflicts
    const hasConflict = existingDJs.some(dj => {
      if (editingDJ && dj.id === editingDJ.id) return false;
      
      const djStart = dj.performanceTime.startTime.getTime();
      const djEnd = dj.performanceTime.endTime.getTime();
      const newStart = formData.performanceTime.startTime.getTime();
      const newEnd = formData.performanceTime.endTime.getTime();
      
      return (newStart < djEnd && newEnd > djStart);
    });

    if (hasConflict) {
      Alert.alert(
        'Time Conflict',
        'This time slot conflicts with another DJ. Do you want to continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: saveData },
        ]
      );
    } else {
      saveData();
    }
  };

  const saveData = () => {
    const djData: Omit<DJ, 'id' | 'order' | 'color'> = {
      name: formData.name.trim(),
      stageName: formData.stageName.trim() || undefined,
      genre: formData.genre,
      bio: formData.bio.trim() || undefined,
      socialMedia: {
        instagram: formData.socialMedia.instagram.trim() || undefined,
        soundcloud: formData.socialMedia.soundcloud.trim() || undefined,
        spotify: formData.socialMedia.spotify.trim() || undefined,
        website: formData.socialMedia.website.trim() || undefined,
      },
      performanceTime: formData.performanceTime,
      isHeadliner: formData.isHeadliner,
      musicStyle: formData.musicStyle,
      status: formData.status,
    };

    onSave(djData);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <LinearGradient
        colors={[colors.bg, '#0B0F16', '#0A0C10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingDJ ? 'Edit DJ' : 'Add DJ'}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Basic Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DJ Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter DJ name"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.bio}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                    placeholder="Tell us about this DJ..."
                    placeholderTextColor={colors.text.tertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Music Style & Genres */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Music Style & Genres</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Music Style *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
                    {musicStyles.map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.styleChip,
                          formData.musicStyle === style && styles.styleChipActive,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, musicStyle: style }))}
                      >
                        <Text
                          style={[
                            styles.styleChipText,
                            formData.musicStyle === style && styles.styleChipTextActive,
                          ]}
                        >
                          {style}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.genreHeader}>
                    <Text style={styles.inputLabel}>Genres * ({formData.genre.length}/5)</Text>
                    <TouchableOpacity
                      style={styles.genreToggle}
                      onPress={() => setShowGenreSelector(!showGenreSelector)}
                    >
                      <Text style={styles.genreToggleText}>
                        {showGenreSelector ? 'Hide' : 'Show'} Genres
                      </Text>
                      <Feather 
                        name={showGenreSelector ? 'chevron-up' : 'chevron-down'} 
                        size={16} 
                        color={colors.accent} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Selected Genres */}
                  {formData.genre.length > 0 && (
                    <View style={styles.selectedGenres}>
                      {formData.genre.map((genre, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.selectedGenreTag}
                          onPress={() => toggleGenre(genre)}
                        >
                          <Text style={styles.selectedGenreText}>{genre}</Text>
                          <Feather name="x" size={14} color={colors.accent} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {showGenreSelector && (
                    <View style={styles.genreSelector}>
                      <View style={styles.genreGrid}>
                        {popularGenres.map((genre) => (
                          <TouchableOpacity
                            key={genre}
                            style={[
                              styles.genreChip,
                              formData.genre.includes(genre) && styles.genreChipSelected,
                            ]}
                            onPress={() => toggleGenre(genre)}
                            disabled={!formData.genre.includes(genre) && formData.genre.length >= 5}
                          >
                            <Text
                              style={[
                                styles.genreChipText,
                                formData.genre.includes(genre) && styles.genreChipTextSelected,
                              ]}
                            >
                              {genre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.customGenreRow}>
                        <TextInput
                          style={[styles.input, styles.customGenreInput]}
                          value={customGenre}
                          onChangeText={setCustomGenre}
                          placeholder="Custom genre..."
                          placeholderTextColor={colors.text.tertiary}
                        />
                        <TouchableOpacity
                          style={styles.addGenreButton}
                          onPress={addCustomGenre}
                          disabled={formData.genre.length >= 5}
                        >
                          <Feather name="plus" size={16} color={colors.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Performance Schedule */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Schedule</Text>
                
                <View style={styles.timeSlotContainer}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowDatePicker({ field: 'start', mode: 'time' })}
                  >
                    <View style={styles.timeButtonContent}>
                      <Feather name="clock" size={16} color={colors.accent} />
                      <View>
                        <Text style={styles.timeLabel}>Start Time</Text>
                        <Text style={styles.timeValue}>{formatTime(formData.performanceTime.startTime)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowDatePicker({ field: 'end', mode: 'time' })}
                  >
                    <View style={styles.timeButtonContent}>
                      <Feather name="clock" size={16} color={colors.accent} />
                      <View>
                        <Text style={styles.timeLabel}>End Time</Text>
                        <Text style={styles.timeValue}>{formatTime(formData.performanceTime.endTime)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Social Media */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Social Media</Text>
                
                <View style={styles.socialRow}>
                  <View style={styles.socialIcon}>
                    <Feather name="instagram" size={20} color="#E4405F" />
                  </View>
                  <TextInput
                    style={[styles.input, styles.socialInput]}
                    value={formData.socialMedia.instagram}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, instagram: text }
                    }))}
                    placeholder="@username"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                <View style={styles.socialRow}>
                  <View style={styles.socialIcon}>
                    <Feather name="headphones" size={20} color="#FF7700" />
                  </View>
                  <TextInput
                    style={[styles.input, styles.socialInput]}
                    value={formData.socialMedia.soundcloud}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, soundcloud: text }
                    }))}
                    placeholder="soundcloud.com/artist"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                <View style={styles.socialRow}>
                  <View style={styles.socialIcon}>
                    <Feather name="music" size={20} color="#1DB954" />
                  </View>
                  <TextInput
                    style={[styles.input, styles.socialInput]}
                    value={formData.socialMedia.spotify}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, spotify: text }
                    }))}
                    placeholder="Spotify artist URL"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>

                <View style={styles.socialRow}>
                  <View style={styles.socialIcon}>
                    <Feather name="globe" size={20} color={colors.accent} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.socialInput]}
                    value={formData.socialMedia.website}
                    onChangeText={(text) => setFormData(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, website: text }
                    }))}
                    placeholder="website.com"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>
              </View>

              {/* Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Headliner</Text>
                    <Text style={styles.toggleDescription}>Mark as a headlining act</Text>
                  </View>
                  <Switch
                    value={formData.isHeadliner}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isHeadliner: value }))}
                    trackColor={{ false: colors.surface2, true: colors.accent }}
                    thumbColor={colors.text.primary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.statusButtons}>
                    {(['pending', 'confirmed', 'declined'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          formData.status === status && styles.statusButtonActive,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, status }))}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            formData.status === status && styles.statusButtonTextActive,
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </View>

              <View style={{ height: spacing(8) }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Date/Time Picker */}
          {showDatePicker.field && (
            <DateTimePicker
              value={
                showDatePicker.field === 'start' 
                  ? formData.performanceTime.startTime 
                  : formData.performanceTime.endTime
              }
              mode={showDatePicker.mode}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(4),
  },
  section: {
    marginBottom: spacing(6),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(4),
  },
  inputGroup: {
    marginBottom: spacing(4),
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(2),
  },
  input: {
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: spacing(3),
  },
  row: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  rowItem: {
    flex: 1,
  },
  styleScroll: {
    marginBottom: spacing(2),
  },
  styleChip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: spacing(2),
  },
  styleChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  styleChipText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  styleChipTextActive: {
    color: colors.bg,
    fontWeight: '600',
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  genreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  genreToggleText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  selectedGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  selectedGenreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    gap: spacing(1),
  },
  selectedGenreText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.bg,
  },
  genreSelector: {
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: spacing(3),
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  genreChip: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  genreChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  genreChipText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  genreChipTextSelected: {
    color: colors.bg,
    fontWeight: '600',
  },
  customGenreRow: {
    flexDirection: 'row',
    gap: spacing(2),
    alignItems: 'flex-end',
  },
  customGenreInput: {
    flex: 1,
  },
  addGenreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    gap: spacing(3),
    marginBottom: spacing(4),
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing(3),
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  timeLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing(1),
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    marginBottom: spacing(3),
  },
  socialIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
  },
  socialInput: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing(4),
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing(3),
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  toggleDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  statusButton: {
    flex: 1,
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    backgroundColor: colors.surface1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  statusButtonTextActive: {
    color: colors.bg,
    fontWeight: '600',
  },
});