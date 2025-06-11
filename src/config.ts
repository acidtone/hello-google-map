/**
 * Configuration module for the Hello Maps application
 * Centralizes all configuration settings and API keys
 */

// Add type declaration for Vite's import.meta.env
declare interface ImportMeta {
  readonly env: Record<string, string>;
}

// Type definitions for configuration objects
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Location extends LatLng {
  name: string;
}

export interface MapConfig {
  zoom: number;
  defaultCenter: Location;
  [key: string]: any; // Allow for additional map configuration options
}

export interface MapsApiConfig {
  libraries: string[];
  callback: string;
}

export interface AutocompleteConfig {
  types: string[];
  componentRestrictions?: {
    country: string | string[];
  };
}

// Get API keys from environment variables
export const GOOGLE_MAPS_API_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const FOURSQUARE_API_KEY: string = import.meta.env.VITE_FOURSQUARE_API_KEY || 'PLACEHOLDER_API_KEY';

// Default map settings
export const DEFAULT_LOCATION: Location = {
  lat: 39.7392,
  lng: -104.9903,
  name: 'Denver, CO'
};

export const MAP_CONFIG: MapConfig = {
  zoom: 14,
  defaultCenter: DEFAULT_LOCATION
};

// Google Maps API configuration
export const MAPS_API_CONFIG: MapsApiConfig = {
  libraries: ['places'],
  callback: 'initMap'
};

// Autocomplete configuration
export const AUTOCOMPLETE_CONFIG: AutocompleteConfig = {
  types: ['(regions)'],
  componentRestrictions: {
    country: ['us', 'ca']
  }
};

/**
 * Validates that required configuration is present
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig(): boolean {
  const missingKeys: string[] = [];
  
  if (!GOOGLE_MAPS_API_KEY) missingKeys.push('VITE_GOOGLE_MAPS_API_KEY');
  if (!FOURSQUARE_API_KEY) missingKeys.push('VITE_FOURSQUARE_API_KEY');
  
  if (missingKeys.length > 0) {
    console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
    return false;
  }
  
  return true;
}
