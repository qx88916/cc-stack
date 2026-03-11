import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSavedPlacesStore } from '@/store/savedPlacesStore';
import { icons } from '@/constants';
import { COLORS, ACTIVITY_COLOR, SHADOW_SM } from '@/constants/theme';

export default function SavedPlaces() {
  const router = useRouter();
  const { places, isLoading, error, fetchPlaces, deletePlace } = useSavedPlacesStore();

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleAddPlace = (type: 'home' | 'work' | 'custom') => {
    router.push(`/(root)/add-place?type=${type}`);
  };

  const handleEditPlace = (type: string) => {
    router.push(`/(root)/add-place?type=${type}&edit=true`);
  };

  const handleDeletePlace = (type: string, label: string) => {
    Alert.alert(
      'Delete Place',
      `Are you sure you want to delete "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlace(type);
              Alert.alert('Success', 'Place deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete place');
            }
          },
        },
      ]
    );
  };

  const renderPlaceCard = (
    type: 'home' | 'work' | 'custom',
    iconSource: number,
    iconTint: string,
    defaultLabel: string,
    bgColor: string
  ) => {
    const place = places[type];

    return (
      <View className="bg-white rounded-2xl p-4 mb-3" style={SHADOW_SM} key={type}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className={`${bgColor} w-12 h-12 rounded-2xl items-center justify-center mr-3`}>
              <Image source={iconSource} className="w-6 h-6" tintColor={iconTint} resizeMode="contain" />
            </View>
            <View className="flex-1">
              <Text className="font-JakartaBold text-base text-neutral-800 mb-0.5">
                {place ? place.label : defaultLabel}
              </Text>
              {place ? (
                <Text className="text-neutral-500 text-xs font-JakartaMedium" numberOfLines={2}>
                  {place.address}
                </Text>
              ) : (
                <Text className="text-neutral-400 text-xs font-JakartaMedium">Not set</Text>
              )}
            </View>
          </View>

          <View className="flex-row">
            {place ? (
              <>
                <TouchableOpacity
                  onPress={() => handleEditPlace(type)}
                  className="bg-primary-100 px-3 py-2 rounded-xl mr-2"
                >
                  <Text className="text-primary-600 font-JakartaSemiBold text-xs">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePlace(type, place.label)}
                  className="bg-danger-50 px-3 py-2 rounded-xl"
                >
                  <Text className="text-danger-500 font-JakartaSemiBold text-xs">Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => handleAddPlace(type)}
                className="bg-primary-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-JakartaSemiBold text-xs">Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
          <Text className="text-neutral-500 font-JakartaMedium mt-4">Loading saved places...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-lg font-JakartaBold text-neutral-800 mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm font-JakartaMedium text-neutral-500 text-center mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchPlaces}
            className="bg-primary-500 px-8 py-3 rounded-2xl"
          >
            <Text className="text-white font-JakartaBold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4"
            style={SHADOW_SM}
          >
            <Image source={icons.backArrow} className="w-5 h-5" tintColor={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-JakartaBold text-neutral-900">Saved Places</Text>
            <Text className="text-xs font-JakartaMedium text-neutral-500 mt-0.5">
              Quick access to your favorite locations
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View className="mx-5 bg-secondary-100 border border-secondary-200 p-4 rounded-2xl mb-4 flex-row items-start">
          <Image source={icons.info} className="w-4 h-4 mr-2 mt-0.5" tintColor={COLORS.secondary} resizeMode="contain" />
          <Text className="text-secondary-700 text-sm font-JakartaMedium flex-1">
            Save your frequently visited places for faster booking. Tap once on the home screen to book a ride!
          </Text>
        </View>

        {/* Places */}
        <View className="px-5">
          {renderPlaceCard('home', icons.home, COLORS.primary, 'Home', 'bg-primary-100')}
          {renderPlaceCard('work', icons.briefcase, COLORS.secondary, 'Work', 'bg-accent-100')}
        </View>

        {/* Benefits */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-5" style={SHADOW_SM}>
          <Text className="font-JakartaBold text-base text-neutral-800 mb-4">Why save places?</Text>
          {[
            'Book rides with just one tap from the home screen',
            'No need to type addresses repeatedly',
            'Faster checkout for your daily commute',
          ].map((text, i) => (
            <View className="flex-row items-start mb-3" key={i}>
              <Image source={icons.checkmark} className="w-3.5 h-3.5 mr-2 mt-0.5" tintColor={COLORS.primary} resizeMode="contain" />
              <Text className="text-neutral-600 flex-1 text-sm font-JakartaMedium">{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
