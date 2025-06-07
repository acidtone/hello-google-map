/**
 * Map Service Module
 * Encapsulates map initialization and operations
 */

import { GOOGLE_MAPS_API_KEY, MAP_CONFIG, MAPS_API_CONFIG } from '../config.js';

// Private variables for the module
let map = null;
let markers = [];
let activeInfoWindow = null;

/**
 * Initialize the map with the given element ID
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
 * @returns {google.maps.Map|null} - The current map instance or null if not initialized
 */
function getMap() {
  return map;
}

/**
 * Add a marker to the map
 * @param {Object} position - The position (lat/lng) for the marker
 * @param {Object} options - Additional options for the marker
 * @returns {google.maps.Marker} - The created marker
 */
function addMarker(position, options = {}) {
  if (!map) {
    console.error('Map not initialized');
    return null;
  }

  const marker = new google.maps.Marker({
    position,
    map,
    ...options
  });

  markers.push(marker);
  return marker;
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}

/**
 * Set the map center and zoom level
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

// Export public methods
export {
  initializeMap,
  getMap,
  addMarker,
  clearMarkers,
  setCenter,
  createBounds,
  fitBounds,
  createInfoWindow,
  openInfoWindow,
  closeActiveInfoWindow,
  getMarkers
};
