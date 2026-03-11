import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useSavedPlacesStore, type SavedPlace } from '@/store/savedPlacesStore';
import InputField from '@/components/InputField';
import { icons } from '@/constants';
import { COLORS, SHADOW_SM } from '@/constants/theme';

export default function AddPlace() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; edit?: string }>();
  const { places, setPlace } = useSavedPlacesStore();
  
  const [loading, setLoading] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const placeType = params.type as 'home' | 'work' | 'custom' || 'custom';
  const isEdit = params.edit === 'true';
  const existingPlace = places[placeType];

  useEffect(() => {
    if (isEdit && existingPlace) {
      setCustomLabel(existingPlace.label);
      setSelectedLocation({
        address: existingPlace.address,
        latitude: existingPlace.latitude,
        longitude: existingPlace.longitude,
      });
    }
  }, [isEdit, existingPlace]);

  const getPlaceLabel = () => {
    if (placeType === 'home') return 'Home';
    if (placeType === 'work') return 'Work';
    return customLabel || 'Custom Place';
  };

  const getPlaceIconSource = () => {
    if (placeType === 'home') return icons.home;
    if (placeType === 'work') return icons.briefcase;
    return icons.pin;
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    if (placeType === 'custom' && !customLabel.trim()) {
      Alert.alert('Error', 'Please enter a name for this place');
      return;
    }

    setLoading(true);
    try {
      const place: SavedPlace = {
        type: placeType,
        label: getPlaceLabel(),
        address: selectedLocation.address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };

      await setPlace(placeType, place);

      Alert.alert(
        'Success',
        `${getPlaceLabel()} has been ${isEdit ? 'updated' : 'saved'} successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving place:', error);
      Alert.alert('Error', 'Failed to save place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4"
            style={SHADOW_SM}
          >
            <Image source={icons.backArrow} className="w-5 h-5" tintColor={COLORS.textPrimary} />
          </TouchableOpacity>
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-xl bg-primary-100 items-center justify-center mr-3">
              <Image source={getPlaceIconSource()} className="w-5 h-5" tintColor={COLORS.primary} resizeMode="contain" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-JakartaBold text-neutral-900">
                {isEdit ? 'Edit' : 'Add'} {placeType === 'custom' ? 'Place' : getPlaceLabel()}
              </Text>
              <Text className="text-xs font-JakartaMedium text-neutral-500 mt-0.5">
                {isEdit ? 'Update' : 'Set'} your {placeType === 'custom' ? 'favorite location' : `${placeType} location`}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5">
          {/* Custom Label Input */}
          {placeType === 'custom' && (
            <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
              <InputField
                label="Place Name"
                placeholder="e.g., Mom's House, Gym, Favorite Restaurant"
                icon={icons.pin}
                value={customLabel}
                onChangeText={setCustomLabel}
              />
            </View>
          )}

          {/* Google Places Autocomplete */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
            <Text className="font-JakartaBold text-sm text-neutral-800 mb-3">
              Search for Address
            </Text>
            <View className="border border-neutral-200 rounded-2xl overflow-hidden">
              <GooglePlacesAutocomplete
                fetchDetails={true}
                placeholder={existingPlace?.address || "Enter address"}
                onPress={(data, details = null) => {
                  if (details) {
                    setSelectedLocation({
                      address: data.description,
                      latitude: details.geometry.location.lat,
                      longitude: details.geometry.location.lng,
                    });
                  }
                }}
                query={{
                  key: process.env.EXPO_PUBLIC_PLACES_API_KEY,
                  language: 'en',
                }}
                styles={{
                  textInput: {
                    backgroundColor: COLORS.neutral50,
                    fontSize: 15,
                    fontFamily: 'Jakarta-Medium',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  },
                  listView: {
                    backgroundColor: 'white',
                  },
                }}
                enablePoweredByContainer={false}
                textInputProps={{
                  placeholderTextColor: '#9ca3af',
                }}
              />
            </View>
          </View>

          {/* Selected Location Display */}
          {selectedLocation && (
            <View className="bg-primary-100 border border-primary-200 p-4 rounded-2xl mb-4">
              <Text className="font-JakartaBold text-sm text-primary-900 mb-1">
                Selected Location:
              </Text>
              <Text className="text-primary-800 text-sm font-JakartaMedium">
                {selectedLocation.address}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || !selectedLocation}
            className={`py-4 rounded-2xl ${
              loading || !selectedLocation ? 'bg-neutral-300' : 'bg-primary-500'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-JakartaBold text-center text-base">
                {isEdit ? 'Update' : 'Save'} Place
              </Text>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View className="mt-4 bg-secondary-100 border border-secondary-200 p-4 rounded-2xl flex-row items-start">
            <Image source={icons.info} className="w-4 h-4 mr-2 mt-0.5" tintColor={COLORS.secondary} resizeMode="contain" />
            <Text className="text-secondary-700 text-sm font-JakartaMedium flex-1">
              After saving, you can quickly book rides to this location with just one tap from your home screen.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
