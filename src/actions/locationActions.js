/**
 * Location Actions Module
 * 
 * This module contains pure action functions related to location operations.
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

import { DEFAULT_LOCATION } from '../config.js';

/**
 * Fetch user's geolocation data using browser's Geolocation API
 * 
 * This is a pure function that doesn't modify global state or UI.
 * It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_FETCHING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @returns {Promise<Object>} - Result object with success, data, and error properties
 */
export function fetchGeolocationData() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: new Error('Geolocation is not supported by this browser.')
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: 'Geolocation API'
          }
        });
      },
      (error) => {
        resolve({
          success: false,
          error: error
        });
      }
    );
  });
}

/**
 * Fetch default location from configuration
 * 
 * This is a pure function that returns the default location when geolocation fails.
 * It can be triggered by an FSM state transition like:
 * LOCATION_ERROR -> LOCATION_FALLBACK -> LOCATION_READY
 * 
 * @returns {Object} - Result object with success and data properties
 */
export function fetchDefaultLocation() {
  try {
    // Validate that default location is properly configured
    if (!DEFAULT_LOCATION || typeof DEFAULT_LOCATION.lat !== 'number' || typeof DEFAULT_LOCATION.lng !== 'number') {
      return {
        success: false,
        error: new Error('Default location is not properly configured')
      };
    }
    
    return {
      success: true,
      data: {
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
        name: DEFAULT_LOCATION.name || 'Default Location',
        source: 'Default Configuration'
      }
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}
