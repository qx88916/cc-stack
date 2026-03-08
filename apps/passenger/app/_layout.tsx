import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/AnimatedSplash";
import { COLORS, SHADOW_MD } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from "@/utils/notifications";
import OfflineBanner from "@/components/OfflineBanner";
import "../global.css";

if (typeof globalThis.setImmediate !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as unknown as { setImmediate: (handler: (...args: unknown[]) => void, ...args: unknown[]) => ReturnType<typeof setTimeout> }).setImmediate = (
    handler,
    ...args
  ) => setTimeout(handler, 0, ...args);
}

SplashScreen.preventAutoHideAsync();

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-general-500 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-danger-50 items-center justify-center mb-6">
            <Text className="text-5xl">!</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-800 text-center mb-3">
            Something went wrong
          </Text>
          <Text className="text-sm text-neutral-500 text-center mb-8">
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            onPress={this.resetError}
            className="bg-primary-500 py-4 px-12 rounded-2xl"
            style={SHADOW_MD}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      // cabconnect://ride/RIDE_ID  → trip detail
      if (parsed.path?.startsWith('ride/')) {
        const rideId = parsed.path.split('/')[1];
        if (rideId) {
          router.push(`/(root)/trip-complete?rideId=${rideId}`);
        }
      }
      // cabconnect://book  → book ride screen
      if (parsed.path === 'book') {
        router.push('/(root)/(tabs)/home');
      }
    };

    // Handle URL that opened the app from closed state
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [router]);

  return null;
}

function PushNotificationSetup() {
  const { session, apiBaseUrl } = useAuth();
  const router = useRouter();
  const responseListenerRef = useRef<ReturnType<typeof addNotificationResponseListener> | null>(null);

  useEffect(() => {
    if (!session?.token || !apiBaseUrl) return;

    registerForPushNotifications(apiBaseUrl, session.token);

    responseListenerRef.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.rideId && typeof data.rideId === 'string') {
        router.push(`/(root)/book-ride`);
      }
    });

    return () => {
      responseListenerRef.current?.remove();
    };
  }, [session?.token, apiBaseUrl]);

  return null;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    Jakarta: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      setAppIsReady(true);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <DeepLinkHandler />
          <PushNotificationSetup />
          <OfflineBanner />
          <AnimatedSplash isReady={appIsReady} backgroundColor="#10b981">
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(root)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            </Stack>
          </AnimatedSplash>
        </SocketProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}