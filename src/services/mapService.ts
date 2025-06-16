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

import { GOOGLE_MAPS_API_KEY, MAP_CONFIG, MAPS_API_CONFIG } from '../config';
import { clearBusinessData } from '../actions/businessActions';
import { initializeGoogleMap, createMapMarker, updateMapView, createMapBounds, fitMapBounds, clearMapMarkers } from '../actions/mapActions';

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
 * - Error Exit State: ERROR (explicit state transition)
 * 
 * Now uses the initializeGoogleMap action function for map creation,
 * while maintaining state management in this service.
 * 
 * @param {string} elementId - The ID of the DOM element to contain the map
 * @returns {google.maps.Map} - The initialized map instance
 */
function initializeMap(elementId) {
  // Set state to INITIALIZING at the beginning
  currentMapState = MapState.INITIALIZING;
  
  if (!map) {
    try {
      // Use the initializeGoogleMap action function
      const result = initializeGoogleMap(elementId);
      
      if (result.success) {
        // Store the map instance
        map = result.data.map;
        
        // Set state to READY after map is created
        currentMapState = MapState.READY;
      } else {
        // Set state to ERROR if initialization fails
        currentMapState = MapState.ERROR;
        console.error('Map initialization failed:', result.error);
      }
    } catch (error) {
      // Set state to ERROR if any exception occurs
      currentMapState = MapState.ERROR;
      console.error('Map initialization failed:', error);
    }
  }
  return map;
}

/**
 * Get the current map instance
 * 
 * FSM State Pattern:
 * - This is a state query function that returns the current map instance
 * - Provides warnings based on current state
 * - Still allows access to map in any state for backward compatibility
 * 
 * Future FSM Integration:
 * - Could return {state: currentMapState, map: map}
 * - Could throw errors or return null for invalid states
 * 
 * @returns {google.maps.Map|null} - The current map instance or null if not initialized
 */
function getMap() {
  // Check if we're in a valid state to return the map
  if (currentMapState === MapState.ERROR) {
    console.warn('Map is in ERROR state and may not be usable');
  } else if (currentMapState === MapState.INITIALIZING) {
    console.warn('Map is still initializing and may not be ready');
  } else if (currentMapState === MapState.UNINITIALIZED) {
    console.warn('Map has not been initialized yet');
  }
  
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
 * - Error Exit State: ERROR (with explicit state transition)
 * 
 * Now uses the createMapMarker action function while maintaining
 * state management in this service.
 * 
 * @param {Object} position - The position (lat/lng) for the marker
 * @param {Object} options - Additional options for the marker
 * @param {string} markerType - Type of marker ('user' or 'business')
 * @returns {google.maps.Marker} - The created marker or null if operation fails
 */
function addMarker(position, options = {}, markerType = 'business') {
  // Check if map is initialized
  if (!map) {
    console.error('Map not initialized');
    return null;
  }

  // Set state to UPDATING before adding marker
  currentMapState = MapState.UPDATING;

  try {
    // Use the createMapMarker action function
    const result = createMapMarker(position, options, map);
    
    if (result.success) {
      const marker = result.data.marker;
      
      // Add to appropriate collection based on type
      markers.push(marker); // Add to legacy array for backward compatibility
      
      if (markerType === 'user') {
        userMarkers.push(marker);
      } else {
        businessMarkers.push(marker);
      }
      
      // Set state back to READY after marker is added
      currentMapState = MapState.READY;
      
      return marker;
    } else {
      // Set state to ERROR if creating marker fails
      currentMapState = MapState.ERROR;
      console.error('Failed to create marker:', result.error);
      return null;
    }
  } catch (error) {
    // Set state to ERROR if any exception occurs
    currentMapState = MapState.ERROR;
    console.error('Failed to add marker:', error);
    return null;
  }
}

/**
 * Clear all markers from the map
 * 
 * FSM State Pattern:
 * - Entry State: READY
 * - During Execution: UPDATING (clearing markers)
 * - Success Exit State: READY (with no markers)
 * - Error Exit State: ERROR (with explicit state transition)
 * 
 * Now uses the clearMapMarkers action function while maintaining
 * state management in this service.
 * 
 * @param {string} type - Type of markers to clear ('all', 'user', or 'business')
 */
function clearMarkers(type = 'all') {
  // Set state to UPDATING before clearing markers
  currentMapState = MapState.UPDATING;
  
  try {
    let markersToRemove = [];
    
    if (type === 'all' || type === 'user') {
      markersToRemove = [...markersToRemove, ...userMarkers];
      userMarkers = [];
    }
    
    if (type === 'all' || type === 'business') {
      markersToRemove = [...markersToRemove, ...businessMarkers];
      businessMarkers = [];
    }
    
    // Use the clearMapMarkers action function
    const result = clearMapMarkers(markersToRemove);
    
    if (result.success) {
      // Log any markers that failed to clear
      if (result.data.failedCount > 0) {
        console.warn(`Failed to clear ${result.data.failedCount} markers`);
      }
      
      // Reset the legacy markers array if clearing all
      if (type === 'all') {
        markers = [];
      } else {
        // Otherwise, filter out the removed markers
        markers = markers.filter(marker => !markersToRemove.includes(marker));
      }
      
      // Set state back to READY after markers are cleared
      currentMapState = MapState.READY;
    } else {
      // Set state to ERROR if clearing markers fails
      currentMapState = MapState.ERROR;
      console.error('Failed to clear markers:', result.error);
    }
  } catch (error) {
    // Set state to ERROR if any exception occurs
    currentMapState = MapState.ERROR;
    console.error('Failed to clear markers:', error);
  }
}

/**
 * Clear only business markers from the map
 * 
 * Now uses the clearBusinessData action function to ensure business data
 * state is properly managed alongside UI marker clearing.
 */
function clearBusinessMarkers() {
  // Call the pure action function first
  const result = clearBusinessData();
  
  // If the action was successful, proceed with UI marker clearing
  if (result.success) {
    clearMarkers('business');
  } else if (result.error) {
    console.error('Error clearing business data:', result.error);
  }
}

/**
 * Clear only user markers from the map
 */
function clearUserMarkers() {
  clearMarkers('user');
}

/**
 * Set the map center and zoom level
 * 
 * FSM State Pattern:
 * - Entry State: READY
 * - During Execution: UPDATING (changing view)
 * - Success Exit State: READY (with new center/zoom)
 * - Error Exit State: ERROR (with explicit state transition)
 * 
 * Now uses the updateMapView action function while maintaining
 * state management in this service.
 * 
 * @param {Object} position - The position (lat/lng) to center on
 * @param {number} zoom - The zoom level (optional)
 */
function setCenter(position, zoom = null) {
  if (!map) {
    console.error('Map not initialized');
    return;
  }

  // Set state to UPDATING before changing the map view
  currentMapState = MapState.UPDATING;

  try {
    // Use the updateMapView action function
    const result = updateMapView(map, position, zoom);
    
    if (result.success) {
      // Set state back to READY after view is updated
      currentMapState = MapState.READY;
    } else {
      // Set state to ERROR if updating view fails
      currentMapState = MapState.ERROR;
      console.error('Failed to update map view:', result.error);
    }
  } catch (error) {
    // Set state to ERROR if any exception occurs
    currentMapState = MapState.ERROR;
    console.error('Failed to update map view:', error);
  }
}

/**
 * Create a bounds object and extend it with the given positions
 * 
 * FSM State Pattern:
 * - This is a utility function with no state transitions
 * - Prepares data for state transitions in other functions
 * 
 * Now uses the createMapBounds action function while maintaining
 * the same return type for backward compatibility.
 * 
 * @param {Array} positions - Array of positions to include in bounds
 * @returns {google.maps.LatLngBounds} - The created bounds
 */
function createBounds(positions = []) {
  // Use the createMapBounds action function
  const result = createMapBounds(positions);
  
  if (result.success) {
    return result.data.bounds;
  } else {
    // Fallback to original implementation if action function fails
    console.error('Failed to create bounds:', result.error);
    const bounds = new google.maps.LatLngBounds();
    
    positions.forEach(position => {
      if (position) {
        bounds.extend(position);
      }
    });
    
    return bounds;
  }
}

/**
 * Fit the map to the given bounds
 * 
 * FSM State Pattern:
 * - Entry State: READY
 * - During Execution: UPDATING (changing view)
 * - Success Exit State: READY (with view adjusted to bounds)
 * - Error Exit State: ERROR (with explicit state transition)
 * 
 * Now uses the fitMapBounds action function while maintaining
 * state management in this service.
 * 
 * @param {google.maps.LatLngBounds} bounds - The bounds to fit
 * @param {Object} options - Additional options for fitting bounds
 */
function fitBounds(bounds, options = {}) {
  if (!map) {
    console.error('Map not initialized');
    return;
  }
  
  // Set state to UPDATING before changing the map view
  currentMapState = MapState.UPDATING;
  
  try {
    // Use the fitMapBounds action function
    const result = fitMapBounds(map, bounds, options);
    
    if (result.success) {
      // Set state back to READY after view is updated
      currentMapState = MapState.READY;
    } else {
      // Set state to ERROR if updating view fails
      currentMapState = MapState.ERROR;
      console.error('Failed to fit bounds:', result.error);
    }
  } catch (error) {
    // Set state to ERROR if any exception occurs
    currentMapState = MapState.ERROR;
    console.error('Failed to fit bounds:', error);
  }
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
