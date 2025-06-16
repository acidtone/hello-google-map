/**
 * Business Actions Module
 * 
 * This module contains pure action functions related to business data operations.
 * These functions are designed to be triggered by FSM state transitions and don't
 * directly modify UI or global state. Each function returns a Result object with
 * a consistent structure.
 */

import { FOURSQUARE_API_KEY } from '../config';
import { Business, BusinessSearchParams, BusinessSearchOptions } from '../types/business';
import { Result } from '../types/result';

/**
 * Fetch business data from Foursquare API
 * 
 * This is a pure function that doesn't modify global state or UI.
 * It can be triggered by an FSM state transition like:
 * LOCATION_READY -> BUSINESS_SEARCHING -> BUSINESS_READY/BUSINESS_ERROR
 * 
 * @param location - Location data object with latitude and longitude
 * @param limit - Maximum number of businesses to return
 * @returns Promise with Result containing array of Business objects or Error
 */
export async function fetchBusinessData(
  location: BusinessSearchParams,
  limit: number = 4
): Promise<Result<Business[], Error>> {
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
      radius: '1000', // 1000 meters radius (as string for URLSearchParams)
      limit: limit.toString(),
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
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Clear business data
 * 
 * This is a pure function that returns a success result when business data
 * should be cleared. It can be triggered by an FSM state transition like:
 * ANY_STATE -> BUSINESS_IDLE
 * 
 * @returns Result with null data
 */
export function clearBusinessData(): Result<null, never> {
  return {
    success: true,
    data: null
  };
}

/**
 * Process business data for display
 * 
 * This is a pure function that processes business data before it's displayed.
 * It can perform filtering, sorting, enrichment, or other transformations.
 * It can be triggered by an FSM state transition like:
 * BUSINESS_READY -> BUSINESS_PROCESSED
 * 
 * @param businesses - Array of business objects from Foursquare API
 * @param options - Processing options for limit and sort criteria
 * @returns Result with processed business data or error
 */
export function processBusinessData(
  businesses: Business[], 
  options: BusinessSearchOptions = {}
): Result<Business[], Error> {
  try {
    // Default options
    const {
      limit = 4,
      sortBy = 'distance'
    } = options;
    
    // Validate input
    if (!Array.isArray(businesses)) {
      return {
        success: false,
        error: new Error('Invalid business data: expected an array')
      };
    }
    
    // Create a copy to avoid mutating the original data
    let processedBusinesses = [...businesses];
    
    // Apply sorting if needed (Foursquare already sorts by distance by default)
    if (sortBy !== 'distance' && processedBusinesses.length > 0) {
      // Additional sorting options could be implemented here
      // For now, we'll keep the default Foursquare sorting
    }
    
    // Apply limit
    if (processedBusinesses.length > limit) {
      processedBusinesses = processedBusinesses.slice(0, limit);
    }
    
    // Enrich business data with additional properties if needed
    processedBusinesses = processedBusinesses.map(business => {
      // Create a copy of the business to avoid mutating the original
      const enriched = { ...business };
      
      // Add a formatted address if not already present
      if (business.location && (!business.location.formattedAddress || business.location.formattedAddress.length === 0)) {
        const { address, city, state, postalCode, country } = business.location;
        const addressParts = [address, city, state, postalCode, country].filter(Boolean);
        // Set as a string array to match the Business type
        enriched.location.formattedAddress = [addressParts.join(', ')];
      }
      
      return enriched;
    });
    
    return {
      success: true,
      data: processedBusinesses
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
