// Global variables
let map;
let markers = [];
let activeInfoWindow = null;

// Load Google Maps API with the API key from environment variables
function loadGoogleMapsAPI() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is missing. Please check your .env file.');
    return;
  }
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// Initialize the map - this function is called by the Google Maps API
window.initMap = function() {
  // Create a map centered at a default location (will be updated with user's location)
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.7392, lng: -104.9903 }, // Default: Denver
    zoom: 14,
  });
  
  // Try to get user location and update the map
  getUserLocation();
  
  // Set up location predictions after Google Maps API is loaded
  // This is guaranteed to work here since the Google Maps API callback has fired
  setupLocationPredictions();
};

// Load the Google Maps API when the page loads
loadGoogleMapsAPI();

// Function to get postal code from coordinates using Google Maps Geocoding API
async function getPostalCode(latitude, longitude) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&channel=Nissan_US`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      // Extract postal code from the results
      let postalCode = 'Unknown';
      
      // Look through address components for postal code
      for (const result of data.results) {
        for (const component of result.address_components) {
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
            return postalCode;
          }
        }
      }
      
      return postalCode;
    } else {
      console.warn('Geocoding API response status:', data.status);
      return 'Unknown';
    }
  } catch (error) {
    console.error('Error getting postal code:', error);
    return 'Unknown';
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
    const postalCode = await getPostalCode(latitude, longitude);
    locationSpan.textContent = `Lat: ${Number(latitude).toFixed(6)}, Lng: ${Number(longitude).toFixed(6)} (${postalCode}) (${source})`;
    console.log(`Location from ${source}: Lat: ${latitude}, Lng: ${longitude}, Postal Code: ${postalCode}`);
    
    // Center the map on user's location
    if (map) {
      const userLocation = { lat: latitude, lng: longitude };
      map.setCenter(userLocation);
      
      // Add a marker for the user's location
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "Your Location",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
    
    // Get nearby businesses
    const businesses = await getNearbyBusinesses(latitude, longitude);
    displayNearbyBusinesses(businesses, { lat: latitude, lng: longitude });
  } catch (error) {
    console.error('Error updating with location data:', error);
  }
}

// Function to display nearby businesses in the UI and add markers to the map
function displayNearbyBusinesses(businesses, userLocation) {
  // Clear any existing markers
  clearMarkers();
  
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
  
  // Bounds for the map to fit all markers
  const bounds = new google.maps.LatLngBounds();
  
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
      
      // Create marker with label
      const marker = new google.maps.Marker({
        position: position,
        map: map,
        label: {
          text: labels[index],
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        icon: defaultIcon,
        title: business.name
      });
      
      // Store marker in global array
      markers.push(marker);
      
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
        console.log('Added highlighted class to:', listItem.id);
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
        // Debug log
        console.log('Marker hover - adding highlighted to:', listItem.id);
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
        // Debug log
        console.log('Marker hover out - removing highlighted from:', listItem.id);
      });
    }
    
    // Add to list
    businessList.appendChild(listItem);
  });
  
  // Add the list to the container
  businessesContainer.appendChild(businessList);
  
  // Fit the map to show all markers
  if (map && markers.length > 0) {
    map.fitBounds(bounds);
    
    // If we only have one marker (just the user), zoom out a bit
    if (markers.length === 0 && userLocation) {
      map.setZoom(14);
    }
  }
}

// Function to clear all markers from the map
function clearMarkers() {
  // Remove all markers from the map
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  
  // Clear the markers array
  markers = [];
}

// Function to use default location
async function useDefaultLocation() {
  // Default to Denver, CO
  const defaultLat = 39.7392;
  const defaultLng = -104.9903;
  await displayLocation(defaultLat, defaultLng, 'Default location');
}

// Get the user's location using the Geolocation API
function getUserLocation() {
  // Clear any existing markers
  clearMarkers();
  
  const locationSpan = document.querySelector('.user-location span');
  
  // Check if the browser supports geolocation
  if (navigator.geolocation) {
    // Show that we're fetching the location
    locationSpan.textContent = 'Fetching your location...';
    
    // Get the current position
    navigator.geolocation.getCurrentPosition(
      // Success callback
      async (position) => {
        // Get latitude and longitude from the position object
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Display the coordinates using our display function
        await displayLocation(latitude, longitude);
      },
      // Error callback
      async (error) => {
        // Handle errors
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.log('User denied the request for geolocation. Using default location.');
            await useDefaultLocation();
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('Location information is unavailable. Using default location.');
            await useDefaultLocation();
            break;
          case error.TIMEOUT:
            console.log('The request to get user location timed out. Using default location.');
            await useDefaultLocation();
            break;
          case error.UNKNOWN_ERROR:
            console.log('An unknown error occurred. Using default location.');
            await useDefaultLocation();
            break;
        }
      },
      // Options
      {
        enableHighAccuracy: true, // Get the most accurate position possible
        timeout: 5000,           // Time to wait before timing out (5 seconds)
        maximumAge: 0            // Don't use a cached position
      }
    );
  } else {
    // Browser doesn't support geolocation
    console.log('Geolocation is not supported by this browser. Using default location.');
    useDefaultLocation();
  }
}

// Function to geocode a zip/postal code and update the map
async function searchByZipCode(zipCode) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const locationSpan = document.querySelector('.user-location span');
  
  try {
    locationSpan.textContent = `Searching for ${zipCode}...`;
    
    // Clear any existing markers
    clearMarkers();
    
    // Use Google Maps Geocoding API to convert zip code to coordinates
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zipCode)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const latitude = location.lat;
      const longitude = location.lng;
      
      // Display the location and update the map
      await displayLocation(latitude, longitude, `Zip/Postal Code: ${zipCode}`);
    } else {
      locationSpan.textContent = `Could not find location for ${zipCode}. Error: ${data.status}`;
      console.error('Geocoding error:', data.status);
    }
  } catch (error) {
    locationSpan.textContent = `Error searching for ${zipCode}`;
    console.error('Error geocoding zip code:', error);
  }
}

// Function to set up location predictions using the modern Places Autocomplete widget
function setupLocationPredictions() {
  const zipInput = document.getElementById('zip-input');
  
  // This function is only called after the API is ready via the callback=initMap parameter
  
  console.log('Setting up Places Autocomplete');
  
  // Create the autocomplete object
  const autocomplete = new google.maps.places.Autocomplete(zipInput, {
    types: ['(regions)'], // This includes postal codes, cities, etc.
    componentRestrictions: { country: 'ca' }, // Restrict to CA - remove or change as needed
    fields: ['address_components', 'geometry', 'name', 'formatted_address']
  });
  
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
