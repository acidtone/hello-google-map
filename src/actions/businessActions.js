/**
 * Business Actions Module
 * 
 * This module contains pure action functions related to business data operations.
 * These functions are designed to be triggered by FSM state transitions and don't
 * directly modify UI or global state. Each function returns a result object with
 * a consistent structure.
 * 
 * Result object structure:
 * {
 *   success: boolean,  // Whether the action was successful
 *   data?: any,        // Optional data returned by the action
 *   error?: Error      // Optional error information if success is false
 * }
 */

import { FOURSQUARE_API_KEY } from '../config.js';

/**
 * Fetch business data from Foursquare API
 * 
 * This is a pure function that doesn't modify global state or UI.
 * It can be triggered by an FSM state transition like:
 * LOCATION_READY -> BUSINESS_SEARCHING -> BUSINESS_READY/BUSINESS_ERROR
 * 
 * @param {Object} location - Location data object
 * @param {number} location.latitude - Latitude coordinate
 * @param {number} location.longitude - Longitude coordinate
 * @param {number} [limit=4] - Maximum number of businesses to return
 * @returns {Promise<Object>} - Result object with success, data, and error properties
 */
export async function fetchBusinessData(location, limit = 4) {
  try {
    const { latitude, longitude } = location;
    
    // Validate inputs
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        success: false,
        error: new Error('Invalid location coordinates')
      };
    }
    
    // Validate API key configuration
    if (!FOURSQUARE_API_KEY || FOURSQUARE_API_KEY === 'PLACEHOLDER_API_KEY') {
      return {
        success: false,
        error: new Error('Foursquare API key is missing. Please check your .env file.')
      };
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
      return {
        success: false,
        error: new Error(`Foursquare API error: ${response.status}`)
      };
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error
    };
  }
}
