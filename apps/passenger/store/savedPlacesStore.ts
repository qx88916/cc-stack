import { create } from 'zustand';
import { getApiBaseUrl } from '@/src/config';

export interface SavedPlace {
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export { SAVED_PLACE_TYPE, DEFAULT_CURRENCY } from '@cabconnect/shared';

interface SavedPlacesStore {
  places: Record<string, SavedPlace>;
  isLoading: boolean;
  error: string | null;
  fetchPlaces: () => Promise<void>;
  setPlace: (type: string, place: SavedPlace) => Promise<void>;
  deletePlace: (type: string) => Promise<void>;
}

export const useSavedPlacesStore = create<SavedPlacesStore>((set, get) => ({
  places: {},
  isLoading: false,
  error: null,

  fetchPlaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('@auth/token');
      const apiBaseUrl = await getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/user/saved-places`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const placesMap: Record<string, SavedPlace> = {};
        
        if (data.places && Array.isArray(data.places)) {
          data.places.forEach((place: { type: SavedPlace['type']; label: string; address: string; coordinates?: { lat: number; lng: number }; latitude?: number; longitude?: number }) => {
            placesMap[place.type] = {
              type: place.type,
              label: place.label,
              address: place.address,
              latitude: place.coordinates?.lat ?? place.latitude ?? 0,
              longitude: place.coordinates?.lng ?? place.longitude ?? 0,
            };
          });
        }
        
        set({ places: placesMap });
      }
    } catch (error) {
      console.error('Error fetching saved places:', error);
      set({ error: 'Failed to load saved places. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setPlace: async (type: string, place: SavedPlace) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('@auth/token');
      const apiBaseUrl = await getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/user/saved-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type, place }),
      });

      if (response.ok) {
        const currentPlaces = get().places;
        set({
          places: { ...currentPlaces, [type]: place },
        });
      } else {
        throw new Error('Failed to save place');
      }
    } catch (error) {
      console.error('Error saving place:', error);
      throw error;
    }
  },

  deletePlace: async (type: string) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('@auth/token');
      const apiBaseUrl = await getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/user/saved-places/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const currentPlaces = get().places;
        const { [type]: _, ...restPlaces } = currentPlaces;
        set({ places: restPlaces });
      } else {
        throw new Error('Failed to delete place');
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  },
}));
