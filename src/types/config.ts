/**
 * Configuration-related type definitions
 */

import { Coordinates } from './location';

/**
 * Represents Google Maps API configuration
 */
export type MapsApiConfig = {
  libraries: string[];
  callback: string;
};

/**
 * Represents Places Autocomplete configuration
 */
export type AutocompleteConfig = {
  types: string[];
  componentRestrictions?: {
    country: string | string[];
  };
  fields: string[];
};

/**
 * Represents application configuration
 */
export type AppConfig = {
  googleMapsApiKey: string;
  foursquareApiKey: string;
  defaultLocation: Coordinates & { name: string };
  mapConfig: {
    zoom: number;
    defaultCenter: Coordinates;
  };
  mapsApiConfig: MapsApiConfig;
  autocompleteConfig: AutocompleteConfig;
};
