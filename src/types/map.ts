/**
 * Map-related type definitions
 */

import { Coordinates } from './location';

/**
 * Represents map configuration options
 */
export type MapConfig = {
  zoom: number;
  defaultCenter: Coordinates;
  mapTypeId?: google.maps.MapTypeId;
  styles?: google.maps.MapTypeStyle[];
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
};

/**
 * Represents a marker with additional metadata
 */
export type MarkerWithMetadata = {
  marker: google.maps.Marker;
  type: 'user' | 'business' | 'custom';
  id?: string;
  icon?: google.maps.Icon | string;
  infoWindow?: google.maps.InfoWindow;
  isActive?: boolean;
};

/**
 * Represents marker options for creating a new marker
 */
export type MarkerOptions = {
  position: Coordinates;
  map?: google.maps.Map;
  title?: string;
  label?: string | google.maps.MarkerLabel;
  icon?: google.maps.Icon | string;
  animation?: google.maps.Animation;
  draggable?: boolean;
  clickable?: boolean;
  visible?: boolean;
  zIndex?: number;
};

/**
 * Represents the possible states of the map service
 */
export const MapState = {
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  ERROR: 'ERROR'
} as const;

export type MapState = typeof MapState[keyof typeof MapState];

/**
 * Represents map initialization options
 */
export type MapInitOptions = {
  elementId: string;
  config?: Partial<MapConfig>;
};
