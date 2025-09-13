import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../../theme/v2-neutral';
import { LinearGradient } from 'expo-linear-gradient';
import AddDJModal from './components/AddDJModal';

export interface DJ {
  id: string;
  name: string;
  genre: string[];
  bio?: string;
  socialMedia: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    website?: string;
  };
  avatar?: string;
  performanceTime: {
    startTime: Date;
    endTime: Date;
  };
  isHeadliner: boolean;
  musicStyle: string;
  status: 'confirmed' | 'pending' | 'declined';
  order: number;
  color: string; // For visual distinction
}

interface DJLineupScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

export default function DJLineupScreen({ navigation, route }: DJLineupScreenProps) {
  const { eventId } = route.params;
  const [djs, setDjs] = useState<DJ[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDJ, setEditingDJ] = useState<DJ | undefined>();
  const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('cards');

  const djColors = [
    '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const handleAddDJ = (djData: Omit<DJ, 'id' | 'order'>) => {
    const newDJ: DJ = {
      ...djData,
      id: Date.now().toString(),
      order: djs.length,
      color: djColors[djs.length % djColors.length],
    };
    setDjs([...djs, newDJ].sort((a, b) => a.performanceTime.startTime.getTime() - b.performanceTime.startTime.getTime()));
    setShowAddModal(false);
  };

  const handleEditDJ = (dj: DJ) => {
    setEditingDJ(dj);
    setShowAddModal(true);
  };

  const handleUpdateDJ = (djData: Omit<DJ, 'id' | 'order'>) => {
    if (!editingDJ) return;
    
    const updatedDJs = djs.map(dj => 
      dj.id === editingDJ.id 
        ? { ...djData, id: editingDJ.id, order: dj.order, color: dj.color }
        : dj
    ).sort((a, b) => a.performanceTime.startTime.getTime() - b.performanceTime.startTime.getTime());
    
    setDjs(updatedDJs);
    setShowAddModal(false);
    setEditingDJ(undefined);
  };

  const handleDeleteDJ = (djId: string) => {
    Alert.alert(
      'Remove DJ',
      'Are you sure you want to remove this DJ from the lineup?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setDjs(djs.filter(dj => dj.id !== djId));
          },
        },
      ]
    );
  };

  const handleReorderDJs = (fromIndex: number, toIndex: number) => {
    const reorderedDJs = [...djs];
    const [movedDJ] = reorderedDJs.splice(fromIndex, 1);
    reorderedDJs.splice(toIndex, 0, movedDJ);
    setDjs(reorderedDJs.map((dj, index) => ({ ...dj, order: index })));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  const getStatusColor = (status: DJ['status']) => {
    switch (status) {
      case 'confirmed': return '#4ECDC4';
      case 'pending': return '#FFEAA7';
      case 'declined': return '#FF6B6B';
      default: return colors.text.tertiary;
    }
  };

  const renderDJCard = (dj: DJ, index: number) => {
    return (
      <TouchableOpacity
        key={dj.id}
        style={[styles.djCard, { borderLeftColor: dj.color }]}
        onPress={() => handleEditDJ(dj)}
        onLongPress={() => {
          Alert.alert(
            'DJ Options',
            `Options for ${dj.name}`,
            [
              { text: 'Edit', onPress: () => handleEditDJ(dj) },
              { text: 'Remove', style: 'destructive', onPress: () => handleDeleteDJ(dj.id) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.djCardHeader}>
          <View style={styles.djInfo}>
            <View style={styles.djNameRow}>
              <Text style={styles.djName}>{dj.name}</Text>
              {dj.isHeadliner && (
                <View style={styles.headlinerBadge}>
                  <Feather name="star" size={12} color="#FFD700" />
                  <Text style={styles.headlinerText}>Headliner</Text>
                </View>
              )}
            </View>
            <Text style={styles.musicStyle}>{dj.musicStyle}</Text>
          </View>
          <View style={styles.djStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(dj.status) }]} />
            <Text style={styles.statusText}>{dj.status}</Text>
          </View>
        </View>

        <View style={styles.djGenres}>
          {dj.genre.slice(0, 3).map((genre, idx) => (
            <View key={idx} style={[styles.genreTag, { backgroundColor: `${dj.color}20` }]}>
              <Text style={[styles.genreText, { color: dj.color }]}>{genre}</Text>
            </View>
          ))}
          {dj.genre.length > 3 && (
            <Text style={styles.moreGenres}>+{dj.genre.length - 3}</Text>
          )}
        </View>

        <View style={styles.performanceInfo}>
          <View style={styles.timeSlot}>
            <Feather name="clock" size={14} color={colors.text.tertiary} />
            <Text style={styles.timeText}>
              {formatTime(dj.performanceTime.startTime)} - {formatTime(dj.performanceTime.endTime)}
            </Text>
          </View>
        </View>

        {dj.bio && (
          <Text style={styles.djBio} numberOfLines={2}>{dj.bio}</Text>
        )}

        <View style={styles.djActions}>
          <View style={styles.socialLinks}>
            {dj.socialMedia.instagram && (
              <TouchableOpacity style={styles.socialButton}>
                <Feather name="instagram" size={16} color="#E4405F" />
              </TouchableOpacity>
            )}
            {dj.socialMedia.soundcloud && (
              <TouchableOpacity style={styles.socialButton}>
                <Feather name="headphones" size={16} color="#FF7700" />
              </TouchableOpacity>
            )}
            {dj.socialMedia.spotify && (
              <TouchableOpacity style={styles.socialButton}>
                <Feather name="music" size={16} color="#1DB954" />
              </TouchableOpacity>
            )}
            {dj.socialMedia.website && (
              <TouchableOpacity style={styles.socialButton}>
                <Feather name="globe" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimelineView = () => {
    const sortedDJs = [...djs].sort((a, b) => 
      a.performanceTime.startTime.getTime() - b.performanceTime.startTime.getTime()
    );

    return (
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Performance Schedule</Text>
        {sortedDJs.map((dj, index) => (
          <View key={dj.id} style={styles.timelineItem}>
            <View style={styles.timelineTime}>
              <Text style={styles.timelineTimeText}>
                {formatTime(dj.performanceTime.startTime)}
              </Text>
            </View>
            <View style={styles.timelineLine}>
              <View style={[styles.timelineDot, { backgroundColor: dj.color }]} />
              {index < sortedDJs.length - 1 && <View style={styles.timelineConnector} />}
            </View>
            <TouchableOpacity 
              style={styles.timelineContent}
              onPress={() => handleEditDJ(dj)}
            >
              <Text style={styles.timelineDJName}>{dj.name}</Text>
              <Text style={styles.timelineMusicStyle}>{dj.musicStyle}</Text>
              {dj.isHeadliner && (
                <View style={styles.headlinerBadge}>
                  <Feather name="star" size={10} color="#FFD700" />
                  <Text style={styles.headlinerText}>Headliner</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const headliners = djs.filter(dj => dj.isHeadliner);
  const confirmedDJs = djs.filter(dj => dj.status === 'confirmed');

  return (
    <LinearGradient
      colors={[colors.bg, '#0B0F16', '#0A0C10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DJ Lineup</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'cards' ? 'timeline' : 'cards')}
            >
              <Feather 
                name={viewMode === 'cards' ? 'list' : 'grid'} 
                size={20} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)}
              style={styles.headerButton}
            >
              <Feather name="plus" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Bar */}
        {djs.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{djs.length}</Text>
              <Text style={styles.statLabel}>DJs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{headliners.length}</Text>
              <Text style={styles.statLabel}>Headliners</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{confirmedDJs.length}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {djs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.musicNote}>
                <Feather name="music" size={48} color={colors.accent} />
                <View style={styles.musicWaves}>
                  <View style={[styles.wave, styles.wave1]} />
                  <View style={[styles.wave, styles.wave2]} />
                  <View style={[styles.wave, styles.wave3]} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Build Your Lineup</Text>
              <Text style={styles.emptyMessage}>
                Add DJs to create an amazing musical experience for your event
              </Text>
              <TouchableOpacity
                style={styles.addFirstDJButton}
                onPress={() => setShowAddModal(true)}
              >
                <Feather name="plus" size={20} color={colors.bg} />
                <Text style={styles.addFirstDJButtonText}>Add First DJ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {viewMode === 'cards' ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {djs.length} {djs.length === 1 ? 'DJ' : 'DJs'} in Lineup
                  </Text>
                  {djs.map(renderDJCard)}
                  
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Feather name="plus" size={20} color={colors.accent} />
                    <Text style={styles.addMoreButtonText}>Add Another DJ</Text>
                  </TouchableOpacity>
                </>
              ) : (
                renderTimelineView()
              )}
            </>
          )}
        </ScrollView>

        {/* Add DJ Modal */}
        <AddDJModal
          visible={showAddModal}
          editingDJ={editingDJ}
          existingDJs={djs}
          onClose={() => {
            setShowAddModal(false);
            setEditingDJ(undefined);
          }}
          onSave={editingDJ ? handleUpdateDJ : handleAddDJ}
        />
      </SafeAreaView>
    </LinearGradient>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  viewToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surface1,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing(3),
    backgroundColor: colors.surface1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing(1),
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(4),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(4),
  },
  djCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    padding: spacing(4),
    marginBottom: spacing(4),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  djCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(3),
  },
  djInfo: {
    flex: 1,
  },
  djNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  djName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: spacing(2),
  },
  headlinerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
    gap: spacing(1),
  },
  headlinerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFD700',
    textTransform: 'uppercase',
  },
  musicStyle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  djStatus: {
    alignItems: 'center',
    gap: spacing(1),
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  djGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(3),
    alignItems: 'center',
  },
  genreTag: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.sm,
  },
  genreText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreGenres: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  performanceInfo: {
    marginBottom: spacing(3),
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(1),
  },
  timeText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  djBio: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing(3),
  },
  djActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    paddingVertical: spacing(4),
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(6),
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing(4),
  },
  timelineTime: {
    width: 80,
    alignItems: 'flex-end',
    paddingRight: spacing(3),
  },
  timelineTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing(1),
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: radii.md,
    padding: spacing(3),
    marginLeft: spacing(2),
  },
  timelineDJName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  timelineMusicStyle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(8),
  },
  musicNote: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(6),
  },
  musicWaves: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  wave: {
    width: 3,
    backgroundColor: colors.accent,
    marginVertical: 1,
    borderRadius: 2,
  },
  wave1: {
    height: 15,
    opacity: 0.8,
  },
  wave2: {
    height: 25,
    opacity: 0.6,
  },
  wave3: {
    height: 20,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing(2),
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing(6),
  },
  addFirstDJButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
    borderRadius: radii.lg,
    gap: spacing(2),
  },
  addFirstDJButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    paddingVertical: spacing(4),
    borderRadius: radii.lg,
    gap: spacing(2),
    marginTop: spacing(2),
  },
  addMoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
  },
});