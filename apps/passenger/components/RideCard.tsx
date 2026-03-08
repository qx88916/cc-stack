import { icons } from "@/constants";
import { COLORS, SHADOW_SM } from "@/constants/theme";
import { formatDate, formatTime } from "@/lib/utils";
import { Ride } from "@/types/type";
import * as Haptics from 'expo-haptics';
import { useRef, useState } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";

interface RideCardProps {
  ride: Ride;
  onRebook?: (ride: Ride) => void;
  onDetails?: (ride: Ride) => void;
}

const RideCard = ({ ride, onRebook, onDetails }: RideCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setExpanded(!expanded);
    Animated.timing(heightAnim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-primary-100 border-primary-200';
      case 'pending':
        return 'bg-accent-50 border-accent-200';
      default:
        return 'bg-danger-50 border-danger-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-primary-700';
      case 'pending':
        return 'text-accent-700';
      default:
        return 'text-danger-700';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        className="bg-white rounded-2xl mb-4 overflow-hidden"
        style={SHADOW_SM}
      >
        {/* Main Content */}
        <View className="p-4">
          {/* Top Section - Ride Route */}
          <View className="flex-row">
            {/* Map Thumbnail */}
            <View className="relative">
              <Image
                source={{
                  uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${ride.destination_longitude},${ride.destination_latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
                }}
                className="w-24 h-24 rounded-xl"
              />
              {/* Status Badge on Map */}
              <View className={`absolute top-2 left-2 px-2 py-1 rounded-lg ${getStatusColor(ride.payment_status)} border`}>
                <Text className={`text-xs font-JakartaBold ${getStatusTextColor(ride.payment_status)}`}>
                  {ride.payment_status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Route Details */}
            <View className="flex-1 ml-4 justify-between">
              {/* Origin */}
              <View className="flex-row items-start mb-2">
                <View className="w-6 h-6 rounded-full bg-secondary-100 items-center justify-center mr-2">
                  <View className="w-2 h-2 rounded-full bg-secondary-500" />
                </View>
                <Text className="flex-1 text-sm font-JakartaSemiBold text-neutral-800" numberOfLines={1}>
                  {ride.origin_address}
                </Text>
              </View>

              {/* Connecting Line */}
              <View className="ml-2.5 h-6 w-0.5 bg-neutral-200" />

              {/* Destination */}
              <View className="flex-row items-start mt-2">
                <View className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center mr-2">
                  <Image source={icons.point} className="w-3 h-3" tintColor={COLORS.primary} />
                </View>
                <Text className="flex-1 text-sm font-JakartaSemiBold text-neutral-800" numberOfLines={1}>
                  {ride.destination_address}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Info Row */}
          <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-neutral-100">
            <View className="flex-row items-center">
              <Image source={icons.person} className="w-4 h-4 mr-1" tintColor={COLORS.neutral400} />
              <Text className="text-xs font-JakartaMedium text-neutral-600">
                {ride.driver.first_name} {ride.driver.last_name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xs font-JakartaMedium text-neutral-500 mr-1">
                {formatDate(ride.created_at)}
              </Text>
              <Text className="text-xs font-JakartaBold text-neutral-700">
                {formatTime(ride.ride_time)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expanded Details Section */}
        {expanded && (
          <View className="px-4 pb-4 bg-general-500">
            <View className="space-y-3">
              {/* Fare */}
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-sm font-JakartaMedium text-neutral-500">
                  Fare Amount
                </Text>
                <Text className="text-lg font-JakartaBold text-primary-500">
                  FJD ${ride.fare_price}
                </Text>
              </View>

              {/* Driver Details */}
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-sm font-JakartaMedium text-neutral-500">
                  Car Seats
                </Text>
                <Text className="text-sm font-JakartaBold text-neutral-800">
                  {ride.driver.car_seats} seats
                </Text>
              </View>

              {/* Car Image */}
              {ride.driver.car_image_url && (
                <Image
                  source={{ uri: ride.driver.car_image_url }}
                  className="w-full h-24 rounded-xl"
                  resizeMode="cover"
                />
              )}

              {/* Action Buttons */}
              <View className="flex-row space-x-2 mt-2">
                <TouchableOpacity
                  className="flex-1 bg-primary-500 py-3 rounded-2xl"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onRebook?.(ride);
                  }}
                >
                  <Text className="text-white font-JakartaBold text-center text-sm">
                    Rebook
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white border border-neutral-200 py-3 rounded-2xl"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDetails?.(ride);
                  }}
                >
                  <Text className="text-neutral-700 font-JakartaBold text-center text-sm">
                    Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Expand/Collapse Indicator */}
        <View className="items-center py-2 bg-general-500">
          <View className="w-8 h-1 rounded-full bg-neutral-300" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default RideCard;
