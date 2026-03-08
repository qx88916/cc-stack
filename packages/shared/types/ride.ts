export const RIDE_STATUS = {
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  ARRIVING: 'arriving',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export interface Place {
  id?: string;
  description?: string;
  placeId?: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  subtotal: number;
  surge: number;
  surgeMultiplier: number;
  tax: number;
  total: number;
}

export interface Ride {
  _id: string;
  passengerId: string;
  driverId?: string;
  pickup: Place;
  dropoff: Place;
  status: RideStatus;
  fare: number;
  fareBreakdown?: FareBreakdown;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FareEstimate {
  amount: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  breakdown?: FareBreakdown;
  polyline?: string;
}
