export interface FareSettings {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  surgeMultiplier: number;
  taxRate: number;
}

export interface GeofenceSettings {
  enabled: boolean;
  maxDistanceKm: number;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
}

export interface GeneralSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
}

export interface Settings {
  _id: string;
  fare: FareSettings;
  geofence: GeofenceSettings;
  general: GeneralSettings;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
