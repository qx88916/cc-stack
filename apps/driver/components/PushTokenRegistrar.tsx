/**
 * Registers push token with backend. Only used in development builds.
 * Do NOT import this when running in Expo Go - expo-notifications push
 * was removed from Expo Go in SDK 53.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PushTokenRegistrar() {
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
