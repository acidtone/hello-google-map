/**
 * Location-related type definitions
 */

/**
 * Represents geographic coordinates
 */
export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Represents a location with coordinates and optional metadata
 */
export type Location = Coordinates & {
  name?: string;
  source?: string;
  formattedAddress?: string;
};

/**
 * Represents address components returned from geocoding
 */
export type AddressComponents = {
  [componentType: string]: string;
};

/**
 * Represents the result of a geocoding operation
 */
export type GeocodingResult = {
  formattedAddress: string;
  addressComponents: AddressComponents;
  placeId: string;
  postalCode?: string;
};

/**
 * Represents possible errors from geolocation operations
 */
export type GeolocationError = {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN_ERROR';
};

/**
 * Represents the possible states of the location service
 */
export const LocationState = {
  IDLE: 'IDLE',
  FETCHING: 'FETCHING',
  GEOCODING: 'GEOCODING',
  READY: 'READY',
  ERROR: 'ERROR'
} as const;

export type LocationState = typeof LocationState[keyof typeof LocationState];
