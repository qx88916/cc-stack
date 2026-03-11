import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "@auth/token";
const USER_KEY = "@auth/user";

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

let _getBaseUrl: () => string = () => "";
let _onAuthExpired: (() => void) | null = null;

/**
 * Called once from AuthProvider to wire up the runtime base URL and
 * the callback that fires when a 401 cannot be recovered.
 */
export function configureFetch(
  getBaseUrl: () => string,
  onAuthExpired: () => void
) {
  _getBaseUrl = getBaseUrl;
  _onAuthExpired = onAuthExpired;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryRefreshToken(baseUrl: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export interface FetchAPIOptions extends RequestInit {
  /** Skip auth header (for public endpoints like /auth/login) */
  noAuth?: boolean;
  /** Max retry attempts for transient errors (default 3) */
  retries?: number;
}

/**
 * Central API fetch with:
 * - Automatic Bearer token injection
 * - 401 → token refresh → retry once
 * - Exponential backoff retry for transient errors (408/429/5xx)
 * - Network error retry
 */
export const fetchAPI = async (
  url: string,
  options: FetchAPIOptions = {}
): Promise<unknown> => {
  const { noAuth, retries = MAX_RETRIES, ...fetchOpts } = options;
  const baseUrl = _getBaseUrl();
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const hdrs = (fetchOpts.headers ?? {}) as Record<string, string>;
  if (!noAuth && !("Authorization" in hdrs)) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchOpts.headers = {
        ...fetchOpts.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  let lastError: Error = new Error("Request failed");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(fullUrl, fetchOpts);

      if (response.status === 401 && !noAuth) {
        const currentToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (currentToken) {
          const newToken = await tryRefreshToken(baseUrl, currentToken);
          if (newToken) {
            fetchOpts.headers = {
              ...fetchOpts.headers,
              Authorization: `Bearer ${newToken}`,
            };
            const retryRes = await fetch(fullUrl, fetchOpts);
            if (retryRes.ok) return await retryRes.json();
          }
        }
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        _onAuthExpired?.();
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as Record<string, string>).message ||
            `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.message.includes("Session expired")) throw lastError;

      if (attempt < retries && error instanceof TypeError) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
};

export const useFetch = <T>(url: string, options?: FetchAPIOptions) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = (await fetchAPI(url, options)) as T;
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
