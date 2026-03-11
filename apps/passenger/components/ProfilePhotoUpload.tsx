import React, { useState } from 'react';
import { View, TouchableOpacity, Image, Text, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { icons } from '@/constants';
import { COLORS, ACTIVITY_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAPI } from '@/lib/fetch';
import type { ImageSourcePropType } from 'react-native';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  userName?: string;
  onPhotoUploaded: (photoUrl: string) => void;
}

export default function ProfilePhotoUpload({ 
  currentPhotoUrl, 
  userName = 'User',
  onPhotoUploaded 
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { apiBaseUrl } = useAuth();

  const showImagePickerOptions = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handleChooseFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('photo', {
        uri,
        type: mimeType,
        name: `profile.${fileExtension}`,
      } as unknown as Blob);

      const data = await fetchAPI('/user/profile-photo', {
        method: 'PATCH',
        body: formData,
      }) as { photoUrl?: string };
      if (data.photoUrl) {
        onPhotoUploaded(data.photoUrl);
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload photo. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=10b981&color=fff&size=200`;
  
  let displayPhotoUrl = defaultAvatarUrl;
  if (currentPhotoUrl) {
    if (currentPhotoUrl.startsWith('http')) {
      displayPhotoUrl = currentPhotoUrl;
    } else {
      displayPhotoUrl = `${apiBaseUrl}${currentPhotoUrl}`;
    }
  }

  return (
    <View className="flex items-center justify-center my-4">
      <TouchableOpacity
        onPress={showImagePickerOptions}
        disabled={uploading}
        className="relative"
      >
        <View className="rounded-full h-[100px] w-[100px] items-center justify-center overflow-hidden border-[3px] border-primary-200">
          <Image
            source={{ uri: displayPhotoUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {uploading && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
            </View>
          )}
        </View>
        
        {/* Camera icon overlay */}
        <View className="absolute bottom-0 right-0 bg-primary-500 rounded-full w-8 h-8 items-center justify-center border-2 border-white">
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Image source={icons.camera as ImageSourcePropType} className="w-4 h-4" tintColor="white" resizeMode="contain" />
          )}
        </View>
      </TouchableOpacity>

      <Text className="text-xs text-neutral-400 font-JakartaMedium mt-2">
        {uploading ? 'Uploading...' : 'Tap to change photo'}
      </Text>
    </View>
  );
}
