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
