import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";

import Payment from "@/components/Payment";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { COLORS, ACTIVITY_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { fetchAPI } from "@/lib/fetch";
import { formatTime } from "@/lib/utils";
import { useLocationStore } from "@/store/locationStore";
import { useRideStore, ActiveRide } from "@/store/rideStore";

interface DriverLocation {
  latitude: number;
  longitude: number;
}

const BookRide = () => {
  const router = useRouter();
  const { session, apiBaseUrl } = useAuth();
  const { socket, connected, reconnecting, didReconnect } = useSocket();
  const { userLocation, destinationLocation } = useLocationStore();
  const { fareEstimate, activeRide, setActiveRide, recoverActiveRide } = useRideStore();
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  // Listen for Socket events
  useEffect(() => {
    if (!socket || !connected) {
      return;
    }

    const handleDriverAssigned = (data: { driver: ActiveRide['driver'] }) => {
      setActiveRide({
        ...activeRide!,
        status: 'accepted',
        driver: data.driver,
      });
    };

    const handleNoDrivers = () => {
      Alert.alert(
        'No Drivers Available',
        'There are no drivers nearby right now. We\'ll keep searching.',
        [{ text: 'OK' }]
      );
    };

    const handleRideUpdate = (data: { rideId: string; status: ActiveRide['status']; driver?: ActiveRide['driver'] }) => {
      if (data.rideId === activeRide?.id) {
        if (data.status === 'completed') {
          router.replace(`/(root)/trip-complete?rideId=${data.rideId}`);
          return;
        }

        if (data.status === 'cancelled') {
          setActiveRide(null);
          Alert.alert(
            'Ride Cancelled',
            'Your driver has cancelled the ride. Please try booking again.',
            [{ text: 'OK', onPress: () => router.replace('/(root)/(tabs)/home') }]
          );
          return;
        }

        setActiveRide({
          ...activeRide,
          status: data.status,
          driver: data.driver || activeRide.driver,
        });
      }
    };

    const handleDriverLocation = (data: { rideId: string; latitude: number; longitude: number }) => {
      if (data.rideId === activeRide?.id) {
        setDriverLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    };

    socket.on('ride:driver_assigned', handleDriverAssigned);
    socket.on('ride:no_drivers', handleNoDrivers);
    socket.on('ride:update', handleRideUpdate);
    socket.on('driver:location', handleDriverLocation);

    // Cleanup
    return () => {
      socket.off('ride:driver_assigned', handleDriverAssigned);
      socket.off('ride:no_drivers', handleNoDrivers);
      socket.off('ride:update', handleRideUpdate);
      socket.off('driver:location', handleDriverLocation);
    };
  }, [socket, connected, activeRide]);

  useEffect(() => {
    if (didReconnect && activeRide?.id && session?.token && apiBaseUrl) {
      recoverActiveRide(apiBaseUrl, session.token);
    }
  }, [didReconnect]);

  useEffect(() => {
    if (!activeRide && fareEstimate && userLocation && destinationLocation) {
      requestRide();
    }
  }, []);

  const requestRide = async () => {
    if (!userLocation || !destinationLocation || !fareEstimate) {
      Alert.alert("Error", "Missing ride information");
      router.back();
      return;
    }

    setRequesting(true);
    try {
      // Generate idempotency key for this request (prevents duplicates on retry)
      const idempotencyKey = `${session?.user?.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const data = await fetchAPI("/ride/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          pickup: {
            id: userLocation.address,
            description: userLocation.address,
            coords: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
          },
          dropoff: {
            id: destinationLocation.address,
            description: destinationLocation.address,
            coords: {
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            },
          },
          fare: fareEstimate.fare,
          distanceKm: fareEstimate.distanceKm,
          durationMinutes: fareEstimate.durationMinutes,
          paymentMethod: "cash",
        }),
      }) as Record<string, unknown>;

      // Set active ride
      setActiveRide({
        id: data.id || data.ride?.id,
        status: data.status || 'searching',
        pickup: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: userLocation.address,
        },
        dropoff: {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          address: destinationLocation.address,
        },
        fare: data.fare || fareEstimate.fare,
        currency: data.currency || "USD",
        distanceKm: data.distanceKm || fareEstimate.distanceKm,
        durationMinutes: data.durationMinutes || fareEstimate.durationMinutes,
        createdAt: data.createdAt || new Date().toISOString(),
        driver: data.driver,
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not request ride";
      Alert.alert("Error", message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setRequesting(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide?.id) return;

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? You may be charged a cancellation fee.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await fetchAPI(`/ride/${activeRide.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Cancelled by passenger' }),
              });

              // Clear active ride and driver location
              setActiveRide(null);
              setDriverLocation(null);
              Alert.alert('Ride Cancelled', 'Your ride has been cancelled.', [
                { text: 'OK', onPress: () => router.replace('/(root)/(tabs)/home') },
              ]);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Could not cancel ride';
              Alert.alert('Error', message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  // Show loading state while requesting ride
  if (requesting) {
    return (
      <RideLayout title="Requesting Ride">
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
          <Text className="text-lg font-JakartaMedium text-neutral-500 mt-4">
            Finding a driver for you...
          </Text>
        </View>
      </RideLayout>
    );
  }

  // Show waiting state if ride is pending (no driver yet)
  if (activeRide && activeRide.status === "pending" && !activeRide.driver) {
    return (
      <RideLayout title="Finding Driver">
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
          <Text className="text-xl font-JakartaBold text-neutral-800 mt-4">
            Looking for nearby drivers...
          </Text>
          <Text className="text-sm font-JakartaMedium text-neutral-500 mt-2 text-center px-10">
            We'll notify you as soon as a driver accepts your ride
          </Text>
          
          <View className="mt-8 bg-primary-100 rounded-2xl p-4 border border-primary-200">
            <Text className="text-sm font-JakartaMedium text-neutral-500">
              Estimated Fare
            </Text>
            <Text className="text-2xl font-JakartaBold text-primary-500 mt-1">
              FJD ${activeRide.fare.toFixed(2)}
            </Text>
          </View>
        </View>
      </RideLayout>
    );
  }

  // Show driver details if driver has accepted
  const driver = activeRide?.driver;

  return (
    <RideLayout title="Ride Confirmed" driverLocation={driverLocation}>
      <>
        {reconnecting && (
          <View className="bg-accent-500 py-2 px-4 rounded-xl mb-3 flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="text-white font-JakartaMedium text-sm ml-2">
              Reconnecting...
            </Text>
          </View>
        )}

        <Text className="text-xl font-JakartaSemiBold mb-3">
          {activeRide?.status === "accepted" ? "Your Driver is on the way!" : "Ride Information"}
        </Text>

        {driver ? (
          <View className="flex flex-col w-full items-center justify-center mt-10">
            <Image
              source={{ 
                uri: driver.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(driver.name) 
              }}
              className="w-28 h-28 rounded-full"
            />

            <View className="flex flex-row items-center justify-center mt-5 space-x-2">
              <Text className="text-lg font-JakartaSemiBold">
                {driver.name}
              </Text>

              <View className="flex flex-row items-center space-x-0.5">
                <Image
                  source={icons.star}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-lg font-JakartaRegular">
                  {driver.rating?.toFixed(1) || "5.0"}
                </Text>
              </View>
            </View>

            <Text className="text-base font-JakartaMedium text-neutral-500 mt-2">
              {driver.vehicle} • {driver.plateNumber}
            </Text>
          </View>
        ) : (
          <View className="flex flex-col w-full items-center justify-center mt-10">
            <ActivityIndicator size="large" color={ACTIVITY_COLOR} />
            <Text className="text-base font-JakartaMedium text-neutral-500 mt-4">
              Waiting for driver...
            </Text>
          </View>
        )}

        <View className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-2xl bg-primary-50 border border-primary-100 mt-5">
          <View className="flex flex-row items-center justify-between w-full border-b border-primary-100 py-3">
            <Text className="text-base font-JakartaMedium text-neutral-600">Ride Price</Text>
            <Text className="text-base font-JakartaBold text-primary-500">
              FJD ${activeRide?.fare.toFixed(2) || fareEstimate?.fare.toFixed(2) || "0.00"}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between w-full border-b border-primary-100 py-3">
            <Text className="text-base font-JakartaMedium text-neutral-600">Estimated Time</Text>
            <Text className="text-base font-JakartaSemiBold text-neutral-800">
              {formatTime((activeRide?.durationMinutes || fareEstimate?.durationMinutes || 0) * 60)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between w-full py-3">
            <Text className="text-base font-JakartaMedium text-neutral-600">Distance</Text>
            <Text className="text-base font-JakartaSemiBold text-neutral-800">
              {(activeRide?.distanceKm || fareEstimate?.distanceKm || 0).toFixed(1)} km
            </Text>
          </View>
        </View>

        <View className="flex flex-col w-full items-start justify-center mt-5">
          <View className="flex flex-row items-center justify-start mt-3 border-t border-b border-general-700 w-full py-3">
            <Image source={icons.to} className="w-6 h-6" />
            <Text className="text-lg font-JakartaRegular ml-2">
              {activeRide?.pickup.address || userLocation?.address || "Pickup location"}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-start border-b border-general-700 w-full py-3">
            <Image source={icons.point} className="w-6 h-6" />
            <Text className="text-lg font-JakartaRegular ml-2">
              {activeRide?.dropoff.address || destinationLocation?.address || "Drop-off location"}
            </Text>
          </View>
        </View>

        {activeRide && activeRide.status !== 'completed' && activeRide.status !== 'cancelled' && (
          <View className="w-full mt-5">
            <TouchableOpacity
              onPress={cancelRide}
              disabled={cancelling}
              accessibilityRole="button"
              accessibilityLabel="Cancel ride"
              accessibilityState={{ disabled: cancelling }}
              className={`w-full py-4 rounded-2xl border-2 border-danger-400 items-center justify-center ${
                cancelling ? 'opacity-50' : ''
              }`}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <Text className="text-base font-JakartaBold text-danger-500">
                  Cancel Ride
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Payment
          fullName={session?.user?.name || "Passenger"}
          email={session?.user?.email || ""}
          amount={activeRide?.fare.toFixed(2) || fareEstimate?.fare.toFixed(2) || "0"}
          driverId={driver?.id ? parseInt(driver.id) : 0}
          rideTime={(activeRide?.durationMinutes || fareEstimate?.durationMinutes || 0) * 60}
        />
      </>
    </RideLayout>
  );
};

export default BookRide;
