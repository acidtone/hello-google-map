/**
 * Location Actions Module
 * 
 * This module contains pure action functions related to location operations.
 * These functions are designed to be triggered by FSM state transitions and don't
 * directly modify UI or global state. Each function returns a result object with
 * a consistent structure.
 */

import { DEFAULT_LOCATION, GOOGLE_MAPS_API_KEY } from '../config';
import { 
  Result, 
  Location, 
  GeocodingResult, 
  GeolocationError
} from '../types';

/**
 * Fetch user's geolocation data using browser's Geolocation API
 * 
 * This is a pure function that doesn't modify global state or UI.
 * It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_FETCHING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @returns Promise with Result containing Location data or GeolocationError
 */
export function fetchGeolocationData(): Promise<Result<Location, GeolocationError>> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: {
          code: 0,
          message: 'Geolocation is not supported by this browser.',
          type: 'UNKNOWN_ERROR'
        }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: 'Geolocation API'
          }
        });
      },
      (error) => {
        // Map browser GeolocationPositionError to our GeolocationError type
        const errorType = (() => {
          switch (error.code) {
            case 1: return 'PERMISSION_DENIED';
            case 2: return 'POSITION_UNAVAILABLE';
            case 3: return 'TIMEOUT';
            default: return 'UNKNOWN_ERROR';
          }
        })() as GeolocationError['type'];
        
        resolve({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            type: errorType
          }
        });
      }
    );
  });
}

/**
 * Fetch default location from configuration
 * 
 * This is a pure function that returns the default location when geolocation fails.
 * It can be triggered by an FSM state transition like:
 * LOCATION_ERROR -> LOCATION_FALLBACK -> LOCATION_READY
 * 
 * @returns Result containing Location data or Error
 */
export function fetchDefaultLocation(): Result<Location, Error> {
  try {
    // Validate that default location is properly configured
    if (!DEFAULT_LOCATION || typeof DEFAULT_LOCATION.lat !== 'number' || typeof DEFAULT_LOCATION.lng !== 'number') {
      return {
        success: false,
        error: new Error('Default location is not properly configured')
      };
    }
    
    return {
      success: true,
      data: {
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
        name: DEFAULT_LOCATION.name || 'Default Location',
        source: 'Default Configuration'
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Geocode an address (including zip/postal codes) to coordinates
 * 
 * This is a pure function that converts an address string to geographic coordinates
 * using the Google Maps Geocoding API. It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_GEOCODING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @param address - The address to geocode (can be a zip/postal code)
 * @param apiKey - Google Maps API key (optional, uses config by default)
 * @returns Promise with Result containing GeocodingResult or Error
 */
export async function geocodeAddress(
  address: string, 
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<Result<GeocodingResult, Error>> {
  try {
    // Validate input
    if (!address) {
      return {
        success: false,
        error: new Error('Address is required')
      };
    }
    
    if (!apiKey) {
      return {
        success: false,
        error: new Error('Google Maps API key is required')
      };
    }
    
    // Make the geocoding API request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // Process the response
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      // Get location coordinates to include in the GeocodingResult
      const locationCoords = result.geometry.location;
      
      // Convert address components to our format
      const addressComponents: Record<string, string> = {};
      result.address_components.forEach((component: any) => {
        component.types.forEach((type: string) => {
          addressComponents[type] = component.long_name;
        });
      });
      
      const geocodingResult: GeocodingResult = {
        formattedAddress: result.formatted_address,
        addressComponents,
        placeId: result.place_id,
        postalCode: addressComponents['postal_code'],
        lat: locationCoords.lat,
        lng: locationCoords.lng
      };
      
      return {
        success: true,
        data: geocodingResult
      };
    } else {
      return {
        success: false,
        error: new Error(`Geocoding error: ${data.status}`)
      };
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Reverse geocode coordinates to address components
 * 
 * This is a pure function that converts geographic coordinates to address components
 * using the Google Maps Geocoding API. It can be triggered by an FSM state transition like:
 * LOCATION_IDLE -> LOCATION_GEOCODING -> LOCATION_READY/LOCATION_ERROR
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @param apiKey - Google Maps API key (optional, uses config by default)
 * @returns Promise with Result containing GeocodingResult or Error
 */
export async function reverseGeocode(
  latitude: number, 
  longitude: number, 
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<Result<GeocodingResult, Error>> {
  try {
    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return {
        success: false,
        error: new Error('Latitude and longitude are required')
      };
    }
    
    if (!apiKey) {
      return {
        success: false,
        error: new Error('Google Maps API key is required')
      };
    }
    
    // Make the reverse geocoding API request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // Process the response
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Extract all address components
      const addressComponents: Record<string, string> = {};
      const postalCode = { found: false, value: 'Unknown' };
      
      // Process all results to find postal code and other components
      for (const result of data.results) {
        for (const component of result.address_components) {
          // Store each component by its type
          component.types.forEach((type: string) => {
            if (!addressComponents[type]) {
              addressComponents[type] = component.long_name;
            }
            
            // Special handling for postal code
            if (type === 'postal_code' && !postalCode.found) {
              postalCode.found = true;
              postalCode.value = component.long_name;
            }
          });
        }
        
        // If we found a postal code, no need to check further results
        if (postalCode.found) break;
      }
      
      return {
        success: true,
        data: {
          formattedAddress: data.results[0].formatted_address,
          addressComponents,
          postalCode: postalCode.value,
          placeId: data.results[0].place_id,
          lat: latitude,
          lng: longitude
        }
      };
    } else {
      return {
        success: false,
        error: new Error(`Reverse geocoding error: ${data.status}`)
      };
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
