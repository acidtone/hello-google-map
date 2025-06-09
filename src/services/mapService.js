/**
 * Map Service Module
 * Encapsulates map initialization and operations
 * 
 * FSM State Patterns:
 * This module implements loose FSM patterns for future integration with a state machine.
 * 
 * Potential Map States:
 * - UNINITIALIZED: Initial state, map not yet created
 * - INITIALIZING: Map creation in progress
 * - READY: Map successfully created and ready for operations
 * - ERROR: Error occurred during map operations
 * - UPDATING: Map is being updated (markers, bounds, etc.)
 * 
 * State transitions are currently handled implicitly through function calls.
 * Future FSM integration could make these transitions explicit.
 */

import { GOOGLE_MAPS_API_KEY, MAP_CONFIG, MAPS_API_CONFIG } from '../config.js';

/**
 * Map state constants
 * These represent the possible states of the map service
 */
const MapState = {
  UNINITIALIZED: 'UNINITIALIZED',  // Initial state, map not yet created
  INITIALIZING: 'INITIALIZING',    // Map creation in progress
  READY: 'READY',                  // Map successfully created and ready for operations
  ERROR: 'ERROR',                  // Error occurred during map operations
  UPDATING: 'UPDATING'             // Map is being updated (markers, bounds, etc.)
};

// Private variables for the module
let map = null;
let markers = []; // Legacy array for backward compatibility
let userMarkers = []; // Array to store user location markers
let businessMarkers = []; // Array to store business markers
let activeInfoWindow = null;

// Track the current state of the map service
let currentMapState = MapState.UNINITIALIZED;

/**
 * Initialize the map with the given element ID
 * 
 * FSM State Pattern:
 * - Entry State: UNINITIALIZED
 * - During Execution: INITIALIZING
 * - Success Exit State: READY (map instance created)
 * - Error Exit State: ERROR (implicit in console.error)
 * 
 * Future FSM Integration:
 * - Could track state explicitly: let mapState = 'INITIALIZING'
 * - Could return {state: 'READY', map: mapInstance} on success
 * - Could throw errors with state information for FSM error handling
 * 
 * @param {string} elementId - The ID of the DOM element to contain the map
 * @returns {google.maps.Map} - The initialized map instance
 */
function initializeMap(elementId) {
  if (!map) {
    map = new google.maps.Map(document.getElementById(elementId), {
      center: { lat: MAP_CONFIG.defaultCenter.lat, lng: MAP_CONFIG.defaultCenter.lng },
      zoom: MAP_CONFIG.zoom,
    });
  }
  return map;
}

/**
 * Get the current map instance
 * 
 * FSM State Pattern:
 * - This is a state query function that returns the current map instance
 * - Implicitly indicates whether state is UNINITIALIZED (null) or READY (map instance)
 * 
 * Future FSM Integration:
 * - Could return {state: map ? 'READY' : 'UNINITIALIZED', map: map}
 * - Could be used by state machine to determine current state
 * 
 * @returns {google.maps.Map|null} - The current map instance or null if not initialized
 */
function getMap() {
  return map;
}

/**
 * Get the current state of the map service
 * 
 * This function provides explicit state information that can be used
 * by other modules to make decisions based on the map's current state.
 * 
 * @returns {string} - The current state of the map service
 */
function getMapState() {
  return currentMapState;
}

/**
 * Add a marker to the map
 * 
 * FSM State Pattern:
 * - Entry State: READY (map must be initialized)
 * - During Execution: UPDATING (adding marker)
 * - Success Exit State: READY (marker added)
 * - Error Exit State: ERROR (implicit in console.error)
 * 
 * Future FSM Integration:
 * - Could check map state before execution
 * - Could return {state: 'MARKER_ADDED', marker: markerInstance}
 * - Could emit events for marker creation
 * 
 * @param {Object} position - The position (lat/lng) for the marker
 * @param {Object} options - Additional options for the marker
 * @param {string} markerType - Type of marker ('user' or 'business')
 * @returns {google.maps.Marker} - The created marker
 */
function addMarker(position, options = {}, markerType = 'business') {
  if (!map) {
    console.error('Map not initialized');
    return null;
  }

  const marker = new google.maps.Marker({
    position,
    map,
    ...options
  });

  // Add to appropriate collection based on type
  markers.push(marker); // Add to legacy array for backward compatibility
  
  if (markerType === 'user') {
    userMarkers.push(marker);
  } else {
    businessMarkers.push(marker);
  }
  
  return marker;
}

/**
 * Clear all markers from the map
 * 
 * FSM State Pattern:
 * - Entry State: READY (with markers)
 * - During Execution: UPDATING (clearing markers)
 * - Exit State: READY (without markers)
 * 
 * Future FSM Integration:
 * - Could emit a 'MARKERS_CLEARED' event
 * - Could be triggered by state machine transitions
 * - Could return state information: {state: 'MARKERS_CLEARED', count: removedCount}
 */
function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
  userMarkers = [];
  businessMarkers = [];
}

/**
 * Clear only business markers from the map
 */
function clearBusinessMarkers() {
  // Remove business markers from the map
  for (let i = 0; i < businessMarkers.length; i++) {
    businessMarkers[i].setMap(null);
  }
  
  // Also remove them from the legacy markers array
  markers = markers.filter(marker => !businessMarkers.includes(marker));
  
  // Clear the business markers array
  businessMarkers = [];
}

/**
 * Clear only user markers from the map
 */
function clearUserMarkers() {
  // Remove user markers from the map
  for (let i = 0; i < userMarkers.length; i++) {
    userMarkers[i].setMap(null);
  }
  
  // Also remove them from the legacy markers array
  markers = markers.filter(marker => !userMarkers.includes(marker));
  
  // Clear the user markers array
  userMarkers = [];
}

/**
 * Set the map center and zoom level
 * 
 * FSM State Pattern:
 * - Entry State: READY
 * - During Execution: UPDATING (changing view)
 * - Success Exit State: READY (with new center/zoom)
 * - Error Exit State: ERROR (implicit in console.error)
 * 
 * Future FSM Integration:
 * - Could emit a 'VIEW_CHANGED' event
 * - Could track view state separately from map state
 * - Could be part of a user interaction state machine
 * 
 * @param {Object} position - The position (lat/lng) to center on
 * @param {number} zoom - The zoom level (optional)
 */
function setCenter(position, zoom = null) {
  if (!map) {
    console.error('Map not initialized');
    return;
  }

  map.setCenter(position);
  if (zoom !== null) {
    map.setZoom(zoom);
  }
}

/**
 * Create a bounds object and extend it with the given positions
 * 
 * FSM State Pattern:
 * - This is a utility function with no state transitions
 * - Prepares data for state transitions in other functions
 * 
 * Future FSM Integration:
 * - Could be part of a map view state management system
 * - Could track bounds as part of application state
 * 
 * @param {Array} positions - Array of positions to include in bounds
 * @returns {google.maps.LatLngBounds} - The created bounds
 */
function createBounds(positions = []) {
  const bounds = new google.maps.LatLngBounds();
  
  positions.forEach(position => {
    if (position) {
      bounds.extend(position);
    }
  });
  
  return bounds;
}

/**
 * Fit the map to the given bounds
 * @param {google.maps.LatLngBounds} bounds - The bounds to fit
 */
function fitBounds(bounds) {
  if (!map) {
    console.error('Map not initialized');
    return;
  }

  map.fitBounds(bounds);
}

/**
 * Create an info window
 * @param {string} content - The content for the info window
 * @returns {google.maps.InfoWindow} - The created info window
 */
function createInfoWindow(content) {
  return new google.maps.InfoWindow({
    content
  });
}

/**
 * Open an info window at the given marker
 * @param {google.maps.InfoWindow} infoWindow - The info window to open
 * @param {google.maps.Marker} marker - The marker to attach the info window to
 */
function openInfoWindow(infoWindow, marker) {
  if (activeInfoWindow) {
    activeInfoWindow.close();
  }
  
  infoWindow.open(map, marker);
  activeInfoWindow = infoWindow;
}

/**
 * Close the active info window if one exists
 */
function closeActiveInfoWindow() {
  if (activeInfoWindow) {
    activeInfoWindow.close();
    activeInfoWindow = null;
  }
}

/**
 * Get all current markers
 * @returns {Array} - Array of current markers
 */
function getMarkers() {
  return markers;
}

// Export public functions
export {
  // Map state constants
  MapState,
  
  // Core map functions
  initializeMap,
  getMap,
  getMapState,
  
  // Marker management
  addMarker,
  clearMarkers as clearAllMarkers,
  clearBusinessMarkers,
  clearUserMarkers,
  getMarkers,
  
  // Map view management
  setCenter,
  createBounds,
  fitBounds,
  
  // Info window management
  createInfoWindow,
  openInfoWindow,
  closeActiveInfoWindow
};
