/**
 * Google Maps Directions API with Redis caching
 * Caches responses for 5 minutes to reduce API calls and costs
 */

import https from 'https';
import { get, setWithExpiry, isRedisConnected } from './redis';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export interface DirectionsResult {
  distanceKm: number;
  durationMinutes: number;
  polyline: string | null;
  success: boolean;
  cached?: boolean;
}

function getJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Generate cache key for route
 * Rounds coordinates to 4 decimal places (~11m precision)
 */
function getCacheKey(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): string {
  const oLat = origin.latitude.toFixed(4);
  const oLng = origin.longitude.toFixed(4);
  const dLat = destination.latitude.toFixed(4);
  const dLng = destination.longitude.toFixed(4);
  return `route:${oLat},${oLng}:${dLat},${dLng}`;
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<DirectionsResult> {
  if (!API_KEY) {
    console.warn('[Maps] No API key configured, returning mock data');
    return {
      distanceKm: 2 + Math.random() * 15,
      durationMinutes: Math.round(10 + Math.random() * 25),
      polyline: null,
      success: false,
    };
  }

  // Try Redis cache first
  if (isRedisConnected()) {
    const cacheKey = getCacheKey(origin, destination);
    const cached = await get(cacheKey);
    
    if (cached) {
      try {
        const result = JSON.parse(cached);
        console.log(`[Maps] Cache hit: ${cacheKey}`);
        return { ...result, cached: true };
      } catch (e) {
        console.error('[Maps] Cache parse error:', e);
      }
    }
  }

  // Call Google Maps API
  try {
    const url = `${BASE_URL}?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${API_KEY}`;
    const data = await getJson<{
      status: string;
      routes?: {
        legs: {
          distance: { value: number };
          duration: { value: number };
        }[];
        overview_polyline?: { points: string };
      }[];
    }>(url);

    if (data.status !== 'OK' || !data.routes?.[0]) {
      console.error('[Maps] API returned non-OK status:', data.status);
      return {
        distanceKm: 5,
        durationMinutes: 15,
        polyline: null,
        success: false,
      };
    }

    const leg = data.routes[0].legs[0];
    const distanceKm = leg.distance.value / 1000;
    const durationMinutes = Math.round(leg.duration.value / 60);
    const polyline = data.routes[0].overview_polyline?.points || null;

    const result: DirectionsResult = {
      distanceKm,
      durationMinutes,
      polyline,
      success: true,
      cached: false,
    };

    // Cache the result
    if (isRedisConnected()) {
      const cacheKey = getCacheKey(origin, destination);
      const cached = await setWithExpiry(
        cacheKey,
        JSON.stringify(result),
        CACHE_TTL_SECONDS
      );
      if (cached) {
        console.log(`[Maps] Cached: ${cacheKey} (TTL: ${CACHE_TTL_SECONDS}s)`);
      }
    }

    return result;
  } catch (e) {
    console.error('[Maps] Directions error:', e);
    return {
      distanceKm: 5,
      durationMinutes: 15,
      polyline: null,
      success: false,
    };
  }
}
