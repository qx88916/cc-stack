/**
 * Trip Completion Screen - Shows ride receipt after completion
 * Displays fare breakdown, driver info, and rating option
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { icons, images } from "@/constants";
import { COLORS, ACTIVITY_COLOR, SHADOW_SM, SHADOW_MD } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, formatTime } from "@/lib/utils";
import FareBreakdown from "@/components/FareBreakdown";
import { FareBreakdown as FareBreakdownType } from "@/store/rideStore";

interface RideDetail {
  id: string;
  pickup: { description?: string; coords?: { latitude: number; longitude: number } };
  dropoff: { description?: string; coords?: { latitude: number; longitude: number } };
  fare: number;
  fareBreakdown?: FareBreakdownType;
  currency?: string;
  distanceKm?: number;
  durationMinutes?: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  driver?: {
    id?: string;
    name?: string;
    rating?: number;
    vehicle?: string;
    plateNumber?: string;
    profileImage?: string;
  };
}

const TripComplete = () => {
  const router = useRouter();
  const { session, apiBaseUrl } = useAuth();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId]);

  const fetchRideDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/ride/${rideId}`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ride details');
      }

      setRide(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not load ride details';
      Alert.alert('Error', message, [
        { text: 'OK', onPress: () => router.replace('/(root)/(tabs)/home') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/ride/${rideId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit rating');
      }

      Alert.alert('Thank You!', 'Your rating has been submitted.', [
        { text: 'OK', onPress: () => router.replace('/(root)/(tabs)/home') },
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not submit rating';
      Alert.alert('Error', message);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
          <Text className="text-base font-JakartaMedium text-neutral-500 mt-4">
            Loading trip details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center px-5">
          <Image source={images.noResult} className="w-40 h-40" resizeMode="contain" />
          <Text className="text-lg font-JakartaBold text-neutral-800 mt-4">
            Trip not found
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(root)/(tabs)/home')}
            className="mt-6"
          >
            <Text className="text-base font-JakartaSemiBold text-primary-500">
              Go to Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const driver = ride.driver;

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View className="items-center py-10 bg-primary-500 rounded-b-3xl" style={SHADOW_MD}>
          <View className="w-20 h-20 rounded-3xl bg-white/20 items-center justify-center mb-4">
            <Image source={icons.checkmark} className="w-10 h-10" tintColor="white" />
          </View>
          <Text className="text-2xl font-JakartaBold text-white">
            Trip Completed!
          </Text>
          <Text className="text-sm font-JakartaMedium text-primary-200 mt-2">
            Thank you for riding with us
          </Text>
        </View>

        <View className="px-5 py-6">
          {/* Driver Card */}
          {driver && (
            <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
              <Text className="text-base font-JakartaBold text-neutral-800 mb-4">
                Your Driver
              </Text>
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: driver.profileImage || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name || 'Driver')}`,
                  }}
                  className="w-14 h-14 rounded-2xl"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-base font-JakartaSemiBold text-neutral-800">
                    {driver.name || 'Driver'}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Image source={icons.star} className="w-4 h-4 mr-1" tintColor="#fbbf24" />
                    <Text className="text-sm font-JakartaMedium text-neutral-600">
                      {driver.rating?.toFixed(1) || '5.0'}
                    </Text>
                  </View>
                  <Text className="text-xs font-JakartaMedium text-neutral-500 mt-1">
                    {driver.vehicle} • {driver.plateNumber}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Trip Details Card */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
            <Text className="text-base font-JakartaBold text-neutral-800 mb-4">
              Trip Details
            </Text>
            
            {/* Pickup */}
            <View className="flex-row items-start mb-3">
              <View className="w-6 h-6 rounded-full bg-secondary-100 items-center justify-center mr-3">
                <View className="w-2 h-2 rounded-full bg-secondary-500" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-JakartaMedium text-neutral-400">PICKUP</Text>
                <Text className="text-sm font-JakartaSemiBold text-neutral-800 mt-0.5">
                  {ride.pickup?.description || 'Pickup location'}
                </Text>
              </View>
            </View>

            <View className="ml-2.5 h-4 w-0.5 bg-neutral-200" />

            {/* Dropoff */}
            <View className="flex-row items-start mb-4">
              <View className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center mr-3">
                <Image source={icons.point} className="w-3 h-3" tintColor={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-JakartaMedium text-neutral-400">DROPOFF</Text>
                <Text className="text-sm font-JakartaSemiBold text-neutral-800 mt-0.5">
                  {ride.dropoff?.description || 'Dropoff location'}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row justify-between border-t border-neutral-100 pt-4">
              <View className="items-center">
                <Text className="text-xs font-JakartaMedium text-neutral-400">DISTANCE</Text>
                <Text className="text-sm font-JakartaBold text-neutral-800 mt-1">
                  {ride.distanceKm?.toFixed(1) || '0.0'} km
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs font-JakartaMedium text-neutral-400">TIME</Text>
                <Text className="text-sm font-JakartaBold text-neutral-800 mt-1">
                  {formatTime((ride.durationMinutes || 0) * 60)}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs font-JakartaMedium text-neutral-400">DATE</Text>
                <Text className="text-sm font-JakartaBold text-neutral-800 mt-1">
                  {formatDate(ride.completedAt || ride.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Fare Breakdown Card */}
          {ride.fareBreakdown ? (
            <View className="mb-4">
              <FareBreakdown
                breakdown={ride.fareBreakdown}
                currency={ride.currency || 'FJD'}
                distanceKm={ride.distanceKm}
                durationMinutes={ride.durationMinutes}
              />
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
              <Text className="text-base font-JakartaBold text-neutral-800 mb-4">Fare</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-JakartaBold text-neutral-800">Total</Text>
                <Text className="text-xl font-JakartaBold text-primary-500">
                  {ride.currency || 'FJD'} ${ride.fare?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Method Card */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
            <Text className="text-base font-JakartaBold text-neutral-800 mb-3">
              Payment Method
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-secondary-100 items-center justify-center mr-3">
                <Text className="text-lg">💵</Text>
              </View>
              <View>
                <Text className="text-base font-JakartaSemiBold text-neutral-800">
                  {ride.paymentMethod === 'mpaisa' ? 'M-PAiSA' : 'Cash'}
                </Text>
                <Text className="text-xs font-JakartaMedium text-neutral-400">
                  {ride.paymentMethod === 'mpaisa' ? 'Paid via M-PAiSA' : 'Pay driver directly'}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating Section */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={SHADOW_SM}>
            <Text className="text-base font-JakartaBold text-neutral-800 mb-2">
              Rate Your Trip
            </Text>
            <Text className="text-sm font-JakartaMedium text-neutral-500 mb-4">
              How was your experience with {driver?.name || 'your driver'}?
            </Text>

            <View className="flex-row justify-center space-x-4 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  className="p-2"
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  accessibilityState={{ selected: star <= rating }}
                >
                  <Image
                    source={icons.star}
                    className="w-10 h-10"
                    tintColor={star <= rating ? '#fbbf24' : '#e5e5e5'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={submitRating}
              disabled={submittingRating || rating === 0}
              className={`w-full py-4 rounded-2xl items-center justify-center ${
                rating === 0 ? 'bg-neutral-200' : 'bg-primary-500'
              }`}
            >
              {submittingRating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className={`text-base font-JakartaBold ${
                  rating === 0 ? 'text-neutral-400' : 'text-white'
                }`}>
                  Submit Rating
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={() => router.replace('/(root)/(tabs)/home')}
            className="w-full py-4 rounded-2xl border-2 border-primary-500 items-center justify-center mb-4"
          >
            <Text className="text-base font-JakartaBold text-primary-600">
              Book Another Ride
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TripComplete;
