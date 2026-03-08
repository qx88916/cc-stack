import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className="absolute top-0 left-0 right-0 z-50 bg-neutral-800 py-3 px-5 flex-row items-center justify-center"
      accessibilityLiveRegion="polite"
      accessibilityLabel="No internet connection"
    >
      <View className="w-2 h-2 rounded-full bg-danger-400 mr-2" />
      <Text className="text-white text-sm font-JakartaMedium">
        No internet connection
      </Text>
    </Animated.View>
  );
};

export default OfflineBanner;
