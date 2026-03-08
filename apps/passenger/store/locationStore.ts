import { create } from 'zustand';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationStore {
  userLocation: Location | null;
  destinationLocation: Location | null;
  setUserLocation: (location: Location) => void;
  setDestinationLocation: (location: Location) => void;
  clearLocations: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  userLocation: null,
  destinationLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  setDestinationLocation: (location) => set({ destinationLocation: location }),
  clearLocations: () => set({ userLocation: null, destinationLocation: null }),
}));
