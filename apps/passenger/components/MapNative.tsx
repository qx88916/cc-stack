import React from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { COLORS } from "@/constants/theme";
import { calculateRegion } from "@/lib/map";
import { useLocationStore } from "@/store/locationStore";

const directionsAPI = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY;

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface MapNativeProps {
  driverLocation?: DriverLocation | null;
}

const MapNative = ({ driverLocation }: MapNativeProps) => {
  const { userLocation, destinationLocation } = useLocationStore();

  const userLatitude = userLocation?.latitude ?? null;
  const userLongitude = userLocation?.longitude ?? null;
  const destinationLatitude = destinationLocation?.latitude ?? null;
  const destinationLongitude = destinationLocation?.longitude ?? null;

  // When driver is en-route, center the map to fit driver + user
  const effectiveDestLat = driverLocation ? null : destinationLatitude;
  const effectiveDestLng = driverLocation ? null : destinationLongitude;

  const region = calculateRegion({
    userLatitude: driverLocation ? driverLocation.latitude : userLatitude,
    userLongitude: driverLocation ? driverLocation.longitude : userLongitude,
    destinationLatitude: driverLocation ? userLatitude : effectiveDestLat,
    destinationLongitude: driverLocation ? userLongitude : effectiveDestLng,
  });

  if (!userLatitude || !userLongitude) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text className="text-white text-sm font-JakartaMedium mt-2">
          Getting your location...
        </Text>
      </View>
    );
  }

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      className="w-full h-full"
      tintColor="black"
      mapType="mutedStandard"
      showsPointsOfInterests={false}
      region={region}
      showsUserLocation
      userInterfaceStyle="light"
    >
      {/* Driver marker - shown when driver is en-route */}
      {driverLocation && (
        <Marker
          key="driver"
          coordinate={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          title="Your Driver"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#fff',
            }}
          >
            <Image
              source={icons.marker}
              style={{ width: 20, height: 20, tintColor: '#fff' }}
              resizeMode="contain"
            />
          </View>
        </Marker>
      )}

      {/* Destination marker - shown when no active driver tracking */}
      {!driverLocation && destinationLatitude && destinationLongitude && (
        <>
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
            image={icons.pin}
          />
          {directionsAPI && (
            <MapViewDirections
              origin={{
                latitude: userLatitude,
                longitude: userLongitude,
              }}
              destination={{
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              }}
              apikey={directionsAPI}
              strokeColor={COLORS.primary}
              strokeWidth={3}
            />
          )}
        </>
      )}

      {/* Route from driver to user when driver is approaching */}
      {driverLocation && directionsAPI && (
        <MapViewDirections
          origin={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
          }}
          destination={{
            latitude: userLatitude,
            longitude: userLongitude,
          }}
          apikey={directionsAPI}
          strokeColor={COLORS.primary}
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

export default MapNative;
