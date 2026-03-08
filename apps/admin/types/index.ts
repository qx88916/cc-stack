export interface User {
  _id: string;
  email?: string;
  phone?: string;
  name: string;
  role: 'passenger' | 'driver' | 'admin';
  profilePhoto?: string;
  emailVerified: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ride {
  _id: string;
  passengerId: string;
  driverId?: string;
  pickup: {
    description: string;
    coords: {
      latitude: number;
      longitude: number;
    };
  };
  dropoff: {
    description: string;
    coords: {
      latitude: number;
      longitude: number;
    };
  };
  status: 'searching' | 'accepted' | 'arriving' | 'ongoing' | 'completed' | 'cancelled';
  fare: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  _id: string;
  fare: {
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    minimumFare: number;
    surgeMultiplier: number;
    taxRate: number;
  };
  geofence: {
    enabled: boolean;
    maxDistanceKm: number;
    centerCoordinates: {
      latitude: number;
      longitude: number;
    };
    radiusKm: number;
  };
  general: {
    appName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
  };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  users: {
    total: number;
    passengers: number;
    drivers: number;
    admins: number;
  };
  drivers: {
    total: number;
    online: number;
    offline: number;
  };
  rides: {
    total: number;
    completed: number;
    cancelled: number;
    active: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
