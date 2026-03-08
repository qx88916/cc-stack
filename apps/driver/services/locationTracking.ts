/**
 * Background location tracking service for the driver app.
 * Sends driver location to backend every ~15 seconds when online.
 * Uses expo-location with significantChanges for battery efficiency.
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_TASK = "DRIVER_LOCATION_TASK";
const LOCATION_INTERVAL_MS = 15000;

let trackingActive = false;

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
  if (error) return;
  const locations = (data as { locations: Location.LocationObject[] })?.locations;
  if (!locations || locations.length === 0) return;

  const latest = locations[locations.length - 1];
  const { latitude, longitude } = latest.coords;

  try {
    const token = await AsyncStorage.getItem("@auth/token");
    const apiBaseUrl =
      (await AsyncStorage.getItem("@auth/api_base_url")) ||
      "https://reidehail-backend.onrender.com";

    if (!token) return;

    await fetch(`${apiBaseUrl}/driver/location`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });
  } catch {
    // Silently fail — will retry on next update
  }
});

export async function startLocationTracking(): Promise<boolean> {
  if (trackingActive) return true;

  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") return false;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: LOCATION_INTERVAL_MS,
    distanceInterval: 50,
    deferredUpdatesInterval: LOCATION_INTERVAL_MS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "CabConnect Driver",
      notificationBody: "Sharing your location with passengers",
      notificationColor: "#0286FF",
    },
  });

  trackingActive = true;
  return true;
}

export async function stopLocationTracking(): Promise<void> {
  const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  trackingActive = false;
}

export async function sendCurrentLocation(apiBaseUrl: string, token: string): Promise<void> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = location.coords;

    await fetch(`${apiBaseUrl}/driver/location`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });
  } catch {
    // Best-effort
  }
}
