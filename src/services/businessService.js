/**
 * Business Service Module
 * Handles fetching and managing business data and marker interactions
 * 
 * FSM State Patterns:
 * This module implements loose FSM patterns for future integration with a state machine.
 * 
 * Potential Business States:
 * - IDLE: Initial state, no business operations in progress
 * - SEARCHING: Actively searching for nearby businesses
 * - READY: Business data successfully retrieved
 * - ERROR: Error occurred during business operations
 * - INTERACTING: User is interacting with business markers/listings
 * 
 * State transitions are currently handled implicitly through Promise resolution/rejection.
 * Future FSM integration could make these transitions explicit.
 */

import { FOURSQUARE_API_KEY } from '../config.js';
import { handleError } from './errorService.js';

/**
 * Get nearby businesses using Foursquare Places API
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: SEARCHING
 * - Success Exit States: 
 *   - READY (when businesses found)
 *   - EMPTY (when no businesses found but API call succeeded)
 * - Error Exit State: ERROR (handled internally, returns empty array)
 * 
 * Future FSM Integration:
 * - Could return {state: 'READY', data: businessArray} on success
 * - Could return {state: 'ERROR', error: errorInfo} on failure
 * - Could emit state transition events for external subscribers
 * 
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} limit - Maximum number of businesses to return
 * @returns {Promise<Array>} - Array of business objects
 */
async function getNearbyBusinesses(latitude, longitude, limit = 4) {
  try {
    // Validate Foursquare API key configuration
    if (!FOURSQUARE_API_KEY || FOURSQUARE_API_KEY === 'PLACEHOLDER_API_KEY') {
      throw new Error('Foursquare API key is missing. Please check your .env file.');
    }
    
    // Foursquare API endpoint for nearby places
    const url = 'https://api.foursquare.com/v3/places/search';
    
    // Query parameters
    const params = new URLSearchParams({
      ll: `${latitude},${longitude}`,
      radius: 1000, // 1000 meters radius
      limit: limit,
      categories: '13000,13065,17000,17062', // Food, Restaurants, Shops, etc.
      sort: 'DISTANCE',
      fields: 'fsq_id,name,location,geocodes,website,tel,categories'
    });
    
    // Make the API request
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    // Use FSM-compatible error handling
    const errorInfo = handleError(error, 'business_search');
    console.error('Error fetching nearby businesses:', error, errorInfo);
    return [];
  }
}

/**
 * Create default and highlighted marker icons for businesses
 * 
 * FSM State Pattern:
 * - This is a synchronous function with no state transitions
 * - Provides resources for UI state changes (highlighted vs. non-highlighted)
 * 
 * Future FSM Integration:
 * - Could be part of a UI state manager that tracks marker visual states
 * 
 * @returns {Object} - Object containing default and highlighted icon configurations
 */
function createBusinessMarkerIcons() {
  return {
    default: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#EA4335',
      fillOpacity: 1,
      scale: 10,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      labelOrigin: new google.maps.Point(0, 0)
    },
    highlighted: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4', // Google blue
      fillOpacity: 1,
      scale: 10,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      labelOrigin: new google.maps.Point(0, 0)
    }
  };
}

/**
 * Setup two-way hover interactions between a marker and list item
 * 
 * FSM State Pattern:
 * - Sets up event listeners that trigger UI state transitions:
 *   - IDLE -> HOVERING -> IDLE
 * - These micro-states are currently handled implicitly through DOM events
 * 
 * Future FSM Integration:
 * - Could emit state change events: {uiState: 'MARKER_HOVER', id: markerId}
 * - Could subscribe to external state changes
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and icon information
 */
function setupMarkerListItemInteraction(markerInfo) {
  const { marker, listItem, defaultIcon, highlightedIcon } = markerInfo;
  
  // List item hover effects
  listItem.addEventListener('mouseenter', () => {
    highlightMarkerAndListItem(markerInfo, true);
  });
  
  listItem.addEventListener('mouseleave', () => {
    highlightMarkerAndListItem(markerInfo, false);
  });
  
  // Marker hover effects
  marker.addListener('mouseover', () => {
    highlightMarkerAndListItem(markerInfo, true);
  });
  
  marker.addListener('mouseout', () => {
    highlightMarkerAndListItem(markerInfo, false);
  });
}

/**
 * Highlight or unhighlight a marker and its corresponding list item
 * 
 * FSM State Pattern:
 * - Implements UI state transitions between:
 *   - NOT_HIGHLIGHTED (default state)
 *   - HIGHLIGHTED (active state)
 * 
 * Future FSM Integration:
 * - Could be triggered by state machine transitions
 * - Could emit UI state change events
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and icon information
 * @param {boolean} highlight - Whether to highlight or unhighlight
 */
function highlightMarkerAndListItem(markerInfo, highlight) {
  const { marker, listItem, defaultIcon, highlightedIcon } = markerInfo;
  
  if (highlight) {
    // Highlight marker
    marker.setIcon(highlightedIcon);
    // Highlight list item
    listItem.classList.add('highlighted');
  } else {
    // Unhighlight marker
    marker.setIcon(defaultIcon);
    // Unhighlight list item
    listItem.classList.remove('highlighted');
  }
}

/**
 * Setup click interaction for a business marker and list item
 * 
 * FSM State Pattern:
 * - Sets up event listeners that trigger actions based on user interaction
 * - Implicit state transition: VIEWING -> NAVIGATING (to external website)
 * 
 * Future FSM Integration:
 * - Could emit events: {action: 'NAVIGATE_TO_WEBSITE', business: businessId}
 * - Could be controlled by a central state machine
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and business information
 */
function setupBusinessClickInteraction(markerInfo) {
  const { marker, listItem, business } = markerInfo;
  
  // Only setup click interactions if there's a website
  if (business.website) {
    // Marker click opens website
    marker.addListener('click', () => {
      window.open(business.website, '_blank');
    });
    
    // List item click opens website (except when clicking on an actual link)
    listItem.style.cursor = 'pointer';
    listItem.addEventListener('click', (e) => {
      // Check if the click was on an anchor tag to avoid double-opening
      if (e.target.tagName.toLowerCase() !== 'a') {
        window.open(business.website, '_blank');
      }
    });
  }
}

// Export business service functions
export {
  getNearbyBusinesses,
  createBusinessMarkerIcons,
  setupMarkerListItemInteraction,
  setupBusinessClickInteraction,
  highlightMarkerAndListItem
};
