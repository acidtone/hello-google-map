/**
 * Business-related type definitions
 */

import { Coordinates } from './location';

/**
 * Represents a business returned from the Foursquare API
 */
export type Business = {
  id: string;
  name: string;
  location: {
    address?: string;
    crossStreet?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string[];
    coordinates: Coordinates;
  };
  categories?: Array<{
    id: string;
    name: string;
    icon?: {
      prefix: string;
      suffix: string;
    };
  }>;
  website?: string;
  rating?: number;
  distance?: number;
  description?: string;
  tel?: string;
  hours?: {
    status?: string;
    isOpen?: boolean;
  };
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
  }>;
};

/**
 * Represents a business with additional UI-related properties
 */
export type BusinessWithUI = Business & {
  label?: string;  // A, B, C, D, etc.
  marker?: google.maps.Marker;
  listItem?: HTMLElement;
  infoWindow?: google.maps.InfoWindow;
};

/**
 * Represents the possible states of the business service
 */
export const BusinessState = {
  IDLE: 'IDLE',
  FETCHING: 'FETCHING',
  READY: 'READY',
  ERROR: 'ERROR',
  INTERACTING: 'INTERACTING'
} as const;

export type BusinessState = typeof BusinessState[keyof typeof BusinessState];

/**
 * Represents parameters for business search
 */
export type BusinessSearchParams = {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  categories?: string[];
  query?: string;
};

/**
 * Represents options for processing business data
 */
export type BusinessSearchOptions = {
  limit?: number;
  sortBy?: 'distance' | 'rating' | string;
};
