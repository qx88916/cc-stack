/**
 * API base URL configuration
 *
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL environment variable (.env)
 * 2. Production URL (Render deployment)
 *
 * For local development, set EXPO_PUBLIC_API_URL in your .env file
 * to your machine's local IP, e.g. http://192.168.1.100:5000
 */

const PRODUCTION_API_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_PRODUCTION_API_URL) ||
  "https://reidehail-backend.onrender.com";

const getBaseUrl = (): string => {
  const envUrl = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }

  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getBaseUrl();

if (__DEV__) {
  console.log('[config] API_BASE_URL:', API_BASE_URL);
}

/**
 * Resolve API base URL at runtime.
 * Reads from AsyncStorage (set by AuthContext on login) with fallback to build-time config.
 */
export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('@auth/api_base_url');
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // AsyncStorage not available — use build-time config
  }
  return API_BASE_URL;
};
