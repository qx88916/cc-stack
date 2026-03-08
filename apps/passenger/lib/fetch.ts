import { useCallback, useEffect, useState } from "react";

import { API_BASE_URL } from "@/src/config";

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const fetchAPI = async (
  url: string,
  options?: RequestInit,
  retries = MAX_RETRIES
): Promise<unknown> => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  let lastError: Error = new Error("Request failed");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(fullUrl, options);

      if (!response.ok) {
        // Only retry on transient server/network errors
        if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Retry on network errors (TypeError: Failed to fetch)
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

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options) as { data: T };
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
