// Import configuration and services
import { 
  GOOGLE_MAPS_API_KEY, 
  AUTOCOMPLETE_CONFIG,
  MAPS_API_CONFIG,
  validateConfig 
} from './config';

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
  BusinessMarkerInfo
} from './services/businessService';
import { processBusinessData } from './actions/businessActions';

import {
  handleError,
  RecoveryActions,
  ErrorInfo
} from './services/errorService';

// Define global interface for window object
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
  } catch (error) {
    // Handle validation errors in an FSM-friendly way
    const errorInfo = handleError(error instanceof Error ? error : new Error(String(error)), 'config_validation');
    
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

/**
 * Updates UI when map is ready or has initialization errors
 */
export function updateMapInitializationUI(data: { isReady: boolean; error?: Error; mapElementId?: string }): void {
  const { isReady, error, mapElementId = 'map' } = data;
  const mapElement = document.getElementById(mapElementId);
  
  if (!mapElement) return;
  
  if (error) {
    // Display error message in the map container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'map-error';
    errorDiv.textContent = error.message || 'Error initializing map';
    mapElement.innerHTML = '';
    mapElement.appendChild(errorDiv);
    return;
  }
  
  if (isReady) {
    // Map is ready, we could add any UI indicators here if needed
    // For example, remove any loading indicators
    const loadingIndicator = document.querySelector('.map-loading');
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

/**
 * Updates the UI for marker and list item interactions
 * 
 * @param data - Object containing interaction data
 * @param data.markerInfo - The marker info object
 * @param data.highlight - Whether to highlight or unhighlight
 * @param data.state - Current interaction state
 */
export function updateInteractionUI(data: {
  markerInfo: BusinessMarkerInfo;
  highlight: boolean;
  state?: string;
}) {
  const { markerInfo, highlight } = data;
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

// Initialize the map - this function is called by the Google Maps API
window.initMap = function(): void {
  try {
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
  } catch (error) {
    // Handle map initialization error
    updateMapInitializationUI({
      isReady: false,
      error: new Error('Failed to initialize map: ' + (error instanceof Error ? error.message : String(error)))
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
 */
async function fetchPostalCode(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Check if we're in the expected state
    if (getLocationState() !== LocationState.IDLE && getLocationState() !== LocationState.READY) {
      console.warn(`Unexpected state for postal code lookup: ${getLocationState()}`);
    }
    
    const postalCode = await getPostalCode(latitude, longitude);
    return postalCode;
  } catch (error) {
    console.error('Error getting postal code:', error);
    return null;
  }
}

/**
 * Get user's location and update the map
 */
async function getUserLocation(): Promise<void> {
  try {
    // Get user's location
    const location = await getCurrentLocation();
    
    if (location) {
      // Update the location display
      updateLocationDisplay(location.formattedAddress || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      
      // Center the map on the user's location
      setCenter(location);
      
      // Add a marker for the user's location
      addMarker(location, { 
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 8
        }
      });
      
      // Search for nearby businesses
      searchNearbyBusinesses(location);
    }
  } catch (error) {
    // Handle error getting user location
    const errorInfo = handleError(error instanceof Error ? error : new Error(String(error)), 'location');
    
    // Update the location display with the error message
    updateLocationDisplay(errorInfo.message);
    
    // If the recovery action is to use the default location, do that
    if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
      const defaultLocation = getDefaultLocation();
      
      // Update the location display
      updateLocationDisplay(defaultLocation.name || `${defaultLocation.lat.toFixed(4)}, ${defaultLocation.lng.toFixed(4)}`);
      
      // Center the map on the default location
      setCenter(defaultLocation);
      
      // Add a marker for the default location
      addMarker(defaultLocation, { title: 'Default Location' });
      
      // Search for nearby businesses
      searchNearbyBusinesses(defaultLocation);
    }
  }
}

/**
 * Update the location display in the UI
 */
function updateLocationDisplay(locationText: string): void {
  const locationSpan = document.querySelector('.user-location span');
  if (locationSpan) {
    locationSpan.textContent = locationText;
  }
}

/**
 * Search for nearby businesses
 */
async function searchNearbyBusinesses(location: { lat: number; lng: number }): Promise<void> {
  try {
    // Check if we're in the expected state
    if (getBusinessState() !== BusinessState.IDLE && getBusinessState() !== BusinessState.READY) {
      console.warn(`Unexpected state for business search: ${getBusinessState()}`);
    }
    
    // Get nearby businesses
    const businesses = await getNearbyBusinesses(location.lat, location.lng);
    
    if (businesses && businesses.length > 0) {
      // Process the business data
      const processedResult = processBusinessData(businesses);
      
      if (processedResult.success && processedResult.data) {
        // Display the businesses
        displayBusinesses(processedResult.data);
        
        // Add markers for the businesses
        addBusinessMarkers(processedResult.data);
      } else {
        console.error('Failed to process business data:', processedResult.error);
      }
    } else {
      // No businesses found
      const businessesContainer = document.getElementById('nearby-businesses');
      if (businessesContainer) {
        businessesContainer.innerHTML = '<p>No businesses found nearby.</p>';
      }
    }
  } catch (error) {
    // Handle error getting nearby businesses
    const errorInfo = handleError(error instanceof Error ? error : new Error(String(error)), 'business_search');
    
    // Display error message
    const businessesContainer = document.getElementById('nearby-businesses');
    if (businessesContainer) {
      businessesContainer.innerHTML = `<p class="error-message">${errorInfo.message}</p>`;
    }
  }
}

/**
 * Display businesses in the UI
 */
function displayBusinesses(businesses: any[]): void {
  const businessesContainer = document.getElementById('nearby-businesses');
  if (!businessesContainer) return;
  
  // Clear the container
  businessesContainer.innerHTML = '';
  
  // Create a heading
  const heading = document.createElement('h2');
  heading.textContent = 'Nearby Places';
  businessesContainer.appendChild(heading);
  
  // Create a list of businesses
  const businessList = document.createElement('ul');
  businessList.className = 'business-list';
  
  // Labels for markers (A, B, C, etc.)
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  businesses.forEach((business, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'business-item';
    listItem.dataset.businessId = business.id;
    listItem.dataset.index = index.toString();
    
    const businessName = document.createElement('h3');
    businessName.textContent = business.name;
    listItem.appendChild(businessName);
    
    if (business.category) {
      const category = document.createElement('p');
      category.className = 'category';
      category.textContent = business.category;
      listItem.appendChild(category);
    }
    
    if (business.address) {
      const address = document.createElement('p');
      address.className = 'address';
      address.textContent = business.address;
      listItem.appendChild(address);
    }
    
    // Add marker for the business if it has location data
    if (business.latlng) {
      // Get default and highlighted marker icons
      const { default: defaultIcon, highlighted: highlightedIcon } = createBusinessMarkerIcons();
      
      // Create marker with label
      const marker = addMarker(business.latlng, {
        label: {
          text: labels[index % labels.length],
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        icon: defaultIcon,
        title: business.name
      });
      
      // Only setup interactions if marker was created successfully
      if (marker) {
        // Create a marker info object
        const markerInfo: BusinessMarkerInfo = {
          marker: marker,
          listItem: listItem,
          defaultIcon: defaultIcon,
          highlightedIcon: highlightedIcon,
          business: business
        };
        
        // Setup marker and list item interactions
        setupMarkerListItemInteraction(markerInfo);
        setupBusinessClickInteraction(markerInfo);
      }
    }
    
    businessList.appendChild(listItem);
  });
  
  businessesContainer.appendChild(businessList);
}

/**
 * Add markers for businesses
 */
function addBusinessMarkers(businesses: any[]): void {
  // Clear existing business markers
  clearBusinessMarkers();
  
  // Create marker icons for businesses
  const markerIcons = createBusinessMarkerIcons();
  
  // Labels for markers (A, B, C, etc.)
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Add markers for each business
  businesses.forEach((business, index) => {
    if (business.latlng) {
      // Create marker with default icon and label
      const marker = addMarker(business.latlng, {
        title: business.name,
        icon: markerIcons.default,
        label: {
          text: labels[index % labels.length],
          color: '#FFFFFF',
          fontWeight: 'bold'
        }
      });
      
      // Only setup interactions if marker was created successfully
      if (marker) {
        // Find the corresponding list item
        const listItem = document.querySelector(`li[data-business-id="${business.id}"]`) as HTMLElement;
        
        if (listItem) {
          // Create a marker info object
          const markerInfo: BusinessMarkerInfo = {
            marker: marker,
            listItem: listItem,
            defaultIcon: markerIcons.default,
            highlightedIcon: markerIcons.highlighted,
            business: business
          };
          
          // Setup business click interaction
          setupBusinessClickInteraction(markerInfo);
        }
      }
    }
  });
  
  // Fit the map bounds to include all markers
  const markers = getMarkers();
  if (markers.length > 0) {
    const bounds = createBounds();
    markers.forEach(marker => {
      if (marker.getPosition()) {
        bounds.extend(marker.getPosition()!);
      }
    });
    fitBounds(bounds);
  }
}

/**
 * Setup autocomplete for location predictions
 */
function setupLocationPredictions(): void {
  const zipInput = document.getElementById('zip-input') as HTMLInputElement;
  if (!zipInput) return;
  
  // Create the autocomplete object
  const autocomplete = new google.maps.places.Autocomplete(zipInput, AUTOCOMPLETE_CONFIG);
  
  // When the user selects a place, get its details
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      // User entered the name of a place that was not suggested
      console.warn('No details available for input: ' + place.name);
      return;
    }
    
    // Get the location from the place
    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      formattedAddress: place.formatted_address
    };
    
    // Update the location display
    updateLocationDisplay(location.formattedAddress || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    
    // Clear existing markers
    clearAllMarkers();
    
    // Center the map on the selected location
    setCenter(location);
    
    // Add a marker for the selected location
    addMarker(location, { title: 'Selected Location' });
    
    // Search for nearby businesses
    searchNearbyBusinesses(location);
  });
}

// Setup form submission for zip code search
document.addEventListener('DOMContentLoaded', () => {
  const zipForm = document.getElementById('zip-search-form');
  if (zipForm) {
    zipForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const zipInput = document.getElementById('zip-input') as HTMLInputElement;
      if (!zipInput || !zipInput.value) return;
      
      try {
        // Geocode the zip code
        const location = await geocodeZipCode(zipInput.value);
        
        if (location) {
          // Update the location display
          updateLocationDisplay(location.formattedAddress || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
          
          // Clear existing markers
          clearAllMarkers();
          
          // Center the map on the geocoded location
          setCenter(location);
          
          // Add a marker for the geocoded location
          addMarker(location, { title: 'Searched Location' });
          
          // Search for nearby businesses
          searchNearbyBusinesses(location);
        }
      } catch (error) {
        // Handle error geocoding zip code
        const errorInfo = handleError(error instanceof Error ? error : new Error(String(error)), 'postal_code');
        
        // Update the location display with the error message
        updateLocationDisplay(errorInfo.message);
      }
    });
  }
  
  // Setup locate me button
  const locateButton = document.getElementById('locate-me');
  if (locateButton) {
    locateButton.addEventListener('click', () => {
      // Clear existing markers
      clearAllMarkers();
      
      // Get user location
      getUserLocation();
    });
  }
});
