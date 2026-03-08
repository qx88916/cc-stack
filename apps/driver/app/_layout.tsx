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
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import "../global.css";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function PushTokenRegistrar() {
  const { session, apiBaseUrl } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!session?.token || registered.current) return;

    (async () => {
      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("ride-requests", {
          name: "Ride Requests",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 400, 200, 400],
          sound: "default",
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      try {
        await fetch(`${apiBaseUrl}/driver/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ pushToken }),
        });
        registered.current = true;
      } catch {
        // Will retry on next app start
      }
    })();
  }, [session?.token, apiBaseUrl]);

  return null;
}

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
        <PushTokenRegistrar />
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