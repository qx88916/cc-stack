export const USER_ROLE = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export interface SavedPlace {
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface User {
  _id: string;
  email?: string;
  phone?: string;
  name: string;
  role: UserRole;
  profilePhoto?: string;
  emailVerified: boolean;
  savedPlaces?: SavedPlace[];
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
