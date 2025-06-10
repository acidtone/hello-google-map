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
 * State transitions are now handled explicitly through state variable updates.
 * Future FSM integration could build on these explicit states.
 */

import { GOOGLE_MAPS_API_KEY, DEFAULT_LOCATION } from '../config.js';

/**
 * Location state constants
 * These represent the possible states of the location service
 */
const LocationState = {
  IDLE: 'IDLE',           // Initial state, no location operations in progress
  FETCHING: 'FETCHING',   // Actively retrieving user location
  GEOCODING: 'GEOCODING', // Converting coordinates to address or vice versa
  READY: 'READY',         // Location data successfully retrieved
  ERROR: 'ERROR'          // Error occurred during location operations
};

// Track the current state of the location service
let currentLocationState = LocationState.IDLE;

/**
 * Get the current state of the location service
 * 
 * This function provides explicit state information that can be used
 * by other modules to make decisions based on the location service's current state.
 * 
 * @returns {string} - The current state of the location service
 */
function getLocationState() {
  return currentLocationState;
}

/**
 * Get the user's current location using the Geolocation API
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: FETCHING
 * - Success Exit State: READY (explicit state transition)
 * - Error Exit State: ERROR (explicit state transition)
 * 
 * Future FSM Integration:
 * - Could return state object {state: 'READY', data: {lat, lng}} on success
 * - Could return state object {state: 'ERROR', error: Error} on failure
 * - Could emit state transition events for external subscribers
 * 
 * @returns {Promise} - Resolves with the user's location or rejects with an error
 */
function getCurrentLocation() {
  // Set state to FETCHING at the beginning
  currentLocationState = LocationState.FETCHING;
  
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Set state to ERROR if geolocation is not supported
      currentLocationState = LocationState.ERROR;
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Set state to READY on success
        currentLocationState = LocationState.READY;
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        // Set state to ERROR on failure
        currentLocationState = LocationState.ERROR;
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
 *   - READY (when API succeeds but no postal code found, returns 'Unknown')
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
  // Set state to GEOCODING at the beginning
  currentLocationState = LocationState.GEOCODING;
  
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
            // Set state to READY when postal code is found
            currentLocationState = LocationState.READY;
            return postalCode;
          }
        }
      }
      
      // Set state to READY even if postal code is 'Unknown'
      currentLocationState = LocationState.READY;
      return postalCode;
    } else {
      console.warn('Geocoding API response status:', data.status);
      // Set state to ERROR for API error
      currentLocationState = LocationState.ERROR;
      return 'Unknown';
    }
  } catch (error) {
    console.error('Error getting postal code:', error);
    // Set state to ERROR on exception
    currentLocationState = LocationState.ERROR;
    return 'Unknown';
  }
}

/**
 * Geocode a zip/postal code to get coordinates
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: GEOCODING
 * - Success Exit State: READY (explicit state transition)
 * - Error Exit State: ERROR (explicit state transition)
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
  // Set state to GEOCODING at the beginning
  currentLocationState = LocationState.GEOCODING;
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      // Set state to READY on success
      currentLocationState = LocationState.READY;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    } else {
      // Set state to ERROR for API error
      currentLocationState = LocationState.ERROR;
      throw new Error(`Geocoding error: ${data.status}`);
    }
  } catch (error) {
    // Set state to ERROR on exception
    currentLocationState = LocationState.ERROR;
    console.error('Error geocoding zip code:', error);
    throw error;
  }
}

/**
 * Get the default location
 * 
 * FSM State Pattern:
 * - This is a synchronous function that doesn't change the location state
 * - Acts as a fallback when location services fail
 * - Typically called when state is already ERROR to provide recovery
 * 
 * Future FSM Integration:
 * - Could set state to READY with a 'fallback' flag
 * - Could return {state: 'READY', source: 'default', data: defaultLocation}
 * - Could be part of a formal recovery action in the state machine
 * 
 * @returns {Object} - The default location
 */
function getDefaultLocation() {
  // Note: We don't change state here as this is typically called
  // after an error has already occurred and state is already set to ERROR
  return {
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
    name: DEFAULT_LOCATION.name
  };
}

// Export public methods
export {
  // State constants and management
  LocationState,
  getLocationState,
  
  // Location functions
  getCurrentLocation,
  getPostalCode,
  geocodeZipCode,
  getDefaultLocation
};
