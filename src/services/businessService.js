/**
 * Business Service Module
 * Handles fetching and managing business data and marker interactions
 */

import { FOURSQUARE_API_KEY } from '../config.js';

/**
 * Get nearby businesses using Foursquare Places API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} limit - Maximum number of businesses to return
 * @returns {Promise<Array>} - Array of business objects
 */
async function getNearbyBusinesses(latitude, longitude, limit = 4) {
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
        'Authorization': FOURSQUARE_API_KEY
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

/**
 * Create default and highlighted marker icons for businesses
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
