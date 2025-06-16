/**
 * Map Actions Module
 * 
 * This module contains pure action functions related to map operations.
 * These functions are designed to be triggered by FSM state transitions and don't
 * directly modify UI or global state. Each function returns a Result object with
 * a consistent structure.
 */

import { MAP_CONFIG } from '../config';
import { Coordinates } from '../types/location';
import { MapConfig, MarkerOptions } from '../types/map';
import { Result } from '../types/result';

/**
 * Initialize a Google Maps instance
 * 
 * This is a pure function that initializes a Google Maps instance without
 * modifying global state. It can be triggered by an FSM state transition like:
 * MAP_UNINITIALIZED -> MAP_INITIALIZING -> MAP_READY/MAP_ERROR
 * 
 * @param elementId - The ID of the DOM element to contain the map
 * @param config - Optional configuration to override defaults
 * @returns Result with map instance, element ID, and configuration
 */
export function initializeGoogleMap(
  elementId: string, 
  config: Partial<MapConfig> = {}
): Result<{
  map: google.maps.Map;
  elementId: string;
  config: google.maps.MapOptions;
}, Error> {
  try {
    // Validate input
    if (!elementId) {
      return {
        success: false,
        error: new Error('Element ID is required')
      };
    }
    
    const mapElement = document.getElementById(elementId);
    
    // Check if the element exists
    if (!mapElement) {
      return {
        success: false,
        error: new Error(`Map element with ID "${elementId}" not found`)
      };
    }
    
    // Merge default config with provided config
    const mapOptions: google.maps.MapOptions = {
      center: { 
        lat: config.defaultCenter?.lat || MAP_CONFIG.defaultCenter.lat, 
        lng: config.defaultCenter?.lng || MAP_CONFIG.defaultCenter.lng 
      },
      zoom: config.zoom || MAP_CONFIG.zoom,
      mapTypeId: config.mapTypeId,
      styles: config.styles,
      disableDefaultUI: config.disableDefaultUI,
      zoomControl: config.zoomControl,
      mapTypeControl: config.mapTypeControl,
      streetViewControl: config.streetViewControl,
      fullscreenControl: config.fullscreenControl
    };
    
    // Initialize the map
    const mapInstance = new google.maps.Map(mapElement, mapOptions);
    
    return {
      success: true,
      data: {
        map: mapInstance,
        elementId,
        config: mapOptions
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Create a Google Maps marker
 * 
 * This is a pure function that creates a Google Maps marker without modifying global state.
 * It can be triggered by an FSM state transition like:
 * MAP_READY -> MAP_UPDATING -> MAP_READY
 * 
 * @param position - The position (lat/lng) for the marker
 * @param options - Additional options for the marker
 * @param map - The map instance to add the marker to
 * @returns Result with marker, position, and options
 */
export function createMapMarker(
  position: Coordinates,
  options: Partial<MarkerOptions> = {},
  map: google.maps.Map
): Result<{
  marker: google.maps.Marker;
  position: Coordinates;
  options: Partial<MarkerOptions>;
}, Error> {
  try {
    // Validate input
    if (!position || position.lat === undefined || position.lng === undefined) {
      return {
        success: false,
        error: new Error('Valid position with lat and lng is required')
      };
    }
    
    if (!map) {
      return {
        success: false,
        error: new Error('Map instance is required')
      };
    }
    
    // Create the marker
    const marker = new google.maps.Marker({
      position,
      map,
      ...options
    });
    
    return {
      success: true,
      data: {
        marker,
        position,
        options
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Update map view (center and zoom)
 * 
 * This is a pure function that updates a Google Maps view without modifying global state.
 * It can be triggered by an FSM state transition like:
 * MAP_READY -> MAP_UPDATING -> MAP_READY
 * 
 * @param map - The map instance to update
 * @param position - The position (lat/lng) to center on
 * @param zoom - Optional zoom level to set
 * @returns Result with previous and current view state
 */
export function updateMapView(
  map: google.maps.Map,
  position: Coordinates,
  zoom: number | null = null
): Result<{
  previousCenter: google.maps.LatLng;
  previousZoom: number;
  currentCenter: google.maps.LatLng;
  currentZoom: number;
}, Error> {
  try {
    // Validate input
    if (!map) {
      return {
        success: false,
        error: new Error('Map instance is required')
      };
    }
    
    if (!position || position.lat === undefined || position.lng === undefined) {
      return {
        success: false,
        error: new Error('Valid position with lat and lng is required')
      };
    }
    
    // Store the previous view state
    const previousCenter = map.getCenter() || new google.maps.LatLng(0, 0);
    const previousZoom = map.getZoom() || 0;
    
    // Update the map center
    map.setCenter(position);
    
    // Update zoom if provided
    if (zoom !== null) {
      map.setZoom(zoom);
    }
    
    return {
      success: true,
      data: {
        previousCenter,
        previousZoom,
        currentCenter: map.getCenter() || new google.maps.LatLng(0, 0),
        currentZoom: map.getZoom() || 0
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Create a Google Maps bounds object from positions
 * 
 * This is a pure function that creates a bounds object without modifying global state.
 * It can be used as part of FSM state transitions in map view management.
 * 
 * @param positions - Array of positions to include in bounds
 * @returns Result with bounds object and metadata
 */
export function createMapBounds(
  positions: Coordinates[] = []
): Result<{
  bounds: google.maps.LatLngBounds;
  isEmpty: boolean;
  positionsCount: number;
}, Error> {
  try {
    // Validate input
    if (!Array.isArray(positions)) {
      return {
        success: false,
        error: new Error('Positions must be an array')
      };
    }
    
    // Create bounds object
    const bounds = new google.maps.LatLngBounds();
    let validPositionsCount = 0;
    
    // Add each valid position to the bounds
    positions.forEach(position => {
      if (position && (position.lat !== undefined && position.lng !== undefined)) {
        bounds.extend(position);
        validPositionsCount++;
      }
    });
    
    return {
      success: true,
      data: {
        bounds,
        isEmpty: validPositionsCount === 0,
        positionsCount: validPositionsCount
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Fit map to bounds
 * 
 * This is a pure function that adjusts a map view to fit given bounds without modifying global state.
 * It can be triggered by an FSM state transition like:
 * MAP_READY -> MAP_UPDATING -> MAP_READY
 * 
 * @param map - The map instance to update
 * @param bounds - The bounds to fit
 * @param options - Additional options for fitting bounds (padding, etc)
 * @returns Result with previous and current view state and bounds
 */
export function fitMapBounds(
  map: google.maps.Map,
  bounds: google.maps.LatLngBounds,
  options: { padding?: number | google.maps.Padding } = {}
): Result<{
  previousCenter: google.maps.LatLng;
  previousZoom: number;
  currentCenter: google.maps.LatLng;
  currentZoom: number;
  bounds: google.maps.LatLngBounds;
}, Error> {
  try {
    // Validate input
    if (!map) {
      return {
        success: false,
        error: new Error('Map instance is required')
      };
    }
    
    if (!bounds) {
      return {
        success: false,
        error: new Error('Bounds object is required')
      };
    }
    
    // Check if bounds is empty (no positions added)
    if (bounds.isEmpty()) {
      return {
        success: false,
        error: new Error('Cannot fit to empty bounds')
      };
    }
    
    // Store the previous view state
    const previousCenter = map.getCenter() || new google.maps.LatLng(0, 0);
    const previousZoom = map.getZoom() || 0;
    
    // Fit the map to the bounds
    map.fitBounds(bounds, options.padding);
    
    return {
      success: true,
      data: {
        previousCenter,
        previousZoom,
        currentCenter: map.getCenter() || new google.maps.LatLng(0, 0),
        currentZoom: map.getZoom() || 0,
        bounds
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Clear markers from the map
 * 
 * This is a pure function that removes markers from the map without modifying global collections.
 * It can be triggered by an FSM state transition like:
 * MAP_READY -> MAP_UPDATING -> MAP_READY
 * 
 * @param markers - Array of markers to clear
 * @returns Result with statistics about cleared markers
 */
export function clearMapMarkers(
  markers: google.maps.Marker[] = []
): Result<{
  totalMarkers: number;
  clearedCount: number;
  failedCount: number;
  clearedMarkers: google.maps.Marker[];
  failedMarkers: google.maps.Marker[];
}, Error> {
  try {
    // Validate input
    if (!Array.isArray(markers)) {
      return {
        success: false,
        error: new Error('Markers must be an array')
      };
    }
    
    // Track markers that were successfully cleared
    const clearedMarkers: google.maps.Marker[] = [];
    const failedMarkers: google.maps.Marker[] = [];
    
    // Remove each marker from the map
    markers.forEach(marker => {
      try {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
          clearedMarkers.push(marker);
        } else {
          failedMarkers.push(marker);
        }
      } catch (err) {
        failedMarkers.push(marker);
      }
    });
    
    return {
      success: true,
      data: {
        totalMarkers: markers.length,
        clearedCount: clearedMarkers.length,
        failedCount: failedMarkers.length,
        clearedMarkers,
        failedMarkers
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
