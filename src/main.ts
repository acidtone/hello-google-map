// Import configuration and services
import { 
  GOOGLE_MAPS_API_KEY, 
  AUTOCOMPLETE_CONFIG,
  MAPS_API_CONFIG,
  validateConfig 
} from './config';

import {
  initializeMap,
  addMarker,
  clearAllMarkers,
  clearBusinessMarkers,
  setCenter,
  createBounds,
  fitBounds,
  getMarkers
} from './services/mapService';

import {
  getCurrentLocation,
  getPostalCode,
  geocodeZipCode,
  getDefaultLocation,
  LocationState,
  getLocationState
} from './services/locationService';

import { 
  getNearbyBusinesses, 
  createBusinessMarkerIcons, 
  setupMarkerListItemInteraction,
  setupBusinessClickInteraction,
  BusinessState,
  getBusinessState,
  MarkerInfo,
  BusinessStateType
} from './services/businessService';
import { processBusinessData } from './actions/businessActions';
import { Business } from './types/business';

import {
  handleError,
  RecoveryActions
} from './services/errorService';

// FSM State Manager - for future state machine integration
import { transitionAppState } from './utils/stateManager';
import { AppState } from './types/fsm';

// Add TypeScript declaration for window.gm_authFailure and initMap
declare global {
  interface Window {
    gm_authFailure: () => void;
    initMap: () => void;
  }
}

// Google Maps API error handler
window.gm_authFailure = function(): void {
  const error = new Error('Google Maps API failed to load');
  const errorInfo = handleError(error, 'maps_api');
  
  // Display error message in the map container
  const mapElement = document.getElementById('map') as HTMLElement | null;
  if (mapElement) {
    mapElement.innerHTML = `<div class="error-message">${errorInfo.message}</div>`;
  }
  
  // Also update the location span
  const locationSpan = document.querySelector('.user-location span') as HTMLElement | null;
  if (locationSpan) {
    locationSpan.textContent = errorInfo.message;
  }
  
  console.error('Google Maps API failed to load. Check your API key and network connection.');
};

// Map is now managed by the map service

// Load Google Maps API with the API key from configuration
function loadGoogleMapsAPI(): void {
  try {
    // Validate configuration before proceeding
    validateConfig();
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${MAPS_API_CONFIG.libraries.join(',')}&callback=${MAPS_API_CONFIG.callback}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } catch (error: unknown) {
    // Handle validation errors in an FSM-friendly way
    const errorInfo = handleError(error, 'config_validation');
    
    // Display error message in the map container
    const mapElement = document.getElementById('map') as HTMLElement | null;
    if (mapElement) {
      mapElement.innerHTML = `<div class="error-message">${errorInfo.message}</div>`;
    }
    
    // Also update the location span
    const locationSpan = document.querySelector('.user-location span') as HTMLElement | null;
    if (locationSpan) {
      locationSpan.textContent = errorInfo.message;
    }
    
    console.error('Configuration validation failed:', error);
  }
}

/**
 * Type definition for map initialization UI data
 */
type MapInitializationData = {
  isReady: boolean;
  error?: {
    message?: string;
  };
  mapElementId?: string;
};

/**
 * Updates UI when map is ready or has initialization errors
 * @param data - Contains map status and error information
 */
export function updateMapInitializationUI(data: MapInitializationData): void {
  const { isReady, error, mapElementId = 'map' } = data;
  const mapElement = document.getElementById(mapElementId) as HTMLElement | null;
  
  if (!mapElement) return;
  
  if (error) {
    // Display error message in the map container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'map-error';
    // Use type guard to safely access error.message
    errorDiv.textContent = typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Error initializing map';
    mapElement.innerHTML = '';
    mapElement.appendChild(errorDiv);
    return;
  }
  
  if (isReady) {
    // Map is ready, we could add any UI indicators here if needed
    // For example, remove any loading indicators
    const loadingIndicator = document.querySelector('.map-loading') as HTMLElement | null;
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  } else {
    // Map is initializing, show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'map-loading';
    loadingDiv.textContent = 'Loading map...';
    mapElement.appendChild(loadingDiv);
  }
}

// Initialize the map - this function is called by the Google Maps API
window.initMap = function(): void {
  try {
    // FSM: Transition to MAP_READY state
    transitionAppState(AppState.MAP_READY);
    
    // Initialize the map using the map service
    initializeMap("map");
    
    // Update UI to indicate map is ready
    updateMapInitializationUI({
      isReady: true
    });
    
    // Try to get user location and update the map
    getUserLocation();
    
    // Setup autocomplete for location predictions
    setupLocationPredictions();
  } catch (error: unknown) {
    // FSM: Transition to MAP_ERROR state
    transitionAppState(AppState.MAP_ERROR);
    
    // Handle map initialization error
    updateMapInitializationUI({
      isReady: false,
      error: { message: 'Failed to initialize map: ' + (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string' 
        ? (error as { message: string }).message 
        : 'Unknown error') }
    });
  }
};

// Load the Google Maps API when the page loads
loadGoogleMapsAPI();

/**
 * Function to get postal code from coordinates using location service
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: GEOCODING (explicit via LocationState.GEOCODING)
 * - Success Exit State: READY (explicit via LocationState.READY)
 * - Error Exit State: ERROR (explicit via LocationState.ERROR)
 * 
 * This function now checks the location state to ensure it matches the expected
 * state at each step of the process.
 */
async function fetchPostalCode(latitude: number, longitude: number): Promise<string> {
  try {
    // Use the location service to get the postal code
    const postalCode = await getPostalCode(latitude, longitude);
    
    // Verify we're in the expected state after the operation
    if (getLocationState() !== LocationState.READY) {
      console.warn(`Unexpected location state after getPostalCode: ${getLocationState()}`);
    }
    
    return postalCode;
  } catch (error: unknown) {
    console.error('Error getting postal code:', error);
    
    // Verify we're in ERROR state as expected
    if (getLocationState() !== LocationState.ERROR) {
      console.error(`Unexpected location state during postal code error: ${getLocationState()}`);
    }
    
    return 'Error';
  }
}

// getNearbyBusinesses function has been moved to businessService.js

/**
 * Type definition for location UI update data
 */
type LocationUpdateData = {
  coordinates?: {
    lat: number;
    lng: number;
  };
  postalCode?: string;
  source?: string;
  state?: string;
  error?: {
    message?: string;
  };
};

/**
 * Updates UI with location information
 * @param data - Contains location information
 */
export function updateLocationUI(data: LocationUpdateData): void {
  const { coordinates, postalCode, source = 'Unknown', error } = data;
  const locationSpan = document.querySelector('.user-location span') as HTMLElement | null;
  
  if (error) {
    // Display error message
    if (locationSpan) {
      // Use type guard to safely access error.message
      locationSpan.textContent = typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Location error';
    }
    return;
  }
  
  if (coordinates && coordinates.lat && coordinates.lng) {
    // Format coordinates for display
    const lat = Number(coordinates.lat).toFixed(6);
    const lng = Number(coordinates.lng).toFixed(6);
    
    if (locationSpan) {
      if (postalCode) {
        locationSpan.textContent = `Lat: ${lat}, Lng: ${lng} (${postalCode}) (${source})`;
      } else {
        locationSpan.textContent = `Lat: ${lat}, Lng: ${lng} (${source})`;
      }
    }
    
    // Center map and add marker if coordinates are valid
    setCenter(coordinates);
    addMarker(coordinates, {
      title: "Your Location",
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    }, 'user');
  } else if (locationSpan) {
    locationSpan.textContent = 'Location not available';
  }
}

/**
 * Function to display location information
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: DISPLAYING_LOCATION
 * - Success Exit States:
 *   - LOCATION_DISPLAYED (when all operations succeed)
 *   - LOCATION_DISPLAYED_PARTIAL (when some operations fail but location is still displayed)
 * - Error Exit State: LOCATION_ERROR (when critical operations fail)
 * 
 * Future FSM Integration:
 * - Could return state objects: {state: 'LOCATION_DISPLAYED', data: {location, businesses}}
 * - Could emit events for state transitions
 * - Could handle partial success states more explicitly
 */
async function displayLocation(latitude: number, longitude: number, source: string = 'Geolocation API'): Promise<void> {
  // Create user location object
  const userLocation = { lat: latitude, lng: longitude };
  
  // First update with just coordinates
  updateLocationUI({
    coordinates: userLocation,
    source: source
  });
  
  try {
    // Start both API calls in parallel
    const postalCodePromise = fetchPostalCode(latitude, longitude);
    const businessesPromise = getNearbyBusinesses(latitude, longitude);
    
    try { 
      // Wait for both API calls to complete in parallel
      const [postalCode, businesses] = await Promise.all([
        postalCodePromise,
        businessesPromise
      ]);
      
      // Update the zip input field if postal code is found
      const zipInput = document.getElementById('zip-input') as HTMLInputElement | null;
      if (zipInput && postalCode) {
        zipInput.value = postalCode;
      }
      
      // Update UI with complete results
      updateLocationUI({
        coordinates: userLocation,
        postalCode: postalCode,
        source: source,
        state: LocationState.READY
      });
      
      console.log(`Location from ${source}: Lat: ${latitude}, Lng: ${longitude}, Postal Code: ${postalCode}`);
      
      // Display businesses
      displayNearbyBusinesses(businesses, userLocation);
    } catch (apiError: unknown) {
      // Handle API errors in an FSM-friendly way while maintaining basic map functionality
      const context = (apiError as {message?: string}).message?.includes('postal code') ? 'postal_code' : 'business_search';
      const errorInfo = handleError(apiError, context);
      
      // Take appropriate recovery action based on the recovery type
      if (errorInfo.recovery === RecoveryActions.CONTINUE_PARTIAL) {
        // Show the error message but continue with partial data
        console.log(errorInfo.message);
        
        // Still show the map with user location, even if we couldn't get additional data
        updateLocationUI({
          coordinates: userLocation,
          source: source,
          state: LocationState.ERROR
        });
      }
    }
  } catch (error: unknown) {
    // Handle critical errors in the core map functionality
    const errorInfo = handleError(error, 'map_display');
    
    updateLocationUI({
      error: errorInfo,
      state: LocationState.ERROR
    });
    
    // Take appropriate recovery action based on the recovery type
    if (errorInfo.recovery === RecoveryActions.NONE) {
      console.error('Critical map display error with no recovery action available');
    }
  }
}



/**
 * Type definition for business UI update data
 */
type BusinessUpdateData = {
  businesses: Array<Business>;
  userLocation?: {
    lat: number;
    lng: number;
  };
  state?: BusinessStateType;
  error?: {
    message?: string;
  };
};

/**
 * Updates UI with business search results
 * @param data - Contains businesses and related information
 */
export function updateBusinessUI(data: BusinessUpdateData): void {
  const { businesses, userLocation, state } = data;
  
  // Clear business markers, preserving user location marker
  clearBusinessMarkers();
  
  // Check if the businesses container already exists
  let businessesContainer = document.getElementById('nearby-businesses') as HTMLElement | null;
  
  // If not, create it
  if (!businessesContainer) {
    const mapContainer = document.querySelector('.container') as HTMLElement | null;
    
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }
    
    businessesContainer = document.createElement('div');
    businessesContainer.id = 'nearby-businesses';
    businessesContainer.className = 'businesses-container';
    mapContainer.appendChild(businessesContainer);
  }

  // Clear any existing businesses
  businessesContainer.innerHTML = '<h2>Nearby Businesses</h2>';
  
  // Handle error state
  if (state === BusinessState.ERROR) {
    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.textContent = 'There was an error searching for businesses. Please try again.';
    businessesContainer.appendChild(errorMessage);
    return;
  }
  
  // If no businesses found
  if (!businesses || businesses.length === 0) {
    const noResults = document.createElement('p');
    noResults.textContent = 'No storefronts found near you.';
    businessesContainer.appendChild(noResults);
    return;
  }
  
  // Create a list of businesses
  const businessList = document.createElement('ul');
  
  // Labels for markers (A, B, C, D)
  const labels: string[] = ['A', 'B', 'C', 'D'];
  
  // Create bounds for the map to fit all markers
  const bounds = createBounds();
  
  // Add user location to bounds
  if (userLocation) {
    bounds.extend(userLocation);
  }
  
  // Add each business to the list and create markers
  businesses.forEach((business: Business, index: number) => {
    if (index >= labels.length) return; // Only process up to 4 businesses
    
    const listItem = document.createElement('li');
    listItem.className = 'business-item';
    listItem.id = `business-${index}`; // Add unique ID for easier targeting
    listItem.dataset.index = index.toString(); // Convert number to string for dataset
    
    // Add label (A, B, C, D)
    const label = document.createElement('span');
    label.className = 'business-label';
    label.textContent = labels[index] || '';
    listItem.appendChild(label);
    
    // Business name
    const name = document.createElement('h3');
    name.textContent = business.name;
    listItem.appendChild(name);
    
    // Add address if available
    if (business.location && business.location.formattedAddress && business.location.formattedAddress.length > 0) {
      const address = document.createElement('p');
      address.className = 'business-address';
      address.textContent = business.location.formattedAddress.join(', ');
      listItem.appendChild(address);
    }
    
    // Business website if available
    if (business.website) {
      const website = document.createElement('a');
      website.href = business.website;
      website.textContent = 'Visit Website';
      website.target = '_blank';
      listItem.appendChild(website);
      
      // Make the entire list item clickable to go to website
      listItem.style.cursor = 'pointer';
      listItem.addEventListener('click', (e: MouseEvent) => {
        if (e.target !== website) { // Avoid double-click if clicking the actual link
          window.open(business.website, '_blank');
        }
      });
    }
    
    // Create a marker if we have coordinates
    if (business.location && business.location.coordinates) {
      // Use type assertion to handle the mismatch between TypeScript definition and runtime data
      const coordinates = business.location.coordinates as unknown as { latitude: number; longitude: number };
      const position = {
        lat: coordinates.latitude,
        lng: coordinates.longitude
      };
      
      // Add position to bounds
      bounds.extend(position);
      
      // Get default and highlighted marker icons from business service
      const { default: defaultIcon, highlighted: highlightedIcon } = createBusinessMarkerIcons();
      
      // Create marker with label using map service
      const marker = addMarker(position, {
        label: {
          text: labels[index] || '',
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        icon: defaultIcon as unknown as google.maps.Icon,
        title: business.name
      });
      
      // Create a marker info object to store the relationship between marker and list item
      const markerInfo: MarkerInfo = {
        marker: marker as google.maps.Marker, // Assert as non-null since we're inside a conditional
        listItem: listItem as HTMLElement,
        default: defaultIcon,
        highlighted: highlightedIcon,
        business: business
      };
      
      // Setup marker and list item interactions using the business service
      setupMarkerListItemInteraction(markerInfo);
      setupBusinessClickInteraction(markerInfo);
    }
    
    // Add to list
    businessList.appendChild(listItem);
  });
  
  // Add the list to the container
  businessesContainer.appendChild(businessList);
  
  // Fit the map to show all markers using map service
  if (getMarkers().length > 0) {
    fitBounds(bounds);
    
    // If we only have one marker (just the user), zoom out a bit
    if (getMarkers().length === 0 && userLocation) {
      setCenter(userLocation, 14);
    }
  }
}

/**
 * Function to display nearby businesses in the UI and add markers to the map
 * 
 * FSM State Pattern:
 * - Entry State: Typically after a successful location operation (LocationState.READY)
 * - During Execution: Uses BusinessState.READY state data
 * - Success Exit State: Businesses displayed (implicit in UI update)
 * - Error Exit State: No businesses found or error (handled internally)
 * 
 * Now uses the processBusinessData action function to prepare business data
 * before updating the UI.
 */
function displayNearbyBusinesses(businesses: Business[], userLocation: { lat: number; lng: number }): void {
  // Check the current business state before displaying
  const currentState = getBusinessState();
  
  // Process the business data using the pure action function
  const processResult = processBusinessData(businesses);
  
  // Update the UI based on the processing result
  if (processResult.success) {
    // Update the UI with processed business data
    updateBusinessUI({
      businesses: processResult.data,
      userLocation: userLocation,
      state: currentState
    });
  } else {
    // Handle processing error
    updateBusinessUI({
      businesses: businesses, // Fall back to original data
      userLocation: userLocation,
      state: currentState,
      error: processResult.error
    });
  }
}

// Define the type for interaction update data
type InteractionUpdateData = {
  markerInfo: MarkerInfo;
  highlight: boolean;
  state?: string;
};

/**
 * Updates UI during user interactions with businesses/markers
 * @param data - Contains interaction details
 */
export function updateInteractionUI(data: InteractionUpdateData): void {
  const { markerInfo, highlight } = data;
  
  if (highlight) {
    // Highlight marker
    markerInfo.marker.setIcon(markerInfo.highlighted);
    // Highlight list item
    markerInfo.listItem.classList.add('highlighted');
  } else {
    // Unhighlight marker
    markerInfo.marker.setIcon(markerInfo.default);
    // Unhighlight list item
    markerInfo.listItem.classList.remove('highlighted');
  }
}

// This function is now directly imported from mapService.js
// No need for a wrapper function anymore

/**
 * Function to use default location
 * 
 * FSM State Pattern:
 * - Entry State: Typically ERROR (called after a location error)
 * - During Execution: Uses default location without changing state
 * - Exit State: Transitions to displayLocation function
 * 
 * This function uses the default location as a fallback but doesn't
 * change the location state since it's typically called after an error.
 */
async function useDefaultLocation(): Promise<void> {
  // Get default location from location service
  const defaultLocation = getDefaultLocation();
  
  // Log the current state for debugging purposes
  console.log(`Using default location while in state: ${getLocationState()}`);
  
  // We don't change the state here since getDefaultLocation doesn't change state
  // This preserves the ERROR state which is important context for why we're using a default
  
  await displayLocation(defaultLocation.lat, defaultLocation.lng, defaultLocation.name);
}

/**
 * Get the user's location using the location service
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: FETCHING_LOCATION (now explicit via LocationState.FETCHING)
 * - Success Exit State: Transitions to displayLocation function
 * - Error Exit State: ERROR (explicit via LocationState.ERROR)
 *   - May transition to useDefaultLocation based on recovery action
 * 
 * This function now checks the location state to ensure it matches the expected
 * state at each step of the process.
 */
async function getUserLocation(): Promise<void> {
  // Clear any existing markers (both user and business)
  clearAllMarkers();
  
  const locationSpan = document.querySelector('.user-location span') as HTMLElement | null;
  if (locationSpan) {
    locationSpan.textContent = 'Fetching your location...';
  }
  
  try {
    // Use the location service to get the current location
    const position = await getCurrentLocation();
    
    // Check the location state to ensure we're in READY state
    if (getLocationState() === LocationState.READY) {
      // Display the coordinates using our display function
      await displayLocation(position.lat, position.lng);
    } else {
      console.warn(`Unexpected location state: ${getLocationState()}`);
      // Still proceed with the position we received
      await displayLocation(position.lat, position.lng);
    }
  } catch (error: unknown) {
    // Verify we're in ERROR state as expected
    if (getLocationState() === LocationState.ERROR) {
      // Handle errors in an FSM-friendly way
      const errorInfo = handleError(error, 'geolocation');
      
      // Take appropriate recovery action based on the recovery type
      if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
        await useDefaultLocation();
      }
    } else {
      console.error(`Unexpected location state during error: ${getLocationState()}`);
      // Handle the error anyway
      const errorInfo = handleError(error, 'geolocation');
      if (locationSpan) {
        locationSpan.textContent = errorInfo.message;
      }
      
      if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
        await useDefaultLocation();
      }
    }
  }
}

/**
 * Function to geocode a zip/postal code and update the map
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: GEOCODING (explicit via LocationState.GEOCODING)
 * - Success Exit State: READY (explicit via LocationState.READY)
 * - Error Exit State: ERROR (explicit via LocationState.ERROR)
 *   - May focus on input field based on recovery action
 * 
 * This function now checks the location state to ensure it matches the expected
 * state at each step of the process.
 */
async function searchByZipCode(zipCode: string): Promise<void> {
  const locationSpan = document.querySelector('.user-location span') as HTMLElement | null;
  
  if (!locationSpan) {
    console.error('Location span element not found');
    return;
  }
  
  try {
    // Update the UI to show we're searching
    locationSpan.textContent = `Searching for ${zipCode}...`;
    
    // Clear any existing markers
    clearAllMarkers();
    
    // Use the location service to geocode the zip code
    const location = await geocodeZipCode(zipCode);
    
    // Verify we're in the expected state after geocoding
    if (getLocationState() === LocationState.READY) {
      // Display the location using our display function
      await displayLocation(location.lat, location.lng, `Zip Code: ${zipCode}`);
    } else {
      console.warn(`Unexpected location state after geocoding: ${getLocationState()}`);
      // Still proceed with the location we received
      await displayLocation(location.lat, location.lng, `Zip Code: ${zipCode}`);
    }
  } catch (error: unknown) {
    // Verify we're in ERROR state as expected
    if (getLocationState() === LocationState.ERROR) {
      // Handle errors in an FSM-friendly way
      const errorInfo = handleError(error, 'geocoding');
      locationSpan.textContent = errorInfo.message;
      
      // Take appropriate recovery action based on the recovery type
      if (errorInfo.recovery === RecoveryActions.SHOW_FORM) {
        const zipInput = document.getElementById('zip-input') as HTMLInputElement | null;
        if (zipInput) {
          zipInput.focus();
        }
      }
    } else {
      console.error(`Unexpected location state during geocoding error: ${getLocationState()}`);
      // Handle the error anyway
      const errorInfo = handleError(error, 'geocoding');
      locationSpan.textContent = errorInfo.message;
      
      if (errorInfo.recovery === RecoveryActions.SHOW_FORM) {
        const zipInput = document.getElementById('zip-input') as HTMLInputElement | null;
        if (zipInput) {
          zipInput.focus();
        }
      }
    }
  }
}

// Function to set up location predictions using the modern Places Autocomplete widget
function setupLocationPredictions(): void {
  const zipInput = document.getElementById('zip-input') as HTMLInputElement | null;
  
  if (!zipInput) {
    console.error('Zip input element not found');
    return;
  }
  
  // This function is only called after the API is ready via the callback=initMap parameter
  
  console.log('Setting up Places Autocomplete');
  
  // Create the autocomplete object using configuration
  const autocomplete = new google.maps.places.Autocomplete(zipInput, AUTOCOMPLETE_CONFIG);
  
  // When a place is selected, update the map
  autocomplete.addListener('place_changed', (): void => {
    const place = autocomplete.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      // User entered the name of a place that was not suggested
      // or pressed Enter before selecting a suggestion
      console.log('No details available for input: ' + place.name);
      if (zipInput.value.trim()) {
        searchByZipCode(zipInput.value.trim());
      }
      return;
    }
    
    // Get the location coordinates
    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();
    
    // Extract postal code from address components if available
    let postalCode = '';
    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name;
          break;
        }
      }
    }
    
    // Set the input field to just the postal code if found, otherwise keep the original value
    if (postalCode) {
      zipInput.value = postalCode;
    }
    
    // Display the location and update the map
    displayLocation(latitude, longitude, `Location: ${place.formatted_address || place.name}`);
  });
  
  // Prevent form submission when selecting a place with Enter key
  zipInput.addEventListener('keydown', (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      // If there are active suggestions, let the Autocomplete widget handle it
      if ((document.querySelector('.pac-container') as HTMLElement | null)?.style.display !== 'none') {
        e.preventDefault();
      }
    }
  });
}

// Set up event listeners when the page loads
document.addEventListener('DOMContentLoaded', (): void => {
  // Call getUserLocation on page load
  getUserLocation();
  
  // Add event listener for the Locate Me button
  const locateMeButton = document.getElementById('locate-me') as HTMLElement | null;
  if (locateMeButton) {
    locateMeButton.addEventListener('click', getUserLocation);
  }
  
  // Add event listener for the zip code search form
  const zipSearchForm = document.getElementById('zip-search-form') as HTMLFormElement | null;
  if (zipSearchForm) {
    zipSearchForm.addEventListener('submit', (event: Event): void => {
      event.preventDefault();
      const zipInput = document.getElementById('zip-input') as HTMLInputElement | null;
      
      if (zipInput) {
        const zipCode = zipInput.value.trim();
        
        if (zipCode) {
          searchByZipCode(zipCode);
        }
      }
    });
  }
});
