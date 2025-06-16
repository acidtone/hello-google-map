/**
 * Business Service Module
 * Handles fetching and managing business data and marker interactions
 * 
 * FSM State Patterns:
 * This module implements explicit FSM patterns for future integration with a state machine.
 * 
 * Business States:
 * - IDLE: Initial state, no business operations in progress
 * - SEARCHING: Actively searching for nearby businesses
 * - READY: Business data successfully retrieved
 * - ERROR: Error occurred during business operations
 * - INTERACTING: User is interacting with business markers/listings
 * 
 * State transitions are now handled explicitly through the currentBusinessState variable.
 * This enables better debugging, error handling, and integration with other services.
 */

import { handleError } from './errorService';
import { updateInteractionUI } from '../main';
import { fetchBusinessData } from '../actions/businessActions';

/**
 * Business state constants
 * These represent the possible states of the business service
 */
const BusinessState = {
  IDLE: 'IDLE',           // Initial state, no business operations in progress
  SEARCHING: 'SEARCHING', // Actively searching for nearby businesses
  READY: 'READY',         // Business data successfully retrieved
  ERROR: 'ERROR',         // Error occurred during business operations
  INTERACTING: 'INTERACTING' // User is interacting with business markers/listings
};

// Track the current state of the business service
let currentBusinessState = BusinessState.IDLE;

/**
 * Get the current state of the business service
 * 
 * This function provides explicit state information that can be used
 * by other modules to make decisions based on the business service's current state.
 * 
 * @returns {string} - The current state of the business service
 */
function getBusinessState() {
  return currentBusinessState;
}

/**
 * Get nearby businesses using Foursquare Places API
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: SEARCHING (explicit via BusinessState.SEARCHING)
 * - Success Exit States: 
 *   - READY (explicit via BusinessState.READY when businesses found)
 *   - READY (explicit via BusinessState.READY when no businesses found but API call succeeded)
 * - Error Exit State: ERROR (explicit via BusinessState.ERROR)
 * 
 * Now uses the fetchBusinessData action function for the API call,
 * while maintaining state management in this service.
 * 
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} limit - Maximum number of businesses to return
 * @returns {Promise<Array>} - Array of business objects
 */
async function getNearbyBusinesses(latitude, longitude, limit = 4) {
  try {
    // Set state to SEARCHING at the start of the operation
    currentBusinessState = BusinessState.SEARCHING;
    
    // Use the fetchBusinessData action function to get business data
    const result = await fetchBusinessData(
      { latitude, longitude },
      limit
    );
    
    // Handle the result based on success/failure
    if (result.success) {
      // Set state to READY regardless of whether businesses were found
      // (empty results is a valid state, not an error)
      currentBusinessState = BusinessState.READY;
      return result.data;
    } else {
      // Set state to ERROR and throw the error for consistent error handling
      currentBusinessState = BusinessState.ERROR;
      throw result.error;
    }

  } catch (error) {
    // Set state to ERROR
    currentBusinessState = BusinessState.ERROR;
    
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
 *   - IDLE/READY -> INTERACTING -> IDLE/READY
 * - Now uses explicit BusinessState.INTERACTING state
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and icon information
 */
function setupMarkerListItemInteraction(markerInfo) {
  const { marker, listItem, defaultIcon, highlightedIcon } = markerInfo;
  
  // List item hover effects
  listItem.addEventListener('mouseenter', () => {
    // Only change state if we're not already in an error state
    if (currentBusinessState !== BusinessState.ERROR) {
      const previousState = currentBusinessState;
      currentBusinessState = BusinessState.INTERACTING;
      highlightMarkerAndListItem(markerInfo, true);
      // Restore previous state when done
      currentBusinessState = previousState;
    } else {
      highlightMarkerAndListItem(markerInfo, true);
    }
  });
  
  listItem.addEventListener('mouseleave', () => {
    highlightMarkerAndListItem(markerInfo, false);
  });
  
  // Marker hover effects
  marker.addListener('mouseover', () => {
    // Only change state if we're not already in an error state
    if (currentBusinessState !== BusinessState.ERROR) {
      const previousState = currentBusinessState;
      currentBusinessState = BusinessState.INTERACTING;
      highlightMarkerAndListItem(markerInfo, true);
      // Restore previous state when done
      currentBusinessState = previousState;
    } else {
      highlightMarkerAndListItem(markerInfo, true);
    }
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
 * - Works with the BusinessState.INTERACTING state
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and icon information
 * @param {boolean} highlight - Whether to highlight or unhighlight
 */
function highlightMarkerAndListItem(markerInfo, highlight) {
  // Use the updateInteractionUI function to handle UI updates
  updateInteractionUI({
    markerInfo: markerInfo,
    highlight: highlight,
    state: currentBusinessState
  });
}

/**
 * Setup click interaction for a business marker and list item
 * 
 * FSM State Pattern:
 * - Sets up event listeners that trigger actions based on user interaction
 * - Explicit state transition: IDLE/READY -> INTERACTING -> IDLE/READY
 * - Uses BusinessState.INTERACTING during click interactions
 * 
 * @param {Object} markerInfo - Object containing marker, listItem, and business information
 */
function setupBusinessClickInteraction(markerInfo) {
  const { marker, listItem, business } = markerInfo;
  
  // Only setup click interactions if there's a website
  if (business.website) {
    // Marker click opens website
    marker.addListener('click', () => {
      // Track interaction state
      if (currentBusinessState !== BusinessState.ERROR) {
        const previousState = currentBusinessState;
        currentBusinessState = BusinessState.INTERACTING;
        
        window.open(business.website, '_blank');
        
        // Restore previous state
        currentBusinessState = previousState;
      } else {
        window.open(business.website, '_blank');
      }
    });
    
    // List item click opens website (except when clicking on an actual link)
    listItem.style.cursor = 'pointer';
    listItem.addEventListener('click', (e) => {
      // Check if the click was on an anchor tag to avoid double-opening
      if (e.target.tagName.toLowerCase() !== 'a') {
        // Track interaction state
        if (currentBusinessState !== BusinessState.ERROR) {
          const previousState = currentBusinessState;
          currentBusinessState = BusinessState.INTERACTING;
          
          window.open(business.website, '_blank');
          
          // Restore previous state
          currentBusinessState = previousState;
        } else {
          window.open(business.website, '_blank');
        }
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
  highlightMarkerAndListItem,
  BusinessState,
  getBusinessState
};
