import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ImageUploadProps } from './types';
import { colors, spacing, radii, typography } from '../../../theme/v2-neutral';

// Lazy import for expo-image-picker to avoid bundling issues
const getImagePicker = async () => {
  try {
    const ImagePicker = await import('expo-image-picker');
    return ImagePicker;
  } catch (error) {
    console.warn('expo-image-picker not available:', error);
    return null;
  }
};

export function ImageUploadComponent({
  value,
  onImageSelected,
  onImageRemoved,
  style
}: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const ImagePicker = await getImagePicker();
    if (!ImagePicker) {
      Alert.alert('Error', 'Image picker not available');
      return false;
    }

    if (Platform.OS !== 'web') {
      const cameraRollStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraRollStatus.status !== 'granted' || cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload images.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you would like to select an image for your event',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Photo Library',
          onPress: openImageLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const ImagePicker = await getImagePicker();
    if (!ImagePicker) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Event cover aspect ratio
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `event_image_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openImageLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const ImagePicker = await getImagePicker();
    if (!ImagePicker) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Event cover aspect ratio
        quality: 0.8,
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `event_image_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onImageRemoved,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {value?.uri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value.uri }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.imageAction}
              onPress={showImagePickerOptions}
            >
              <Feather name="edit-2" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageAction}
              onPress={handleRemoveImage}
            >
              <Feather name="trash-2" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadPlaceholder}
          onPress={showImagePickerOptions}
          disabled={isLoading}
        >
          <View style={styles.uploadContent}>
            <View style={styles.uploadIcon}>
              <Feather 
                name={isLoading ? "loader" : "image"} 
                size={32} 
                color={colors.text.secondary} 
              />
            </View>
            <Text style={styles.uploadTitle}>
              {isLoading ? 'Loading...' : 'Add Hero Image'}
            </Text>
            <Text style={styles.uploadSubtitle}>
              Tap to upload a cover image for your event
            </Text>
            <Text style={styles.uploadHint}>
              Recommended: 1600x900 pixels (16:9 ratio)
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(4),
  },
  imageContainer: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface2,
  },
  imageOverlay: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    flexDirection: 'row',
    gap: spacing(2),
  },
  imageAction: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: radii.sm,
    padding: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    marginBottom: spacing(3),
  },
  uploadTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing(1),
  },
  uploadSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing(2),
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});