export interface DriverLocation {
  latitude: number;
  longitude: number;
}

export interface Driver {
  _id: string;
  userId: string;
  isOnline: boolean;
  lastLocation?: DriverLocation;
  name: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}
