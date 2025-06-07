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
  clearMarkers as clearMapMarkers,
  setCenter,
  createBounds,
  fitBounds,
  createInfoWindow,
  openInfoWindow,
  closeActiveInfoWindow,
  getMarkers
} from './services/mapService.js';

import {
  getCurrentLocation,
  getPostalCode,
  geocodeZipCode,
  getDefaultLocation
} from './services/locationService.js';

// Map is now managed by the map service

// Load Google Maps API with the API key from configuration
function loadGoogleMapsAPI() {
  // Validate configuration before proceeding
  if (!validateConfig()) {
    return;
  }
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${MAPS_API_CONFIG.libraries.join(',')}&callback=${MAPS_API_CONFIG.callback}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
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

// Function to get postal code from coordinates using location service
async function fetchPostalCode(latitude, longitude) {
  try {
    // Use the location service to get the postal code
    return await getPostalCode(latitude, longitude);
  } catch (error) {
    console.error('Error getting postal code:', error);
    return 'Error';
  }
}

// Function to get nearby businesses using Foursquare Places API
async function getNearbyBusinesses(latitude, longitude, limit = 4) {
  const apiKey = import.meta.env.VITE_FOURSQUARE_API_KEY || 'PLACEHOLDER_API_KEY';
  
  try {
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
        'Authorization': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching nearby businesses:', error);
    return [];
  }
}

// Function to display location information
async function displayLocation(latitude, longitude, source = 'Geolocation API') {
  const locationSpan = document.querySelector('.user-location span');
  
  // First update with just coordinates
  locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${source})`;
  
  try {
    // Get postal code
    const postalCode = await fetchPostalCode(latitude, longitude);
    locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${postalCode}) (${source})`;
    console.log(`Location from ${source}: Lat: ${latitude}, Lng: ${longitude}, Postal Code: ${postalCode}`);
    
    // Center the map on user's location using map service
    const userLocation = { lat: latitude, lng: longitude };
    setCenter(userLocation);
    
    // Add a marker for the user's location using map service
    addMarker(userLocation, {
      title: "Your Location",
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    });
    
    // Get nearby businesses
    const businesses = await getNearbyBusinesses(latitude, longitude);
    displayNearbyBusinesses(businesses, userLocation);
  } catch (error) {
    console.error('Error updating with location data:', error);
  }
}

// Function to display nearby businesses in the UI and add markers to the map
function displayNearbyBusinesses(businesses, userLocation) {
  // Clear any existing markers using map service
  clearAllMarkers();
  
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
      
      // Define default and highlighted marker icons
      const defaultIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#EA4335',
        fillOpacity: 1,
        scale: 10,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        labelOrigin: new google.maps.Point(0, 0)
      };
      
      const highlightedIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4', // Google blue
        fillOpacity: 1,
        scale: 10,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        labelOrigin: new google.maps.Point(0, 0)
      };
      
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
      
      // Add click event to marker - go to website
      if (business.website) {
        marker.addListener('click', () => {
          window.open(business.website, '_blank');
        });
      }
      
      // Hover interactions between list items and markers
      listItem.addEventListener('mouseenter', () => {
        // Highlight the marker by changing its icon
        marker.setIcon(highlightedIcon);
        // Add highlighted class to list item
        listItem.classList.add('highlighted');
      });
      
      listItem.addEventListener('mouseleave', () => {
        // Restore default icon
        marker.setIcon(defaultIcon);
        // Remove highlighted class from list item
        listItem.classList.remove('highlighted');
      });
      
      // Also add hover effect for marker to highlight list item
      marker.addListener('mouseover', () => {
        // Highlight the marker
        marker.setIcon(highlightedIcon);
        // Add highlighted class to list item
        listItem.classList.add('highlighted');
        // Force a repaint to ensure the style is applied
        listItem.style.display = 'none';
        listItem.offsetHeight; // This triggers a reflow
        listItem.style.display = '';
      });
      
      marker.addListener('mouseout', () => {
        // Restore default icon
        marker.setIcon(defaultIcon);
        // Remove highlighted class from list item
        listItem.classList.remove('highlighted');
      });
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

// Function to clear all markers from the map (wrapper around map service)
function clearAllMarkers() {
  // Use the map service's clearMarkers function
  return clearMapMarkers();
}

// Function to use default location
async function useDefaultLocation() {
  // Get default location from location service
  const defaultLocation = getDefaultLocation();
  await displayLocation(defaultLocation.lat, defaultLocation.lng, defaultLocation.name);
}

// Get the user's location using the location service
function getUserLocation() {
  // Clear any existing markers
  clearAllMarkers();
  
  const locationSpan = document.querySelector('.user-location span');
  locationSpan.textContent = 'Fetching your location...';
  
  // Use the location service to get the current location
  getCurrentLocation()
    .then(async (position) => {
      // Display the coordinates using our display function
      await displayLocation(position.lat, position.lng);
    })
    .catch(async (error) => {
      // Handle errors
      console.log('Error getting location:', error.message);
      await useDefaultLocation();
    });
}

// Function to geocode a zip/postal code and update the map
async function searchByZipCode(zipCode) {
  const locationSpan = document.querySelector('.user-location span');
  
  try {
    locationSpan.textContent = `Searching for ${zipCode}...`;
    
    // Clear any existing markers
    clearAllMarkers();
    
    // Use location service to geocode the zip code
    const locationData = await geocodeZipCode(zipCode);
    
    // Display the location and update the map
    await displayLocation(locationData.lat, locationData.lng, `Zip/Postal Code: ${zipCode}`);
  } catch (error) {
    locationSpan.textContent = `Could not find location for ${zipCode}`;
    console.error('Error geocoding zip code:', error);
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
