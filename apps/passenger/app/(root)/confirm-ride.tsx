import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import FareBreakdown from "@/components/FareBreakdown";
import RideLayout from "@/components/RideLayout";
import { ACTIVITY_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocationStore } from "@/store/locationStore";
import { useRideStore } from "@/store/rideStore";

const ConfirmRide = () => {
  const { userLocation, destinationLocation } = useLocationStore();
  const { fareEstimate, setFareEstimate } = useRideStore();
  const { session, apiBaseUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    // Auto-fetch fare estimate when screen loads
    if (userLocation && destinationLocation && !fareEstimate) {
      fetchFareEstimate();
    }
  }, []);

  const fetchFareEstimate = async () => {
    if (!userLocation || !destinationLocation) {
      Alert.alert("Error", "Please select pickup and drop-off locations");
      return;
    }

    setEstimating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/ride/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: {
            coords: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
          },
          dropoff: {
            coords: {
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            },
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle geofence errors specifically
        if (data.code?.includes('OUT_OF_SERVICE_AREA')) {
          const message = data.nearestArea
            ? `${data.message}\n\nNearest service area: ${data.nearestArea} (${data.distanceKm} km away)`
            : data.message;
          Alert.alert("Out of Service Area", message);
          return;
        }
        throw new Error(data.message || "Failed to estimate fare");
      }

      setFareEstimate({
        fare: data.amount || data.fare, // Support both old and new response format
        currency: data.currency || "USD",
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        breakdown: data.breakdown,
        polyline: data.polyline,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not estimate fare";
      Alert.alert("Error", message);
    } finally {
      setEstimating(false);
    }
  };

  const handleRequestRide = () => {
    if (!fareEstimate) {
      Alert.alert("Error", "Please wait for fare estimate");
      return;
    }
    router.push("/(root)/book-ride");
  };

  return (
    <RideLayout title="Confirm Ride">
      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Pickup Location */}
        <View className="mb-4">
          <Text className="text-sm font-JakartaMedium text-neutral-400 mb-1">
            Pickup
          </Text>
          <Text className="text-base font-JakartaSemiBold text-neutral-800">
            {userLocation?.address || "Not selected"}
          </Text>
        </View>

        {/* Dropoff Location */}
        <View className="mb-6">
          <Text className="text-sm font-JakartaMedium text-neutral-400 mb-1">
            Drop-off
          </Text>
          <Text className="text-base font-JakartaSemiBold text-neutral-800">
            {destinationLocation?.address || "Not selected"}
          </Text>
        </View>

        {/* Fare Estimate */}
        {estimating ? (
          <View className="flex-row items-center justify-center py-8">
            <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
            <Text className="ml-3 text-base font-JakartaMedium text-gray-600">
              Calculating fare...
            </Text>
          </View>
        ) : fareEstimate ? (
          <>
            {/* Show breakdown if available, otherwise show simple estimate */}
            {fareEstimate.breakdown ? (
              <FareBreakdown
                breakdown={fareEstimate.breakdown}
                currency={fareEstimate.currency}
                distanceKm={fareEstimate.distanceKm}
                durationMinutes={fareEstimate.durationMinutes}
              />
            ) : (
              <View className="bg-primary-50 rounded-xl p-4 mb-6 border border-primary-100">
                <Text className="text-sm font-JakartaMedium text-gray-600 mb-2">
                  Estimated Fare
                </Text>
                <Text className="text-3xl font-JakartaBold text-primary-500">
                  FJD ${fareEstimate.fare.toFixed(2)}
                </Text>
                <View className="flex-row items-center mt-3 space-x-4">
                  <Text className="text-sm font-JakartaMedium text-gray-600">
                    {fareEstimate.distanceKm.toFixed(1)} km
                  </Text>
                  <Text className="text-sm font-JakartaMedium text-gray-600">
                    • {fareEstimate.durationMinutes} min
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="flex-row items-center justify-center py-8">
            <Text className="text-base font-JakartaMedium text-gray-500">
              No estimate available
            </Text>
          </View>
        )}

        {/* Payment Method */}
        {fareEstimate && (
          <View className="bg-white rounded-xl p-4 mb-4 border border-neutral-100">
            <Text className="text-sm font-JakartaMedium text-neutral-400 mb-2">
              Payment Method
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-secondary-100 items-center justify-center mr-3">
                <Text className="text-lg">💵</Text>
              </View>
              <View>
                <Text className="text-base font-JakartaSemiBold text-neutral-800">
                  Cash
                </Text>
                <Text className="text-xs font-JakartaMedium text-neutral-400">
                  Pay driver directly
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="mt-6 mb-8">
          {!fareEstimate && !estimating && (
            <CustomButton
              title="Get Fare Estimate"
              onPress={fetchFareEstimate}
              className="mb-3 bg-secondary-500"
            />
          )}
          
          <CustomButton
            title={loading ? "Requesting..." : "Request Ride"}
            onPress={handleRequestRide}
            disabled={loading || !fareEstimate}
            className="bg-primary-500"
          />
        </View>
      </ScrollView>
    </RideLayout>
  );
};

export default ConfirmRide;
