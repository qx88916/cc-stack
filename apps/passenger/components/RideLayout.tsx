import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MapNative from "@/components/MapNative";
import StaticMap from "@/components/StaticMap";
import { icons } from "@/constants";
import { useLocationStore } from "@/store/locationStore";

interface DriverLocation {
  latitude: number;
  longitude: number;
}

const RideLayout = ({
  title,
  snapPoints,
  children,
  driverLocation,
}: {
  title: string;
  snapPoints?: string[];
  children: React.ReactNode;
  driverLocation?: DriverLocation | null;
}) => {
  const { userLocation, destinationLocation } = useLocationStore();
  const isNativePlatform = Platform.OS === "ios" || Platform.OS === "android";

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 bg-primary-500">
        <View className="absolute z-10 top-16 flex-row items-center justify-start px-5">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
              <Image
                source={icons.backArrow}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-JakartaSemiBold ml-5 text-white">
            {title || "Go Back"}
          </Text>
        </View>

        {isNativePlatform ? (
          <MapNative driverLocation={driverLocation} />
        ) : (
          <View className="flex-1">
            <StaticMap
              latitude={destinationLocation?.latitude ?? userLocation?.latitude}
              longitude={destinationLocation?.longitude ?? userLocation?.longitude}
              zoom={13}
            />
          </View>
        )}
      </View>

      <View className="bg-white rounded-t-3xl flex-1 max-h-[60%] min-h-[40%]">
        <ScrollView
          className="flex-1 px-5 pt-4 pb-8"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

export default RideLayout;
