import { fetchAPI } from '@/lib/fetch';
import { MarkerData } from '@/types/type';
import { FareBreakdown } from '@cabconnect/shared';
import { create } from 'zustand';

export type { FareBreakdown };

export interface FareEstimate {
  fare: number; // Legacy: same as breakdown.total
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  breakdown?: FareBreakdown; // New: detailed breakdown
  polyline?: string; // Route polyline for map display
}

export interface ActiveRide {
  id: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'searching';
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoff: {
    latitude: number;
    longitude: number;
    address: string;
  };
  fare: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
    rating: number;
    profileImage?: string;
    carImage?: string;
  };
  createdAt: string;
  acceptedAt?: string;
}

interface RideStore {
  fareEstimate: FareEstimate | null;
  activeRide: ActiveRide | null;
  drivers: MarkerData[];
  selectedDriver: number | null;
  
  setFareEstimate: (estimate: FareEstimate) => void;
  setActiveRide: (ride: ActiveRide | null) => void;
  updateRideStatus: (status: ActiveRide['status']) => void;
  setDrivers: (drivers: MarkerData[]) => void;
  setSelectedDriver: (id: number | null) => void;
  clearRide: () => void;
  recoverActiveRide: (apiBaseUrl: string, token: string) => Promise<void>;
}

export const useRideStore = create<RideStore>((set, get) => ({
  fareEstimate: null,
  activeRide: null,
  drivers: [],
  selectedDriver: null,
  
  setFareEstimate: (estimate) => set({ fareEstimate: estimate }),
  setActiveRide: (ride) => set({ activeRide: ride }),
  updateRideStatus: (status) => set((state) => {
    if (!state.activeRide) return state;
    return { activeRide: { ...state.activeRide, status } };
  }),
  setDrivers: (drivers) => set({ drivers }),
  setSelectedDriver: (id) => set({ selectedDriver: id }),
  clearRide: () => set({ 
    fareEstimate: null, 
    activeRide: null, 
    drivers: [], 
    selectedDriver: null 
  }),

  recoverActiveRide: async (_apiBaseUrl: string, _token: string) => {
    try {
      const data = await fetchAPI('/ride/active') as { ride?: Record<string, unknown> };
      const ride = data.ride;

      if (!ride) {
        set({ activeRide: null });
        return;
      }

      const current = get().activeRide;
      set({
        activeRide: {
          id: ride.id,
          status: ride.status,
          pickup: {
            latitude: ride.pickup?.coords?.latitude ?? current?.pickup.latitude ?? 0,
            longitude: ride.pickup?.coords?.longitude ?? current?.pickup.longitude ?? 0,
            address: ride.pickup?.description ?? current?.pickup.address ?? '',
          },
          dropoff: {
            latitude: ride.dropoff?.coords?.latitude ?? current?.dropoff.latitude ?? 0,
            longitude: ride.dropoff?.coords?.longitude ?? current?.dropoff.longitude ?? 0,
            address: ride.dropoff?.description ?? current?.dropoff.address ?? '',
          },
          fare: ride.fare ?? current?.fare ?? 0,
          currency: ride.currency ?? current?.currency ?? 'FJD',
          distanceKm: ride.distanceKm ?? current?.distanceKm ?? 0,
          durationMinutes: ride.durationMinutes ?? current?.durationMinutes ?? 0,
          createdAt: ride.createdAt ?? current?.createdAt ?? new Date().toISOString(),
          driver: ride.driver
            ? {
                id: ride.driver.id,
                name: ride.driver.name,
                phone: ride.driver.phone,
                vehicle: ride.driver.vehicle,
                plateNumber: ride.driver.plateNumber,
                rating: ride.driver.rating,
                profileImage: ride.driver.profileImage,
              }
            : current?.driver,
        },
      });
    } catch {
      // Network still unavailable — keep existing state
    }
  },
}));
