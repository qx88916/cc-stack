import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/contexts/AuthContext";

interface DriverRide {
  id: string;
  status: string;
  fare: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  pickup: { description?: string };
  dropoff: { description?: string };
  passenger?: { name?: string };
  createdAt: string;
  completedAt?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const Rides = () => {
  const { session, apiBaseUrl } = useAuth();
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${apiBaseUrl}/driver/history`, {
        headers: { Authorization: `Bearer ${session?.token}` },
      });
      if (!res.ok) throw new Error("Failed to load ride history");
      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not load rides";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl, session?.token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderRide = ({ item }: { item: DriverRide }) => (
    <View className="bg-white rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs text-neutral-400">
          {formatDate(item.completedAt || item.createdAt)}
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${
            item.status === "completed" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Text
            className={`text-xs font-bold capitalize ${
              item.status === "completed" ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <View className="flex-row items-start mb-1">
          <View className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2" />
          <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
            {item.pickup?.description || "Pickup"}
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2" />
          <Text className="text-sm text-neutral-700 flex-1" numberOfLines={1}>
            {item.dropoff?.description || "Dropoff"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center border-t border-neutral-100 pt-3">
        <Text className="text-sm text-neutral-500">
          {item.distanceKm?.toFixed(1)} km · {item.durationMinutes} min
        </Text>
        <Text className="text-base font-bold text-green-600">
          {item.currency || "FJD"} ${item.fare?.toFixed(2) || "0.00"}
        </Text>
      </View>

      {item.passenger?.name && (
        <Text className="text-xs text-neutral-400 mt-2">
          Passenger: {item.passenger.name}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-base text-neutral-500 mt-4">
            Loading ride history…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="cloud-offline-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-bold text-neutral-800 mt-4 mb-2">
            Could not load rides
          </Text>
          <Text className="text-sm text-neutral-500 text-center mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchHistory}
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
      <FlatList
        data={rides}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f59e0b"
          />
        }
        ListHeaderComponent={
          <Text className="text-2xl font-extrabold text-neutral-900 my-5">
            Ride History
          </Text>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
            <Text className="text-lg font-bold text-neutral-800 mt-4">
              No rides yet
            </Text>
            <Text className="text-sm text-neutral-500 mt-2 text-center px-10">
              Your completed and cancelled rides will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Rides;
