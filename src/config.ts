/**
 * Configuration module for the Hello Maps application
 * Centralizes all configuration settings and API keys
 */

import { Location } from './types/location';
import { validateEnvironment, getEnvVar, hasEnvVar } from './utils/env';

// Define types for configuration objects
type MapConfig = {
  zoom: number;
  defaultCenter: Location;
};

type MapsApiConfig = {
  libraries: string[];
  callback: string;
};

type AutocompleteConfig = {
  types: string[];
  componentRestrictions: {
    country: string;
  };
  fields: string[];
};

// Get API keys from environment variables using the validation utility
const GOOGLE_MAPS_API_KEY: string = getEnvVar('VITE_GOOGLE_MAPS_API_KEY');
const FOURSQUARE_API_KEY: string = getEnvVar('VITE_FOURSQUARE_API_KEY', 'PLACEHOLDER_API_KEY');

// Default map settings
const DEFAULT_LOCATION: Location = {
  lat: 39.7392,
  lng: -104.9903,
  name: 'Denver, CO'
};

const MAP_CONFIG: MapConfig = {
  zoom: 14,
  defaultCenter: DEFAULT_LOCATION
};

// Google Maps API configuration
const MAPS_API_CONFIG: MapsApiConfig = {
  libraries: ['places'],
  callback: 'initMap'
};

// Autocomplete configuration
const AUTOCOMPLETE_CONFIG: AutocompleteConfig = {
  types: ['(regions)'],
  componentRestrictions: { country: 'ca' }, // Restrict to CA - can be changed as needed
  fields: ['address_components', 'geometry', 'name', 'formatted_address']
};

// Add business provider selection
type BusinessProviderType = 'foursquare' | 'composite' | 'dummy';
export const BUSINESS_PROVIDER: BusinessProviderType = 'composite'; // or 'dummy', 'dummyWithJSON', etc.

// Export configuration
export {
  GOOGLE_MAPS_API_KEY,
  FOURSQUARE_API_KEY,
  DEFAULT_LOCATION,
  MAP_CONFIG,
  MAPS_API_CONFIG,
  AUTOCOMPLETE_CONFIG
};

/**
 * Validates that required configuration is present
 * @throws {Error} - If configuration is invalid
 * @returns true if configuration is valid
 */
export function validateConfig(): boolean {
  // Use the centralized environment validation
  validateEnvironment();
  
  // Additional validation for Foursquare API key (non-critical but needed for business search)
  if (!hasEnvVar('VITE_FOURSQUARE_API_KEY') || FOURSQUARE_API_KEY === 'PLACEHOLDER_API_KEY') {
    throw new Error('Foursquare API key is missing. Please check your .env file.');
  }
  
  return true;
}

export type { BusinessProviderType };
