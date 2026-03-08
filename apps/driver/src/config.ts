/**
 * API base URL. Default: Render backend.
 * Override: set in app (Login screen) or EXPO_PUBLIC_API_URL in .env
 */
const RENDER_API_URL = "https://reidehail-backend.onrender.com";

const getBaseUrl = (): string => {
  const envUrl = typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  return RENDER_API_URL;
};

export const API_BASE_URL = getBaseUrl();
