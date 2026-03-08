import GoogleTextInput from '@/components/GoogleTextInput'
import RideCard from '@/components/RideCard'
import StaticMap from '@/components/StaticMap'
import { icons } from '@/constants'
import { COLORS, ACTIVITY_COLOR, SHADOW_SM, SHADOW_MD } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useLocationStore } from '@/store/locationStore'
import { useSavedPlacesStore } from '@/store/savedPlacesStore'
import { Ride } from '@/types/type'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function adaptRide(ride: Record<string, unknown>, userId: string): Ride {
  const pickup = ride.pickup as Record<string, unknown> | undefined
  const dropoff = ride.dropoff as Record<string, unknown> | undefined
  const pickupCoords = pickup?.coords as Record<string, number> | undefined
  const dropoffCoords = dropoff?.coords as Record<string, number> | undefined
  const driver = ride.driver as Record<string, unknown> | undefined
  const driverName = String(driver?.name || 'Driver')

  return {
    id: String(ride.id || ride._id),
    origin_address: String(pickup?.description || ''),
    destination_address: String(dropoff?.description || ''),
    origin_latitude: pickupCoords?.latitude ?? 0,
    origin_longitude: pickupCoords?.longitude ?? 0,
    destination_latitude: dropoffCoords?.latitude ?? 0,
    destination_longitude: dropoffCoords?.longitude ?? 0,
    ride_time: (Number(ride.durationMinutes) || 0) * 60,
    fare_price: Number(ride.fare) || 0,
    payment_status: ride.status === 'completed' ? 'paid' : ride.status === 'cancelled' ? 'cancelled' : 'pending',
    driver_id: Number(driver?.id) || 0,
    user_id: userId,
    created_at: String(ride.createdAt || new Date().toISOString()),
    scheduled_time: null,
    driver: {
      first_name: driverName.split(' ')[0],
      last_name: driverName.split(' ').slice(1).join(' '),
      car_seats: 4,
    },
  }
}

const Home = () => {
  const { session, logout, apiBaseUrl } = useAuth()
  const { setUserLocation, setDestinationLocation, userLocation } = useLocationStore()
  const { places, fetchPlaces } = useSavedPlacesStore()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recentRides, setRecentRides] = useState<Ride[]>([])
  const [ridesLoading, setRidesLoading] = useState(true)
  const [ridesError, setRidesError] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const fetchRecentRides = useCallback(async () => {
    if (!session?.token) return
    setRidesLoading(true)
    setRidesError(null)
    try {
      const response = await fetch(`${apiBaseUrl}/history`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load rides')
      }
      const rides = Array.isArray(data) ? data : (data.rides ?? [])
      const adapted = rides.slice(0, 5).map((r: Record<string, unknown>) =>
        adaptRide(r, session.user?.id || '')
      )
      setRecentRides(adapted)
    } catch (err) {
      setRidesError((err as Error).message)
    } finally {
      setRidesLoading(false)
    }
  }, [session?.token, apiBaseUrl])

  useEffect(() => {
    requestLocationPermission()
    fetchPlaces()
    fetchRecentRides()
  }, [])

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      setHasPermission(status === 'granted')
      if (status === 'granted') await loadUserLocation()
    } catch (error) {
      console.error('Location permission error:', error)
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }

  const loadUserLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({})
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address[0].name}, ${address[0].region}`,
      })
    } catch (error) {
      console.error('Error loading location:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (hasPermission) await loadUserLocation()
    await Promise.all([fetchPlaces(), fetchRecentRides()])
    setRefreshing(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleSavedPlacePress = (place: { address: string; latitude: number; longitude: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setDestinationLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
    })
    router.push('/(root)/find-ride')
  }

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    logout()
    router.replace('/(auth)/login')
  }

  const handleDestinationPress = (location: {
    latitude: number
    longitude: number
    address: string
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    useLocationStore.getState().setDestinationLocation(location)
    router.push('/(root)/find-ride')
  }

  const handleQuickAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    switch (action) {
      case 'book':
        router.push('/(root)/find-ride')
        break
      case 'schedule':
        break
      case 'history':
        router.push('/(root)/(tabs)/rides')
        break
      case 'support':
        Linking.openURL('mailto:support@fijicabconnect.com?subject=Support Request')
        break
    }
  }

  const quickActions = [
    { icon: icons.to, title: 'Book Ride', action: 'book', bg: 'bg-primary-100', tint: COLORS.primary },
    { icon: icons.list, title: 'History', action: 'history', bg: 'bg-secondary-100', tint: COLORS.secondary },
    { icon: icons.chat, title: 'Support', action: 'support', bg: 'bg-accent-100', tint: COLORS.accent },
  ]

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <FlatList
        data={recentRides}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(item) => item.id}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACTIVITY_COLOR}
            colors={[ACTIVITY_COLOR]}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-10">
            {ridesLoading ? (
              <>
                <View className="bg-white rounded-2xl p-4 mb-3 w-full" style={SHADOW_SM}>
                  <View className="flex-row items-center space-x-3">
                    <View className="w-20 h-20 bg-neutral-200 rounded-xl" />
                    <View className="flex-1 space-y-2">
                      <View className="h-4 bg-neutral-200 rounded-full" />
                      <View className="h-4 bg-neutral-200 rounded-full w-3/4" />
                    </View>
                  </View>
                </View>
                <ActivityIndicator size="small" color={ACTIVITY_COLOR} className="mt-2" />
              </>
            ) : ridesError ? (
              <>
                <View className="w-28 h-28 rounded-full bg-danger-50 items-center justify-center mb-4">
                  <Image source={icons.close} className="w-10 h-10" tintColor={COLORS.danger} resizeMode="contain" />
                </View>
                <Text className="text-lg font-JakartaBold text-neutral-800 mb-2">
                  Could not load rides
                </Text>
                <Text className="text-sm font-JakartaMedium text-neutral-500 text-center px-8 mb-6">
                  {ridesError}
                </Text>
                <TouchableOpacity
                  onPress={fetchRecentRides}
                  className="bg-primary-500 py-3.5 px-10 rounded-2xl"
                  style={SHADOW_MD}
                >
                  <Text className="text-white font-JakartaBold text-base">Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-28 h-28 rounded-full bg-primary-100 items-center justify-center mb-4">
                  <Image source={icons.to} className="w-12 h-12" tintColor={COLORS.primary} resizeMode="contain" />
                </View>
                <Text className="text-lg font-JakartaBold text-neutral-800 mb-2">
                  No Recent Rides
                </Text>
                <Text className="text-sm font-JakartaMedium text-neutral-500 text-center px-8 mb-6">
                  Your ride history will appear here
                </Text>
                <TouchableOpacity
                  onPress={() => handleQuickAction('book')}
                  className="bg-primary-500 py-3.5 px-10 rounded-2xl"
                  style={SHADOW_MD}
                >
                  <Text className="text-white font-JakartaBold text-base">Book Your First Ride</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        ListHeaderComponent={
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Greeting Header */}
            <View className="bg-primary-500 rounded-3xl p-6 mb-5 mt-3" style={SHADOW_MD}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-JakartaMedium text-primary-200">
                    {greeting}
                  </Text>
                  <Text className="text-2xl font-JakartaExtraBold text-white mt-1">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </Text>
                  {userLocation?.address && (
                    <View className="flex-row items-center mt-2">
                      <Image source={icons.point} className="w-3 h-3 mr-1.5" tintColor="#d1fae5" />
                      <Text className="text-xs font-JakartaMedium text-primary-200" numberOfLines={1}>
                        {userLocation.address}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(root)/(tabs)/profile')}
                  activeOpacity={0.8}
                  className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center"
                >
                  <Text className="text-white font-JakartaBold text-xl">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row mb-5 space-x-3">
              {quickActions.map((qa) => (
                <TouchableOpacity
                  key={qa.action}
                  onPress={() => handleQuickAction(qa.action)}
                  activeOpacity={0.7}
                  className="flex-1"
                >
                  <View className="bg-white rounded-2xl p-4 items-center justify-center" style={SHADOW_SM}>
                    <View className={`w-12 h-12 rounded-2xl ${qa.bg} items-center justify-center mb-2.5`}>
                      <Image source={qa.icon} className="w-5 h-5" tintColor={qa.tint} />
                    </View>
                    <Text className="text-xs font-JakartaSemiBold text-neutral-700 text-center">
                      {qa.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location Permission Banner */}
            {hasPermission === false && (
              <View className="bg-accent-50 border border-accent-200 p-4 rounded-2xl mb-5" style={SHADOW_SM}>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center mr-3">
                    <Text className="text-lg">📍</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-JakartaBold text-neutral-800 text-sm mb-1">
                      Location Access Needed
                    </Text>
                    <Text className="font-JakartaMedium text-xs text-neutral-500 mb-2">
                      Enable location to find rides near you
                    </Text>
                    <TouchableOpacity
                      onPress={requestLocationPermission}
                      className="bg-accent-500 py-2 px-4 rounded-xl self-start"
                    >
                      <Text className="text-white font-JakartaBold text-xs">Enable Location</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Search Bar */}
            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white mb-5"
              handlePress={handleDestinationPress}
            />

            {/* Current Location Map */}
            {hasPermission && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-JakartaBold text-neutral-800">
                    Your Location
                  </Text>
                  <TouchableOpacity onPress={loadUserLocation}>
                    <Text className="text-primary-500 font-JakartaSemiBold text-sm">
                      Refresh
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-white rounded-2xl overflow-hidden h-[180px]" style={SHADOW_MD}>
                  <StaticMap />
                </View>
              </View>
            )}

            {/* Saved Places Quick Access */}
            {(places.home || places.work) && (
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-JakartaBold text-neutral-800">
                    Quick Access
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(root)/saved-places')}>
                    <Text className="text-primary-500 font-JakartaSemiBold text-sm">
                      Manage
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row space-x-3">
                  {places.home && (
                    <TouchableOpacity
                      onPress={() => handleSavedPlacePress(places.home)}
                      className="flex-1 bg-white rounded-2xl p-4"
                      style={SHADOW_SM}
                    >
                      <View className="bg-primary-100 w-11 h-11 rounded-2xl items-center justify-center mb-2.5">
                        <Text className="text-xl">🏠</Text>
                      </View>
                      <Text className="font-JakartaBold text-sm text-neutral-800 mb-1">Home</Text>
                      <Text className="text-neutral-500 text-xs font-JakartaMedium" numberOfLines={2}>
                        {places.home.address}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {places.work && (
                    <TouchableOpacity
                      onPress={() => handleSavedPlacePress(places.work)}
                      className="flex-1 bg-white rounded-2xl p-4"
                      style={SHADOW_SM}
                    >
                      <View className="bg-accent-100 w-11 h-11 rounded-2xl items-center justify-center mb-2.5">
                        <Text className="text-xl">💼</Text>
                      </View>
                      <Text className="font-JakartaBold text-sm text-neutral-800 mb-1">Work</Text>
                      <Text className="text-neutral-500 text-xs font-JakartaMedium" numberOfLines={2}>
                        {places.work.address}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Recent Rides Header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-JakartaBold text-neutral-800">
                Recent Rides
              </Text>
              <TouchableOpacity onPress={() => router.push('/(root)/(tabs)/rides')}>
                <Text className="text-primary-500 font-JakartaSemiBold text-sm">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => handleQuickAction('book')}
        activeOpacity={0.9}
        className="absolute bottom-28 right-5 w-14 h-14 bg-primary-500 rounded-2xl items-center justify-center"
        style={{
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Image source={icons.to} className="w-7 h-7" tintColor="white" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default Home
