import type { UserRole } from './user';

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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

export interface AuthUserResponse {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: UserRole;
  profilePhoto?: string;
  emailVerified: boolean;
  createdAt?: string;
}
