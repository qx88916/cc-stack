import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_300Light,
  PlusJakartaSans_200ExtraLight,
} from "@expo-google-fonts/plus-jakarta-sans";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { Suspense, useEffect, useState } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import "../global.css";

SplashScreen.preventAutoHideAsync();

/** Push notifications removed from Expo Go in SDK 53. Only load in dev/production builds. */
const isExpoGo = Constants.appOwnership === "expo";
const PushTokenRegistrar = isExpoGo
  ? () => null
  : React.lazy(() => import("@/components/PushTokenRegistrar"));

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [loaded] = useFonts({
    "Jakarta-Bold": PlusJakartaSans_700Bold,
    "Jakarta-ExtraBold": PlusJakartaSans_800ExtraBold,
    "Jakarta-ExtraLight": PlusJakartaSans_200ExtraLight,
    "Jakarta-Light": PlusJakartaSans_300Light,
    "Jakarta-Medium": PlusJakartaSans_500Medium,
    Jakarta: PlusJakartaSans_400Regular,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
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
    <ErrorBoundary>
      <AuthProvider>
        {isExpoGo ? null : (
          <Suspense fallback={null}>
            <PushTokenRegistrar />
          </Suspense>
        )}
        <SocketProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(root)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          </Stack>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}