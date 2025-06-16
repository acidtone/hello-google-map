/**
 * Map Actions Module
 * 
 * This module contains pure action functions related to map operations.
 * These functions are designed to be triggered by FSM state transitions and don't
 * directly modify UI or global state. Each function returns a result object with
 * a consistent structure.
 * 
 * Result object structure:
 * {
 *   success: boolean,  // Whether the action was successful
 *   data?: any,        // Optional data returned by the action
 *   error?: Error      // Optional error information if success is false
 * }
 */

import { MAP_CONFIG } from '../config';

/**
 * Initialize a Google Maps instance
 * 
 * This is a pure function that initializes a Google Maps instance without
 * modifying global state. It can be triggered by an FSM state transition like:
 * MAP_UNINITIALIZED -> MAP_INITIALIZING -> MAP_READY/MAP_ERROR
 * 
 * @param {string} elementId - The ID of the DOM element to contain the map
 * @param {Object} config - Optional configuration to override defaults
 * @returns {Object} - Result object with success, data, and error properties
 */
export function initializeGoogleMap(elementId, config = {}) {
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
    const mapOptions = {
      center: { 
        lat: config.center?.lat || MAP_CONFIG.defaultCenter.lat, 
        lng: config.center?.lng || MAP_CONFIG.defaultCenter.lng 
      },
      zoom: config.zoom || MAP_CONFIG.zoom,
      ...config.additionalOptions
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
  } catch (error) {
    return {
      success: false,
      error
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
 * @param {Object} position - The position (lat/lng) for the marker
 * @param {Object} options - Additional options for the marker
 * @param {google.maps.Map} map - The map instance to add the marker to
 * @returns {Object} - Result object with success, data, and error properties
 */
export function createMapMarker(position, options = {}, map) {
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
  } catch (error) {
    return {
      success: false,
      error
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
 * @param {google.maps.Map} map - The map instance to update
 * @param {Object} position - The position (lat/lng) to center on
 * @param {number|null} zoom - Optional zoom level to set
 * @returns {Object} - Result object with success, data, and error properties
 */
export function updateMapView(map, position, zoom = null) {
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
    
    // Update the map center
    map.setCenter(position);
    
    // Update zoom if provided
    if (zoom !== null) {
      if (typeof zoom !== 'number' || zoom < 0) {
        return {
          success: false,
          error: new Error('Zoom must be a non-negative number')
        };
      }
      
      map.setZoom(zoom);
    }
    
    return {
      success: true,
      data: {
        position,
        zoom: zoom !== null ? zoom : map.getZoom(),
        previousZoom: zoom !== null ? map.getZoom() : null
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * Create a Google Maps bounds object from positions
 * 
 * This is a pure function that creates a bounds object without modifying global state.
 * It can be used as part of FSM state transitions in map view management.
 * 
 * @param {Array} positions - Array of positions to include in bounds
 * @returns {Object} - Result object with success, data, and error properties
 */
export function createMapBounds(positions = []) {
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
  } catch (error) {
    return {
      success: false,
      error
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
 * @param {google.maps.Map} map - The map instance to update
 * @param {google.maps.LatLngBounds} bounds - The bounds to fit
 * @param {Object} options - Additional options for fitting bounds (padding, etc)
 * @returns {Object} - Result object with success, data, and error properties
 */
export function fitMapBounds(map, bounds, options = {}) {
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
    const previousCenter = map.getCenter();
    const previousZoom = map.getZoom();
    
    // Fit the map to the bounds
    map.fitBounds(bounds, options.padding);
    
    return {
      success: true,
      data: {
        previousCenter,
        previousZoom,
        currentCenter: map.getCenter(),
        currentZoom: map.getZoom(),
        bounds
      }
    };
  } catch (error) {
    return {
      success: false,
      error
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
 * @param {Array} markers - Array of markers to clear
 * @returns {Object} - Result object with success, data, and error properties
 */
export function clearMapMarkers(markers = []) {
  try {
    // Validate input
    if (!Array.isArray(markers)) {
      return {
        success: false,
        error: new Error('Markers must be an array')
      };
    }
    
    // Track markers that were successfully cleared
    const clearedMarkers = [];
    const failedMarkers = [];
    
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
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}
