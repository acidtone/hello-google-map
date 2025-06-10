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

import { MAP_CONFIG } from '../config.js';

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
