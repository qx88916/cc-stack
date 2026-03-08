import { useLocationStore } from '@/store/locationStore'
import React from 'react'
import { ActivityIndicator, Image as RNImage, StyleSheet, View } from 'react-native'

interface StaticMapProps {
  latitude?: number
  longitude?: number
  zoom?: number
}

const SUVA_LAT = -18.1416
const SUVA_LNG = 178.4419

const StaticMap = ({ latitude, longitude, zoom = 14 }: StaticMapProps) => {
  const { userLocation } = useLocationStore()

  const lat = latitude ?? userLocation?.latitude ?? SUVA_LAT
  const lng = longitude ?? userLocation?.longitude ?? SUVA_LNG

  const mapUri = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${lng},${lat}&zoom=${zoom}&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`

  return (
    <View style={styles.container}>
      <RNImage
        source={{ uri: mapUri }}
        style={styles.map}
        resizeMode="cover"
        loadingIndicatorSource={undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
})

export default StaticMap