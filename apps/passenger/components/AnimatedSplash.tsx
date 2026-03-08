import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface AnimatedSplashProps {
  isReady: boolean;
  onComplete?: () => void;
  backgroundColor?: string;
  children: React.ReactNode;
}

/**
 * Bolt-style Animated Splash Screen Component
 * 
 * Provides smooth fade transition from splash to app content
 * Mimics Bolt's clean, professional splash experience
 */
export function AnimatedSplash({ 
  isReady, 
  onComplete, 
  backgroundColor = '#10b981',
  children 
}: AnimatedSplashProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isReady) {
      // Small delay to ensure smooth load (Bolt-style timing)
      const timer = setTimeout(() => {
        // Fade out splash screen
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400, // Fast but smooth transition
          useNativeDriver: true,
        }).start(() => {
          SplashScreen.hideAsync();
          onComplete?.();
        });
      }, 300); // Brief moment to see the splash

      return () => clearTimeout(timer);
    }
  }, [isReady, fadeAnim, onComplete]);

  return (
    <View style={styles.container}>
      {children}
      
      {/* Animated Overlay - fades out when ready */}
      <Animated.View
        pointerEvents={isReady ? 'none' : 'auto'}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            opacity: fadeAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
