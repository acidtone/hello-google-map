/**
 * Configuration module for the Hello Maps application
 * Centralizes all configuration settings and API keys
 */

// Get API keys from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const FOURSQUARE_API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY || 'PLACEHOLDER_API_KEY';

// Default map settings
const DEFAULT_LOCATION = {
  lat: 39.7392,
  lng: -104.9903,
  name: 'Denver, CO'
};

const MAP_CONFIG = {
  zoom: 14,
  defaultCenter: DEFAULT_LOCATION
};

// Google Maps API configuration
const MAPS_API_CONFIG = {
  libraries: ['places'],
  callback: 'initMap'
};

// Autocomplete configuration
const AUTOCOMPLETE_CONFIG = {
  types: ['(regions)'],
  componentRestrictions: { country: 'ca' }, // Restrict to CA - can be changed as needed
  fields: ['address_components', 'geometry', 'name', 'formatted_address']
};

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
 */
export function validateConfig() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is missing. Please check your .env file.');
  }
  return true;
}
