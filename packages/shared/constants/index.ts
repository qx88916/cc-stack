export { USER_ROLE } from '../types/user';
export { RIDE_STATUS } from '../types/ride';

export const SAVED_PLACE_TYPE = {
  HOME: 'home',
  WORK: 'work',
  CUSTOM: 'custom',
} as const;

export type SavedPlaceType = (typeof SAVED_PLACE_TYPE)[keyof typeof SAVED_PLACE_TYPE];

export const API_ERROR_CODE = {
  OUT_OF_SERVICE_AREA_PICKUP: 'OUT_OF_SERVICE_AREA_PICKUP',
  OUT_OF_SERVICE_AREA_DROPOFF: 'OUT_OF_SERVICE_AREA_DROPOFF',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];

export const DEFAULT_CURRENCY = 'FJD';
