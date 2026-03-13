import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";

import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
  startLocationTracking,
  stopLocationTracking,
  sendCurrentLocation,
} from "@/services/locationTracking";

interface RideRequest {
  rideId: string;
  distance: number;
  pickup: { latitude: number; longitude: number };
  fare?: number;
  passengerName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

type RideStatus =
  | "accepted"
  | "arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

interface ActiveRide {
  id: string;
  status: RideStatus;
  fare: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  pickup: {
    description?: string;
    coords?: { latitude: number; longitude: number };
  };
  dropoff: {
    description?: string;
    coords?: { latitude: number; longitude: number };
  };
  passenger?: { id: string; name: string; phone: string };
}

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    next: RideStatus;
    buttonLabel: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  accepted: {
    label: "Navigate to Pickup",
    next: "arrived",
    buttonLabel: "I've Arrived",
    color: "bg-blue-500",
    icon: "navigate",
  },
  arrived: {
    label: "Waiting for Passenger",
    next: "in_progress",
    buttonLabel: "Start Trip",
    color: "bg-yellow-500",
    icon: "time",
  },
  in_progress: {
    label: "Trip in Progress",
    next: "completed",
    buttonLabel: "Complete Trip",
    color: "bg-green-500",
    icon: "checkmark-circle",
  },
};

const RIDE_REQUEST_TIMEOUT_MS = 30_000;

const openMapsNavigation = (
  coords: { latitude: number; longitude: number } | undefined,
  label: string
) => {
  if (!coords) return;
  const { latitude, longitude } = coords;
  const url =
    Platform.OS === "ios"
      ? `maps://app?daddr=${latitude},${longitude}&dirflg=d`
      : `google.navigation:q=${latitude},${longitude}`;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

  Linking.canOpenURL(url)
    .then((supported) => Linking.openURL(supported ? url : fallback))
    .catch(() => Linking.openURL(fallback));
};

const Home = () => {
  const { session, apiBaseUrl } = useAuth();
  const { socket, connected, reconnecting } = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomingRide, setIncomingRide] = useState<RideRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState(30);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.token}`,
  };

  const playRideSound = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer({
        uri: "https://www.soundjay.com/buttons/sounds/beep-01a.mp3",
      });
      player.volume = 1.0;
      playerRef.current = player;
      player.play();
    } catch {
      // Non-critical; vibration still fires
    }
  };

  const stopRideSound = () => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.release();
        playerRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const clearRideTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    timeoutRef.current = null;
    tickRef.current = null;
  };

  const fetchAvailability = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${apiBaseUrl}/driver/availability`, { headers });
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setIsOnline(data.isOnline);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not load availability";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, session?.token]);

  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/driver/ride/active`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ride) {
        setActiveRide({
          id: data.ride.id,
          status: data.ride.status,
          fare: data.ride.fare,
          currency: data.ride.currency || "FJD",
          distanceKm: data.ride.distanceKm,
          durationMinutes: data.ride.durationMinutes,
          pickup: data.ride.pickup,
          dropoff: data.ride.dropoff,
          passenger: data.ride.passenger,
        });
      }
    } catch {
      // non-critical
    }
  }, [apiBaseUrl, session?.token]);

  useEffect(() => {
    fetchAvailability();
    fetchActiveRide();
  }, [fetchAvailability, fetchActiveRide]);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      stopRideSound();
      clearRideTimeout();
    };
  }, []);

  const startRideRequestTimer = () => {
    setTimeoutRemaining(30);
    clearRideTimeout();

    tickRef.current = setInterval(() => {
      setTimeoutRemaining((prev) => {
        if (prev <= 1) {
          clearRideTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      setIncomingRide(null);
      clearRideTimeout();
      stopRideSound();
    }, RIDE_REQUEST_TIMEOUT_MS);
  };

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const goingOnline = !isOnline;
      const res = await fetch(`${apiBaseUrl}/driver/availability`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isOnline: goingOnline }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update status");
      }
      const data = await res.json();
      setIsOnline(data.isOnline);

      if (data.isOnline) {
        const started = await startLocationTracking();
        if (started && session?.token) {
          sendCurrentLocation(apiBaseUrl, session.token);
        }
        if (!started) {
          Alert.alert(
            "Location Permission",
            "Background location is needed to receive ride requests. Please grant permission in settings."
          );
        }
      } else {
        await stopLocationTracking();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not update status";
      Alert.alert("Error", msg);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (!socket || !connected || !isOnline) return;

    const handleRideRequest = (data: RideRequest) => {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
      playRideSound();
      setIncomingRide(data);
      startRideRequestTimer();
    };

    socket.on("ride:request", handleRideRequest);
    return () => {
      socket.off("ride:request", handleRideRequest);
      clearRideTimeout();
    };
  }, [socket, connected, isOnline]);

  const acceptRide = async () => {
    if (!incomingRide) return;
    setAccepting(true);
    clearRideTimeout();
    stopRideSound();
    try {
      const res = await fetch(
        `${apiBaseUrl}/driver/ride/${incomingRide.rideId}/accept`,
        { method: "POST", headers }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept ride");
      setIncomingRide(null);
      setActiveRide({
        id: data.id,
        status: data.status || "accepted",
        fare: data.fare,
        currency: data.currency || "FJD",
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        pickup: data.pickup,
        dropoff: data.dropoff,
        passenger: data.passenger,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not accept ride";
      Alert.alert("Error", msg);
    } finally {
      setAccepting(false);
    }
  };

  const rejectRide = async () => {
    if (!incomingRide) return;
    setRejecting(true);
    clearRideTimeout();
    stopRideSound();
    try {
      await fetch(`${apiBaseUrl}/driver/ride/${incomingRide.rideId}/reject`, {
        method: "POST",
        headers,
      });
    } catch {
      // Non-critical — dismiss locally even if request fails
    } finally {
      setIncomingRide(null);
      setRejecting(false);
    }
  };

  const updateRideStatus = async (nextStatus: RideStatus) => {
    if (!activeRide) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/driver/ride/${activeRide.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update ride");

      if (nextStatus === "completed") {
        setActiveRide(null);
        Alert.alert(
          "Trip Completed",
          `Fare: ${activeRide.currency} $${activeRide.fare?.toFixed(2)}`
        );
      } else {
        setActiveRide((prev) =>
          prev ? { ...prev, status: nextStatus } : null
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not update ride status";
      Alert.alert("Error", msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const cancelActiveRide = () => {
    if (!activeRide) return;
    Alert.alert(
      "Cancel Ride",
      "Are you sure? The passenger will be notified.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `${apiBaseUrl}/driver/ride/${activeRide.id}/cancel`,
                {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ reason: "Driver cancelled" }),
                }
              );
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to cancel");
              }
              setActiveRide(null);
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : "Could not cancel ride";
              Alert.alert("Error", msg);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-base text-neutral-500 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="cloud-offline-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-bold text-neutral-800 mt-4 mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-neutral-500 text-center mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchAvailability}
            className="bg-amber-500 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {reconnecting && (
        <View className="bg-yellow-500 py-2 px-4 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white font-bold text-sm ml-2">
            Reconnecting…
          </Text>
        </View>
      )}

      {/* Incoming Ride Request Modal */}
      <Modal visible={!!incomingRide} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-neutral-900">
                New Ride Request
              </Text>
              <View className="bg-amber-100 px-3 py-1 rounded-full">
                <Text className="text-amber-700 font-bold text-sm">
                  {timeoutRemaining}s
                </Text>
              </View>
            </View>

            {/* Timeout progress bar */}
            <View className="h-1 bg-gray-200 rounded-full mb-4">
              <View
                className="h-1 bg-amber-500 rounded-full"
                style={{ width: `${(timeoutRemaining / 30) * 100}%` }}
              />
            </View>

            <View className="bg-blue-50 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-neutral-500">
                  Distance to pickup
                </Text>
                <Text className="text-sm font-bold text-neutral-800">
                  {incomingRide?.distance?.toFixed(1) ?? "—"} km
                </Text>
              </View>
              {incomingRide?.fare != null && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-neutral-500">
                    Estimated Fare
                  </Text>
                  <Text className="text-sm font-bold text-green-600">
                    FJD ${incomingRide.fare.toFixed(2)}
                  </Text>
                </View>
              )}
              {incomingRide?.pickupAddress && (
                <View className="mt-2">
                  <Text className="text-xs text-neutral-400">PICKUP</Text>
                  <Text className="text-sm font-bold text-neutral-800">
                    {incomingRide.pickupAddress}
                  </Text>
                </View>
              )}
              {incomingRide?.dropoffAddress && (
                <View className="mt-2">
                  <Text className="text-xs text-neutral-400">DROPOFF</Text>
                  <Text className="text-sm font-bold text-neutral-800">
                    {incomingRide.dropoffAddress}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={rejectRide}
                disabled={rejecting || accepting}
                className="flex-1 py-4 rounded-2xl border-2 border-red-400 items-center"
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text className="text-base font-bold text-red-500">
                    Decline
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={acceptRide}
                disabled={accepting || rejecting}
                className="flex-1 py-4 rounded-2xl bg-green-500 items-center"
              >
                {accepting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-3">
          <Text className="text-sm text-neutral-500">Welcome back</Text>
          <Text className="text-2xl font-extrabold text-neutral-900">
            {session?.user?.name ?? "Driver"}
          </Text>
        </View>

        {/* Online/Offline Toggle */}
        <View className="mx-5 mb-5">
          <TouchableOpacity
            onPress={toggleOnline}
            disabled={toggling}
            className={`w-full py-5 rounded-2xl items-center justify-center ${
              isOnline ? "bg-green-500" : "bg-neutral-400"
            }`}
          >
            {toggling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isOnline ? "radio-button-on" : "radio-button-off"}
                  size={24}
                  color="#fff"
                />
                <Text className="text-xl font-bold text-white mt-1">
                  {isOnline ? "You're Online" : "You're Offline"}
                </Text>
                <Text className="text-sm text-white/80 mt-1">
                  {isOnline
                    ? "Tap to go offline"
                    : "Tap to go online and receive rides"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row mx-5 mb-5 space-x-3">
          <View className="flex-1 bg-white rounded-2xl p-4 items-center">
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text className="text-xl font-bold text-neutral-800 mt-1">
              5.0
            </Text>
            <Text className="text-xs text-neutral-500">Rating</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 items-center">
            <View
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-green-500" : "bg-neutral-300"
              } mb-1`}
            />
            <Text className="text-xs font-bold text-neutral-700 mt-1">
              {connected ? "Connected" : "Offline"}
            </Text>
            <Text className="text-xs text-neutral-500">Socket</Text>
          </View>
        </View>

        {/* Active Ride Card */}
        {activeRide && STATUS_LABELS[activeRide.status] ? (
          <View className="mx-5 bg-white rounded-2xl p-5 mb-5 border border-neutral-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-neutral-900">
                {STATUS_LABELS[activeRide.status].label}
              </Text>
              <View
                className={`px-3 py-1 rounded-full ${STATUS_LABELS[activeRide.status].color}`}
              >
                <Text className="text-xs font-bold text-white capitalize">
                  {activeRide.status.replace("_", " ")}
                </Text>
              </View>
            </View>

            {/* Passenger Info */}
            {activeRide.passenger && (
              <View className="flex-row items-center mb-4 bg-neutral-50 rounded-xl p-3">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Text className="text-base font-bold text-blue-600">
                    {activeRide.passenger.name?.charAt(0) ?? "P"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-neutral-800">
                    {activeRide.passenger.name}
                  </Text>
                  {activeRide.passenger.phone ? (
                    <Text className="text-xs text-neutral-500">
                      {activeRide.passenger.phone}
                    </Text>
                  ) : null}
                </View>
                {activeRide.passenger.phone ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${activeRide.passenger?.phone}`)
                    }
                    className="w-9 h-9 bg-green-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="call" size={16} color="#16a34a" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Pickup & Dropoff + Navigate buttons */}
            <View className="mb-4">
              <View className="flex-row items-start mb-2">
                <View className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2" />
                <View className="flex-1">
                  <Text className="text-xs text-neutral-400">PICKUP</Text>
                  <Text className="text-sm font-bold text-neutral-800">
                    {activeRide.pickup?.description ?? "Pickup location"}
                  </Text>
                </View>
                {activeRide.status === "accepted" &&
                  activeRide.pickup?.coords && (
                    <TouchableOpacity
                      onPress={() =>
                        openMapsNavigation(
                          activeRide.pickup.coords,
                          "Pickup location"
                        )
                      }
                      className="ml-2 px-3 py-1.5 bg-blue-100 rounded-xl flex-row items-center"
                    >
                      <Ionicons name="navigate" size={14} color="#2563eb" />
                      <Text className="text-xs font-bold text-blue-700 ml-1">
                        Navigate
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>

              <View className="flex-row items-start">
                <View className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-2" />
                <View className="flex-1">
                  <Text className="text-xs text-neutral-400">DROPOFF</Text>
                  <Text className="text-sm font-bold text-neutral-800">
                    {activeRide.dropoff?.description ?? "Dropoff location"}
                  </Text>
                </View>
                {activeRide.status === "in_progress" &&
                  activeRide.dropoff?.coords && (
                    <TouchableOpacity
                      onPress={() =>
                        openMapsNavigation(
                          activeRide.dropoff.coords,
                          "Dropoff location"
                        )
                      }
                      className="ml-2 px-3 py-1.5 bg-green-100 rounded-xl flex-row items-center"
                    >
                      <Ionicons name="navigate" size={14} color="#16a34a" />
                      <Text className="text-xs font-bold text-green-700 ml-1">
                        Navigate
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>

            {/* Fare */}
            <View className="flex-row justify-between items-center bg-green-50 rounded-xl p-3 mb-4">
              <Text className="text-sm text-neutral-600">Fare</Text>
              <Text className="text-lg font-bold text-green-600">
                {activeRide.currency} ${activeRide.fare?.toFixed(2) ?? "0.00"}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={() =>
                updateRideStatus(STATUS_LABELS[activeRide.status].next)
              }
              disabled={updatingStatus}
              className={`w-full py-4 rounded-2xl items-center justify-center mb-3 ${STATUS_LABELS[activeRide.status].color}`}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons
                    name={STATUS_LABELS[activeRide.status].icon}
                    size={18}
                    color="#fff"
                  />
                  <Text className="text-base font-bold text-white ml-2">
                    {STATUS_LABELS[activeRide.status].buttonLabel}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {activeRide.status !== "in_progress" && (
              <TouchableOpacity
                onPress={cancelActiveRide}
                className="w-full py-3 rounded-2xl border-2 border-red-400 items-center"
              >
                <Text className="text-sm font-bold text-red-500">
                  Cancel Ride
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            className={`mx-5 border rounded-2xl p-5 mb-5 ${
              isOnline
                ? "bg-green-50 border-green-200"
                : "bg-neutral-100 border-neutral-200"
            }`}
          >
            <Ionicons
              name={isOnline ? "wifi" : "wifi-outline"}
              size={28}
              color={isOnline ? "#16a34a" : "#9ca3af"}
            />
            <Text
              className={`text-base font-bold mt-2 mb-1 ${
                isOnline ? "text-green-800" : "text-neutral-800"
              }`}
            >
              {isOnline ? "Waiting for ride requests" : "You're currently offline"}
            </Text>
            <Text
              className={`text-sm ${
                isOnline ? "text-green-600" : "text-neutral-500"
              }`}
            >
              {isOnline
                ? "You'll be notified when a passenger nearby requests a ride. Keep the app open for best results."
                : "Go online to start receiving ride requests from passengers in your area."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
