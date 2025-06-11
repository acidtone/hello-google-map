/* Core shared TypeScript types for the Hello Maps project
   -------------------------------------------------------
   These interfaces & type aliases are intentionally kept lightweight
   so they can be imported across both action and service layers without
   creating circular deps.
*/

// Basic lat/lng pair used throughout the app
export interface LatLng {
  lat: number;
  lng: number;
}

// Generic result pattern used by pure action functions
export interface Result<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  /** optional raw error details provided by external APIs */
  errorDetails?: unknown;
}

// Specialised result for geocoding & location ops
export type LocationResult = Result<LatLng & {
  formattedAddress?: string;
  addressComponents?: google.maps.GeocoderAddressComponent[];
  placeId?: string;
}>;

// Map-related async operation result
export type MapResult<T = unknown> = Result<T>;

// Finite-state-machine strings for location & map modules
export type LocationState = 'IDLE' | 'FETCHING' | 'GEOCODING' | 'READY' | 'ERROR';
export type MapState = 'IDLE' | 'INITIALIZING' | 'UPDATING' | 'READY' | 'ERROR';

// Business entity returned by external places API
export interface Business {
  id: string;
  name: string;
  latlng: LatLng;
  category?: string;
  address?: string;
  website?: string;
}
