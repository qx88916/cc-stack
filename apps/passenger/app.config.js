/**
 * Expo app config — merges app.json with env-based values.
 * Required for: Android Google Maps API key (react-native-maps), EAS env injection.
 * EXPO_PUBLIC_* vars are loaded from .env at build/start time.
 */
const base = require("./app.json");

const placesKey = process.env.EXPO_PUBLIC_PLACES_API_KEY || "";
const directionsKey = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || "";
// Android Maps SDK often uses same key as Places/Directions
const androidMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || placesKey || directionsKey;

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      ...base.expo?.extra,
      EXPO_PUBLIC_PLACES_API_KEY: placesKey || undefined,
      EXPO_PUBLIC_DIRECTIONS_API_KEY: directionsKey || undefined,
    },
    android: {
      ...base.expo.android,
      config: {
        ...base.expo.android?.config,
        ...(androidMapsKey ? { googleMaps: { apiKey: androidMapsKey } } : {}),
      },
    },
  },
};
