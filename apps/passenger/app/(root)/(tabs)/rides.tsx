import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { useRef } from "react";

import RideCard from "@/components/RideCard";
import { PastRidesEmpty, UpcomingRidesEmpty } from "@/components/RideEmptyStates";
import { images, icons } from "@/constants";
import { COLORS, ACTIVITY_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLocationStore } from "@/store/locationStore";
import { Ride } from "@/types/type";

interface RawRide {
  id?: string;
  _id?: string;
  pickup?: {
    description?: string;
    coords?: { latitude?: number; longitude?: number };
  };
  dropoff?: {
    description?: string;
    coords?: { latitude?: number; longitude?: number };
  };
  durationMinutes?: number;
  fare?: number;
  status?: string;
  driver?: {
    id?: number;
    name?: string;
    carImageUrl?: string;
  };
  createdAt?: string;
  scheduledTime?: string;
}

type TabType = 'past' | 'upcoming';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Rides = () => {
  const router = useRouter();
  const { session, apiBaseUrl } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('past');
  const [pastRides, setPastRides] = useState<Ride[]>([]);
  const [upcomingRides, setUpcomingRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchRideHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ride history');
      }

      // Adapt backend response to match frontend Ride type
      const rawRides: RawRide[] = Array.isArray(data) ? data : (data.rides ?? []);
      const adaptedRides: Ride[] = rawRides.map((ride) => {
        const pickupLat = ride.pickup?.coords?.latitude ?? 0;
        const pickupLng = ride.pickup?.coords?.longitude ?? 0;
        const dropoffLat = ride.dropoff?.coords?.latitude ?? 0;
        const dropoffLng = ride.dropoff?.coords?.longitude ?? 0;
        return {
          id: ride.id ?? ride._id ?? '',
          origin_address: ride.pickup?.description ||
            (pickupLat ? `${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}` : 'Unknown'),
          destination_address: ride.dropoff?.description ||
            (dropoffLat ? `${dropoffLat.toFixed(4)}, ${dropoffLng.toFixed(4)}` : 'Unknown'),
          origin_latitude: pickupLat,
          origin_longitude: pickupLng,
          destination_latitude: dropoffLat,
          destination_longitude: dropoffLng,
          ride_time: (ride.durationMinutes ?? 0) * 60,
          fare_price: ride.fare ?? 0,
          payment_status: ride.status === 'completed' ? 'paid' : ride.status === 'cancelled' ? 'cancelled' : 'pending',
          driver_id: ride.driver?.id ?? 0,
          user_id: session?.user?.id ?? '',
          created_at: ride.createdAt ?? new Date().toISOString(),
          scheduled_time: ride.scheduledTime ?? null,
          driver: {
            first_name: ride.driver?.name?.split(' ')[0] ?? 'Driver',
            last_name: ride.driver?.name?.split(' ').slice(1).join(' ') ?? '',
            car_seats: 4,
            car_image_url: ride.driver?.carImageUrl ?? '',
          },
        };
      });

      // Separate past and upcoming rides
      const now = new Date();
      const past = adaptedRides.filter((ride) => {
        if (ride.scheduled_time) {
          return new Date(ride.scheduled_time) < now;
        }
        return ride.payment_status === 'paid' || ride.payment_status === 'cancelled';
      });
      
      const upcoming = adaptedRides.filter((ride) => {
        if (ride.scheduled_time) {
          return new Date(ride.scheduled_time) >= now;
        }
        return ride.payment_status === 'pending';
      });

      setPastRides(past);
      setUpcomingRides(upcoming);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load ride history';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.token) {
      fetchRideHistory();
    }
  }, [session?.token]);

  const onRefresh = () => {
    fetchRideHistory(true);
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Fade out current content
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      
      // Animate tab indicator
      Animated.spring(tabIndicatorPosition, {
        toValue: tab === 'past' ? 0 : 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      
      // Fade in new content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleScheduleRide = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(root)/(tabs)/home");
  };

  const handleRebook = (ride: Ride) => {
    // Prefill destination from the past ride and navigate to find-ride
    useLocationStore.getState().setDestinationLocation({
      latitude: ride.destination_latitude,
      longitude: ride.destination_longitude,
      address: ride.destination_address,
    });
    router.push("/(root)/find-ride");
  };

  const handleDetails = (ride: Ride) => {
    router.push(`/(root)/trip-complete?rideId=${ride.id}`);
  };

  const currentRides = activeTab === 'past' ? pastRides : upcomingRides;

  // Tab indicator translation
  const indicatorTranslateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2],
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="px-5 pt-3 pb-4">
          <Text className="text-2xl font-JakartaBold text-neutral-900">Rides</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
          <Text className="text-base font-JakartaMedium text-neutral-500 mt-4">
            Loading your rides...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="px-5 pt-3 pb-4">
          <Text className="text-2xl font-JakartaBold text-neutral-900">Rides</Text>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <Image source={images.noResult} className="w-40 h-40" resizeMode="contain" />
          <Text className="text-lg font-JakartaBold text-neutral-800 mt-4">
            Could not load rides
          </Text>
          <Text className="text-sm font-JakartaMedium text-neutral-500 mt-2 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="mt-6 bg-primary-500 px-8 py-4 rounded-2xl"
          >
            <Text className="text-white font-JakartaBold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      {/* Header */}
      <View className="px-5 pt-3 pb-4">
        <Text className="text-2xl font-JakartaBold text-neutral-900">Rides</Text>
      </View>

      {/* Tab Switcher */}
      <View className="px-5 pb-2">
        <View className="bg-white rounded-2xl p-1 flex-row relative">
          <Animated.View
            style={{
              transform: [{ translateX: indicatorTranslateX }],
              width: (SCREEN_WIDTH - 40 - 8) / 2,
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              backgroundColor: COLORS.primary,
              borderRadius: 14,
            }}
          />
          
          <TouchableOpacity
            onPress={() => handleTabChange('past')}
            className="flex-1 py-3 items-center justify-center rounded-xl"
            activeOpacity={0.7}
          >
            <Text 
              className={`font-JakartaBold text-sm ${
                activeTab === 'past' ? 'text-white' : 'text-neutral-500'
              }`}
            >
              Past
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('upcoming')}
            className="flex-1 py-3 items-center justify-center rounded-xl"
            activeOpacity={0.7}
          >
            <Text 
              className={`font-JakartaBold text-sm ${
                activeTab === 'upcoming' ? 'text-white' : 'text-neutral-500'
              }`}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area */}
      <Animated.View 
        className="flex-1"
        style={{ opacity: fadeAnim }}
      >
        {currentRides.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            {activeTab === 'past' ? (
              // Past Rides Empty State
              <>
                <View className="items-center mb-6">
                  {/* 3D Illustration Placeholder - Person with luggage */}
                  <View className="w-48 h-48 items-center justify-center mb-4">
                    <Text className="text-8xl">🧳</Text>
                    <Text className="text-6xl absolute bottom-8">🙋‍♂️</Text>
                  </View>
                </View>
                <Text className="text-xl font-JakartaBold text-neutral-800 text-center mb-3">
                  You don't have any rides yet
                </Text>
                <Text className="text-base font-JakartaMedium text-neutral-500 text-center leading-6">
                  Your completed and cancelled rides will appear here
                </Text>
              </>
            ) : (
              // Upcoming Rides Empty State
              <>
                <View className="items-center mb-6">
                  {/* 3D Illustration Placeholder - Calendar with clock */}
                  <View className="w-48 h-48 items-center justify-center mb-4 relative">
                    <Text className="text-9xl">📅</Text>
                    <View className="absolute bottom-12 right-12 bg-white rounded-full p-2 shadow-lg">
                      <Text className="text-4xl">🕐</Text>
                    </View>
                  </View>
                </View>
                <Text className="text-xl font-JakartaBold text-neutral-800 text-center mb-3">
                  No upcoming rides
                </Text>
                <Text className="text-base font-JakartaMedium text-neutral-500 text-center leading-6 mb-6">
                  Whatever is on your schedule, a Scheduled Ride can get you there on time
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="mb-8"
                >
                  <Text className="text-base font-JakartaSemiBold text-primary-600">
                    Learn how it works
                  </Text>
                </TouchableOpacity>

                {/* Schedule Ride Button */}
                <TouchableOpacity
                  onPress={handleScheduleRide}
                  className="bg-primary-500 py-4 px-12 rounded-2xl shadow-lg shadow-primary-500/30"
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-JakartaBold text-base">
                    Schedule a ride
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          // Rides List
          <FlatList
            data={currentRides}
            renderItem={({ item }) => (
              <RideCard
                ride={item}
                onRebook={handleRebook}
                onDetails={handleDetails}
              />
            )}
            keyExtractor={(item) => item.id}
            className="px-5"
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[ACTIVITY_COLOR]}
                tintColor={ACTIVITY_COLOR}
              />
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default Rides;
