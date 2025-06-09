/**
 * Location Service Module
 * Handles geolocation and address-related functionality
 * 
 * FSM State Patterns:
 * This module implements loose FSM patterns for future integration with a state machine.
 * 
 * Potential Location States:
 * - IDLE: Initial state, no location operations in progress
 * - FETCHING: Actively retrieving user location
 * - GEOCODING: Converting coordinates to address or vice versa
 * - READY: Location data successfully retrieved
 * - ERROR: Error occurred during location operations
 * 
 * State transitions are currently handled implicitly through Promise resolution/rejection.
 * Future FSM integration could make these transitions explicit.
 */

import { GOOGLE_MAPS_API_KEY, DEFAULT_LOCATION } from '../config.js';

/**
 * Get the user's current location using the Geolocation API
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: FETCHING
 * - Success Exit State: READY (implicit in Promise resolution)
 * - Error Exit State: ERROR (implicit in Promise rejection)
 * 
 * Future FSM Integration:
 * - Could return state object {state: 'READY', data: {lat, lng}} on success
 * - Could return state object {state: 'ERROR', error: Error} on failure
 * - Could emit state transition events for external subscribers
 * 
 * @returns {Promise} - Resolves with the user's location or rejects with an error
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Get postal code from coordinates using Google Maps Geocoding API
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: GEOCODING
 * - Success Exit States: 
 *   - READY (when postal code found)
 *   - PARTIAL (when API succeeds but no postal code found, returns 'Unknown')
 * - Error Exit State: ERROR (handled internally, returns 'Unknown')
 * 
 * Future FSM Integration:
 * - Could return {state: 'READY', data: postalCode} on success
 * - Could return {state: 'PARTIAL', data: 'Unknown'} when no postal code found
 * - Could return {state: 'ERROR', error: Error} and let caller handle errors
 * 
 * @param {number} latitude - The latitude
 * @param {number} longitude - The longitude
 * @returns {Promise<string>} - Resolves with the postal code or 'Unknown'
 */
async function getPostalCode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&channel=Nissan_US`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      // Extract postal code from the results
      let postalCode = 'Unknown';
      
      for (const result of data.results) {
        for (const component of result.address_components) {
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
            return postalCode;
          }
        }
      }
      
      return postalCode;
    } else {
      console.warn('Geocoding API response status:', data.status);
      return 'Unknown';
    }
  } catch (error) {
    console.error('Error getting postal code:', error);
    return 'Unknown';
  }
}

/**
 * Geocode a zip/postal code to get coordinates
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: GEOCODING
 * - Success Exit State: READY (implicit in Promise resolution)
 * - Error Exit State: ERROR (explicit throw, caught by caller)
 * 
 * Future FSM Integration:
 * - Could return {state: 'READY', data: {lat, lng, formattedAddress}} on success
 * - Could return {state: 'ERROR', error: Error} on failure
 * - Could handle errors internally and return consistent state objects
 * 
 * @param {string} zipCode - The zip/postal code to geocode
 * @returns {Promise} - Resolves with location data or rejects with an error
 */
async function geocodeZipCode(zipCode) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    } else {
      throw new Error(`Geocoding error: ${data.status}`);
    }
  } catch (error) {
    console.error('Error geocoding zip code:', error);
    throw error;
  }
}

/**
 * Get the default location
 * 
 * FSM State Pattern:
 * - This is a synchronous function with no state transitions
 * - Acts as a fallback when location services fail
 * 
 * Future FSM Integration:
 * - Could return {state: 'READY', data: defaultLocation} for consistency
 * - Could be part of a recovery action in the state machine
 * 
 * @returns {Object} - The default location
 */
function getDefaultLocation() {
  return {
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
    name: DEFAULT_LOCATION.name
  };
}

// Export public methods
export {
  getCurrentLocation,
  getPostalCode,
  geocodeZipCode,
  getDefaultLocation
};
