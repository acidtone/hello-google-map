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
import { BUSINESS_PROVIDER, FOURSQUARE_API_KEY } from '../config';
import { BusinessProvider } from '../types/business';
import { Business } from '../types/business';

// Define types for marker interactions
export type MarkerInfo = {
  marker: google.maps.Marker;
  listItem: HTMLElement;
  default: google.maps.Icon | google.maps.Symbol;
  highlighted: google.maps.Icon | google.maps.Symbol;
  business?: Business;
};

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
} as const;

export type BusinessStateType = typeof BusinessState[keyof typeof BusinessState];

// Track the current state of the business service
let currentBusinessState: BusinessStateType = BusinessState.IDLE;

/**
 * Get the current state of the business service
 * 
 * This function provides explicit state information that can be used
 * by other modules to make decisions based on the business service's current state.
 * 
 * @returns The current state of the business service
 */
function getBusinessState(): BusinessStateType {
  return currentBusinessState;
}

// FoursquareProvider implementation
class FoursquareProvider implements BusinessProvider {
  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4) {
    const url = 'https://api.foursquare.com/v3/places/search';
    const params = new URLSearchParams({
      ll: `${latitude},${longitude}`,
      radius: '1000',
      limit: limit.toString(),
      categories: '13000,13065,17000,17062',
      sort: 'DISTANCE',
      fields: 'fsq_id,name,location,geocodes,website,tel,categories,rating,price,hours,description,photos,distance'
    });
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((place: any) => ({
      id: place.fsq_id,
      name: place.name,
      location: {
        address: place.location.address,
        crossStreet: place.location.cross_street,
        city: place.location.locality,
        state: place.location.admin_region,
        postalCode: place.location.postcode,
        country: place.location.country,
        coordinates: {
          lat: place.location.geocodes?.main?.latitude || 0,
          lng: place.location.geocodes?.main?.longitude || 0
        },
        formattedAddress: place.location.formatted_address ? [place.location.formatted_address] : undefined
      },
      categories: place.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon
      })),
      website: place.website,
      tel: place.tel,
      rating: place.rating,
      distance: place.distance,
      description: place.description,
      hours: place.hours ? {
        status: place.hours.status,
        isOpen: place.hours.is_open
      } : undefined,
      photos: place.photos?.map((photo: any) => ({
        id: photo.id,
        prefix: photo.prefix,
        suffix: photo.suffix
      }))
    }));
  }
}

// Provider selection (config-based)
const provider: BusinessProvider = (() => {
  switch (BUSINESS_PROVIDER) {
    case 'foursquare':
    default:
      return new FoursquareProvider();
  }
})();

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
 * @returns Object containing default and highlighted icon configurations
 */
function createBusinessMarkerIcons(): { 
  default: google.maps.Symbol; 
  highlighted: google.maps.Symbol; 
} {
  return {
    default: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#EA4335', // Google red
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
 * @param markerInfo - Object containing marker, listItem, and icon information
 */
function setupMarkerListItemInteraction(markerInfo: MarkerInfo): void {
  const { marker, listItem } = markerInfo;
  
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
 * @param markerInfo - Object containing marker, listItem, and icon information
 * @param highlight - Whether to highlight or unhighlight
 */
function highlightMarkerAndListItem(markerInfo: MarkerInfo, highlight: boolean): void {
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
 * @param markerInfo - Object containing marker, listItem, and business information
 */
function setupBusinessClickInteraction(markerInfo: MarkerInfo): void {
  const { marker, listItem, business } = markerInfo;
  
  // Only setup click interactions if there's a website
  if (business?.website) {
    // Marker click opens website
    marker.addListener('click', () => {
      // Track interaction state
      if (currentBusinessState !== BusinessState.ERROR) {
        const previousState = currentBusinessState;
        currentBusinessState = BusinessState.INTERACTING;
        
        window.open(business.website!, '_blank');
        
        // Restore previous state
        currentBusinessState = previousState;
      } else {
        window.open(business.website!, '_blank');
      }
    });
    
    // List item click opens website (except when clicking on an actual link)
    listItem.style.cursor = 'pointer';
    listItem.addEventListener('click', (e: MouseEvent) => {
      // Check if the click was on an anchor tag to avoid double-opening
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() !== 'a') {
        // Track interaction state
        if (currentBusinessState !== BusinessState.ERROR) {
          const previousState = currentBusinessState;
          currentBusinessState = BusinessState.INTERACTING;
          
          window.open(business.website!, '_blank');
          
          // Restore previous state
          currentBusinessState = previousState;
        } else {
          window.open(business.website!, '_blank');
        }
      }
    });
  }
}

// Replace getNearbyBusinesses implementation:
async function getNearbyBusinesses(
  latitude: number, 
  longitude: number, 
  limit: number = 4
): Promise<Business[]> {
  try {
    currentBusinessState = BusinessState.SEARCHING;
    const businesses = await provider.getNearbyBusinesses(latitude, longitude, limit);
    currentBusinessState = BusinessState.READY;
    return businesses;
  } catch (error: unknown) {
    currentBusinessState = BusinessState.READY;
    // Return empty array to trigger 'No storefronts found near you.'
    return [];
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
