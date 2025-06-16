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

import { DEFAULT_LOCATION, GOOGLE_MAPS_API_KEY } from '../config';

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

/**
 * Geocode an address (including zip/postal codes) to coordinates
 * 
 * This is a pure function that converts an address string to geographic coordinates
 * using the Google Maps Geocoding API. It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_GEOCODING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @param {string} address - The address to geocode (can be a zip/postal code)
 * @param {string} apiKey - Google Maps API key (optional, uses config by default)
 * @returns {Promise<Object>} - Result object with success, data, and error properties
 */
export async function geocodeAddress(address, apiKey = GOOGLE_MAPS_API_KEY) {
  try {
    // Validate input
    if (!address) {
      return {
        success: false,
        error: new Error('Address is required')
      };
    }
    
    if (!apiKey) {
      return {
        success: false,
        error: new Error('Google Maps API key is required')
      };
    }
    
    // Make the geocoding API request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // Process the response
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      return {
        success: true,
        data: {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id
        }
      };
    } else {
      return {
        success: false,
        error: new Error(`Geocoding error: ${data.status}`),
        errorDetails: data
      };
    }
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * Reverse geocode coordinates to address components
 * 
 * This is a pure function that converts geographic coordinates to address components
 * using the Google Maps Geocoding API. It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_GEOCODING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {string} apiKey - Google Maps API key (optional, uses config by default)
 * @returns {Promise<Object>} - Result object with success, data, and error properties
 */
export async function reverseGeocode(latitude, longitude, apiKey = GOOGLE_MAPS_API_KEY) {
  try {
    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return {
        success: false,
        error: new Error('Latitude and longitude are required')
      };
    }
    
    if (!apiKey) {
      return {
        success: false,
        error: new Error('Google Maps API key is required')
      };
    }
    
    // Make the reverse geocoding API request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // Process the response
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Extract all address components
      const addressComponents = {};
      const postalCode = { found: false, value: 'Unknown' };
      
      // Process all results to find postal code and other components
      for (const result of data.results) {
        for (const component of result.address_components) {
          // Store each component by its type
          component.types.forEach(type => {
            if (!addressComponents[type]) {
              addressComponents[type] = component.long_name;
            }
            
            // Special handling for postal code
            if (type === 'postal_code' && !postalCode.found) {
              postalCode.found = true;
              postalCode.value = component.long_name;
            }
          });
        }
        
        // If we found a postal code, no need to check further results
        if (postalCode.found) break;
      }
      
      return {
        success: true,
        data: {
          formattedAddress: data.results[0].formatted_address,
          addressComponents,
          postalCode: postalCode.value,
          placeId: data.results[0].place_id
        }
      };
    } else {
      return {
        success: false,
        error: new Error(`Reverse geocoding error: ${data.status}`),
        errorDetails: data
      };
    }
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}
