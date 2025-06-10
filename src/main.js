// Import configuration and services
import { 
  GOOGLE_MAPS_API_KEY, 
  AUTOCOMPLETE_CONFIG,
  MAPS_API_CONFIG,
  validateConfig 
} from './config.js';

import {
  initializeMap,
  getMap,
  addMarker,
  clearAllMarkers,
  clearBusinessMarkers,
  clearUserMarkers,
  setCenter,
  createBounds,
  fitBounds,
  createInfoWindow,
  openInfoWindow,
  getMarkers
} from './services/mapService.js';

import {
  getCurrentLocation,
  getPostalCode,
  geocodeZipCode,
  getDefaultLocation,
  LocationState,
  getLocationState
} from './services/locationService.js';

import {
  getNearbyBusinesses,
  createBusinessMarkerIcons,
  setupMarkerListItemInteraction,
  setupBusinessClickInteraction
} from './services/businessService.js';

import {
  handleError,
  RecoveryActions
} from './services/errorService.js';

// Google Maps API error handler
window.gm_authFailure = function() {
  const error = new Error('Google Maps API failed to load');
  const errorInfo = handleError(error, 'maps_api');
  
  // Display error message in the map container
  const mapElement = document.getElementById('map');
  if (mapElement) {
    mapElement.innerHTML = `<div class="error-message">${errorInfo.message}</div>`;
  }
  
  // Also update the location span
  const locationSpan = document.querySelector('.user-location span');
  if (locationSpan) {
    locationSpan.textContent = errorInfo.message;
  }
  
  console.error('Google Maps API failed to load. Check your API key and network connection.');
};

// Map is now managed by the map service

// Load Google Maps API with the API key from configuration
function loadGoogleMapsAPI() {
  try {
    // Validate configuration before proceeding
    validateConfig();
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${MAPS_API_CONFIG.libraries.join(',')}&callback=${MAPS_API_CONFIG.callback}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } catch (error) {
    // Handle validation errors in an FSM-friendly way
    const errorInfo = handleError(error, 'config_validation');
    
    // Display error message in the map container
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.innerHTML = `<div class="error-message">${errorInfo.message}</div>`;
    }
    
    // Also update the location span
    const locationSpan = document.querySelector('.user-location span');
    if (locationSpan) {
      locationSpan.textContent = errorInfo.message;
    }
    
    console.error('Configuration validation failed:', error);
  }
}

// Initialize the map - this function is called by the Google Maps API
window.initMap = function() {
  // Initialize the map using the map service
  initializeMap("map");
  
  // Try to get user location and update the map
  getUserLocation();
  
  // Setup autocomplete for location predictions
  setupLocationPredictions();
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
async function fetchPostalCode(latitude, longitude) {
  try {
    // Use the location service to get the postal code
    const postalCode = await getPostalCode(latitude, longitude);
    
    // Verify we're in the expected state after the operation
    if (getLocationState() !== LocationState.READY) {
      console.warn(`Unexpected location state after getPostalCode: ${getLocationState()}`);
    }
    
    return postalCode;
  } catch (error) {
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
async function displayLocation(latitude, longitude, source = 'Geolocation API') {
  const locationSpan = document.querySelector('.user-location span');
  
  // First update with just coordinates
  locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${source})`;
  
  try {
    // Create user location object
    const userLocation = { lat: latitude, lng: longitude };
    
    // Immediately center the map and add marker - don't wait for API calls
    setCenter(userLocation);
    
    // Add a marker for the user's location using map service
    addMarker(userLocation, {
      title: "Your Location",
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    }, 'user'); // Specify this is a user marker
    
    // Start both API calls in parallel
    const postalCodePromise = fetchPostalCode(latitude, longitude);
    const businessesPromise = getNearbyBusinesses(latitude, longitude);
    
    try { 
      // Wait for both API calls to complete in parallel
      const [postalCode, businesses] = await Promise.all([
        postalCodePromise,
        businessesPromise
      ]);
      
      // Update UI with results
      locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${postalCode}) (${source})`;
      console.log(`Location from ${source}: Lat: ${latitude}, Lng: ${longitude}, Postal Code: ${postalCode}`);
      
      // Display businesses
      displayNearbyBusinesses(businesses, userLocation);
    } catch (apiError) {
      // Handle API errors in an FSM-friendly way while maintaining basic map functionality
      const context = apiError.message?.includes('postal code') ? 'postal_code' : 'business_search';
      const errorInfo = handleError(apiError, context);
      
      // Take appropriate recovery action based on the recovery type
      if (errorInfo.recovery === RecoveryActions.CONTINUE_PARTIAL) {
        // Show the error message but continue with partial data
        console.log(errorInfo.message);
        
        // Still show the map with user location, even if we couldn't get additional data
        locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${source})`;
      }
    }
  } catch (error) {
    // Handle critical errors in the core map functionality
    const errorInfo = handleError(error, 'map_display');
    locationSpan.textContent = errorInfo.message;
    
    // Take appropriate recovery action based on the recovery type
    if (errorInfo.recovery === RecoveryActions.NONE) {
      console.error('Critical map display error with no recovery action available');
    }
  }
}

// Function to display nearby businesses in the UI and add markers to the map
function displayNearbyBusinesses(businesses, userLocation) {
  // Only clear business markers, preserving user location marker
  clearBusinessMarkers();
  
  // No need to re-add the user location marker since we're not clearing it anymore
  
  // Check if the businesses container already exists
  let businessesContainer = document.getElementById('nearby-businesses');
  
  // If not, create it
  if (!businessesContainer) {
    const mapContainer = document.querySelector('.container');
    businessesContainer = document.createElement('div');
    businessesContainer.id = 'nearby-businesses';
    businessesContainer.className = 'businesses-container';
    mapContainer.appendChild(businessesContainer);
  }

  // Clear any existing businesses
  businessesContainer.innerHTML = '<h2>Nearby Businesses</h2>';
  
  // If no businesses found
  if (!businesses || businesses.length === 0) {
    const noResults = document.createElement('p');
    noResults.textContent = 'No nearby businesses found';
    businessesContainer.appendChild(noResults);
    return;
  }
  
  // Create a list of businesses
  const businessList = document.createElement('ul');
  
  // Labels for markers (A, B, C, D)
  const labels = ['A', 'B', 'C', 'D'];
  
  // Create bounds for the map to fit all markers using map service
  const bounds = createBounds();
  
  // Add user location to bounds
  if (userLocation) {
    bounds.extend(userLocation);
  }
  
  // Add each business to the list and create markers
  businesses.forEach((business, index) => {
    if (index >= labels.length) return; // Only process up to 4 businesses
    
    const listItem = document.createElement('li');
    listItem.className = 'business-item';
    listItem.id = `business-${index}`; // Add unique ID for easier targeting
    listItem.dataset.index = index;
    
    // Add label (A, B, C, D)
    const label = document.createElement('span');
    label.className = 'business-label';
    label.textContent = labels[index];
    listItem.appendChild(label);
    
    // Business name
    const name = document.createElement('h3');
    name.textContent = business.name;
    listItem.appendChild(name);
    
    // Business address
    if (business.location && business.location.formatted_address) {
      const address = document.createElement('p');
      address.textContent = business.location.formatted_address;
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
      listItem.addEventListener('click', (e) => {
        if (e.target !== website) { // Avoid double-click if clicking the actual link
          window.open(business.website, '_blank');
        }
      });
    }
    
    // Add marker to map if geocodes are available
    if (business.geocodes && business.geocodes.main) {
      const position = {
        lat: business.geocodes.main.latitude,
        lng: business.geocodes.main.longitude
      };
      
      // Add position to bounds
      bounds.extend(position);
      
      // Get default and highlighted marker icons from business service
      const { default: defaultIcon, highlighted: highlightedIcon } = createBusinessMarkerIcons();
      
      // Create marker with label using map service
      const marker = addMarker(position, {
        label: {
          text: labels[index],
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        icon: defaultIcon,
        title: business.name
      });
      
      // Create a marker info object to store the relationship between marker and list item
      const markerInfo = {
        marker: marker,
        listItem: listItem,
        defaultIcon: defaultIcon,
        highlightedIcon: highlightedIcon,
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

// This function is now directly imported from mapService.js
// No need for a wrapper function anymore

/**
 * Function to use default location
 * 
 * FSM State Pattern:
 * - Entry State: ERROR (typically called after an error)
 * - During Execution: USING_DEFAULT
 * - Exit State: Transitions to displayLocation function
 * 
 * Future FSM Integration:
 * - Could be a formal recovery action in the state machine
 * - Could track state transitions explicitly
 * - Could return state objects for consistency
 */
async function useDefaultLocation() {
  // Get default location from location service
  const defaultLocation = getDefaultLocation();
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
function getUserLocation() {
  // Clear any existing markers (both user and business)
  clearAllMarkers();
  
  const locationSpan = document.querySelector('.user-location span');
  locationSpan.textContent = 'Fetching your location...';
  
  // Use the location service to get the current location
  getCurrentLocation()
    .then(async (position) => {
      // Check the location state to ensure we're in READY state
      if (getLocationState() === LocationState.READY) {
        // Display the coordinates using our display function
        await displayLocation(position.lat, position.lng);
      } else {
        console.warn(`Unexpected location state: ${getLocationState()}`); 
        // Still proceed with the position we received
        await displayLocation(position.lat, position.lng);
      }
    })
    .catch(async (error) => {
      // Verify we're in ERROR state as expected
      if (getLocationState() === LocationState.ERROR) {
        // Handle errors in an FSM-friendly way
        const errorInfo = handleError(error, 'geolocation');
        locationSpan.textContent = errorInfo.message;
        
        // Take appropriate recovery action based on the recovery type
        if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
          await useDefaultLocation();
        }
      } else {
        console.error(`Unexpected location state during error: ${getLocationState()}`);
        // Handle the error anyway
        const errorInfo = handleError(error, 'geolocation');
        locationSpan.textContent = errorInfo.message;
        
        if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
          await useDefaultLocation();
        }
      }
    });
}

/**
 * Function to geocode a zip/postal code and update the map
 * 
 * FSM State Pattern:
 * - Entry State: IDLE
 * - During Execution: SEARCHING_LOCATION
 * - Success Exit State: Transitions to displayLocation function
 * - Error Exit State: ERROR (handled by error service)
 *   - May focus on input field based on recovery action
 * 
 * Future FSM Integration:
 * - Could track state explicitly: let searchState = 'SEARCHING_LOCATION'
 * - Could return state objects from async operations
 * - Could emit events for state transitions
 */
async function searchByZipCode(zipCode) {
  const locationSpan = document.querySelector('.user-location span');
  
  try {
    locationSpan.textContent = `Searching for ${zipCode}...`;
    
    // Clear any existing markers (both user and business for a new search)
    clearAllMarkers();
    
    // Use location service to geocode the zip code
    const locationData = await geocodeZipCode(zipCode);
    
    // Display the location and update the map
    await displayLocation(locationData.lat, locationData.lng, `Zip/Postal Code: ${zipCode}`);
  } catch (error) {
    // Handle errors in an FSM-friendly way
    const errorInfo = handleError(error, 'geocoding');
    locationSpan.textContent = errorInfo.message;
    
    // Take appropriate recovery action based on the recovery type
    if (errorInfo.recovery === RecoveryActions.SHOW_FORM) {
      // Focus on the zip input to encourage the user to try again
      const zipInput = document.getElementById('zip-input');
      if (zipInput) {
        zipInput.focus();
      }
    }
  }
}

// Function to set up location predictions using the modern Places Autocomplete widget
function setupLocationPredictions() {
  const zipInput = document.getElementById('zip-input');
  
  // This function is only called after the API is ready via the callback=initMap parameter
  
  console.log('Setting up Places Autocomplete');
  
  // Create the autocomplete object using configuration
  const autocomplete = new google.maps.places.Autocomplete(zipInput, AUTOCOMPLETE_CONFIG);
  
  // When a place is selected, update the map
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (!place.geometry) {
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
    
    // Display the location and update the map
    displayLocation(latitude, longitude, `Location: ${place.formatted_address || place.name}`);
  });
  
  // Prevent form submission when selecting a place with Enter key
  zipInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // If there are active suggestions, let the Autocomplete widget handle it
      if (document.querySelector('.pac-container')?.style.display !== 'none') {
        e.preventDefault();
      }
    }
  });
}

// Set up event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Call getUserLocation on page load
  getUserLocation();
  
  // Add event listener for the Locate Me button
  const locateMeButton = document.getElementById('locate-me');
  if (locateMeButton) {
    locateMeButton.addEventListener('click', getUserLocation);
  }
  
  // Add event listener for the zip code search form
  const zipSearchForm = document.getElementById('zip-search-form');
  if (zipSearchForm) {
    zipSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const zipInput = document.getElementById('zip-input');
      const zipCode = zipInput.value.trim();
      
      if (zipCode) {
        searchByZipCode(zipCode);
      }
    });
  }
});
