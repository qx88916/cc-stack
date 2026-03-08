/**
 * Geofence Service Area Configuration
 * Defines geographic boundaries where ride-hailing service is available
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  name: string;
  bounds: {
    northEast: Coordinates;
    southWest: Coordinates;
  };
  // Optional: polygon for complex shapes (future enhancement)
  polygon?: Coordinates[];
}

/**
 * Service areas where CabConnect operates
 * Currently serving Fiji Islands
 */
export const SERVICE_AREAS: ServiceArea[] = [
  {
    name: 'Suva, Fiji',
    bounds: {
      northEast: { latitude: -18.0800, longitude: 178.4800 },
      southWest: { latitude: -18.2000, longitude: 178.3800 },
    },
  },
  {
    name: 'Nadi, Fiji',
    bounds: {
      northEast: { latitude: -17.7500, longitude: 177.4700 },
      southWest: { latitude: -17.8300, longitude: 177.4000 },
    },
  },
  {
    name: 'Lautoka, Fiji',
    bounds: {
      northEast: { latitude: -17.5800, longitude: 177.4800 },
      southWest: { latitude: -17.6500, longitude: 177.4200 },
    },
  },
  // Add more Fiji cities as service expands (Labasa, Ba, etc.)
];

/**
 * Check if a coordinate is within any service area
 * Uses simple bounding box check (fast, good for most cases)
 */
export function isWithinServiceArea(
  latitude: number,
  longitude: number
): { inArea: boolean; areaName?: string } {
  for (const area of SERVICE_AREAS) {
    const { northEast, southWest } = area.bounds;

    if (
      latitude >= southWest.latitude &&
      latitude <= northEast.latitude &&
      longitude >= southWest.longitude &&
      longitude <= northEast.longitude
    ) {
      return { inArea: true, areaName: area.name };
    }
  }

  return { inArea: false };
}

/**
 * Get the nearest service area to a coordinate
 * Useful for suggesting alternatives to users
 */
export function getNearestServiceArea(
  latitude: number,
  longitude: number
): { area: ServiceArea; distance: number } | null {
  if (SERVICE_AREAS.length === 0) return null;

  let nearest: ServiceArea = SERVICE_AREAS[0];
  let minDistance = Infinity;

  for (const area of SERVICE_AREAS) {
    // Calculate distance to center of bounding box
    const centerLat =
      (area.bounds.northEast.latitude + area.bounds.southWest.latitude) / 2;
    const centerLng =
      (area.bounds.northEast.longitude + area.bounds.southWest.longitude) / 2;

    const distance = calculateDistance(
      latitude,
      longitude,
      centerLat,
      centerLng
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = area;
    }
  }

  return { area: nearest, distance: minDistance };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get all service area names for display
 */
export function getServiceAreaNames(): string[] {
  return SERVICE_AREAS.map((area) => area.name);
}
