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

  recoverActiveRide: async (apiBaseUrl: string, token: string) => {
    const current = get().activeRide;
    if (!current?.id) return;

    try {
      const response = await fetch(`${apiBaseUrl}/ride/${current.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      const status = data.status as ActiveRide['status'];

      if (status === 'completed' || status === 'cancelled') {
        set({ activeRide: null });
        return;
      }

      set({
        activeRide: {
          ...current,
          status,
          driver: data.driver
            ? {
                id: data.driver.id || data.driver._id,
                name: data.driver.name,
                phone: data.driver.phone,
                vehicle: data.driver.vehicle,
                plateNumber: data.driver.plateNumber,
                rating: data.driver.rating,
                profileImage: data.driver.profileImage,
                carImage: data.driver.carImage,
              }
            : current.driver,
        },
      });
    } catch {
      // Network still unavailable — keep existing state
    }
  },
}));
