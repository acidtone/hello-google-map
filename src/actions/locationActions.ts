import { DEFAULT_LOCATION, GOOGLE_MAPS_API_KEY } from '../config';
import type { LatLng, LocationResult, Result } from '../types/core';

/**
 * Fetch user's geolocation data using browser's Geolocation API (async)
 */
export function fetchGeolocationData(): Promise<LocationResult> {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve({ success: false, error: new Error('Geolocation is not supported by this browser.') });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        resolve({ success: true, data: { ...coords, source: 'Geolocation API' } as any });
      },
      error => resolve({ success: false, error: new Error(error.message) })
    );
  });
}

/**
 * Return the default configured location.
 */
export function fetchDefaultLocation(): LocationResult {
  if (!DEFAULT_LOCATION || typeof DEFAULT_LOCATION.lat !== 'number' || typeof DEFAULT_LOCATION.lng !== 'number') {
    return { success: false, error: new Error('Default location is not properly configured') };
  }
  const data: LatLng & { name: string; source: string } = {
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
    name: DEFAULT_LOCATION.name || 'Default Location',
    source: 'Default Configuration'
  } as any;
  return { success: true, data };
}

/**
 * Geocode an address (or postal code) to coordinates via Google Maps Geocoding API.
 */
export async function geocodeAddress(
  address: string,
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<LocationResult> {
  if (!address) return { success: false, error: new Error('Address is required') };
  if (!apiKey) return { success: false, error: new Error('Google Maps API key is required') };

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      const location: LatLng = result.geometry.location;
      return {
        success: true,
        data: {
          ...location,
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id
        }
      };
    }
    return { success: false, error: new Error(`Geocoding error: ${data.status}`), errorDetails: data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Reverse-geocode coordinates to address components via Google Maps Geocoding API.
 */
export async function reverseGeocode(
  latitude: number | undefined,
  longitude: number | undefined,
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<Result<{ formattedAddress: string; addressComponents: Record<string, string>; postalCode: string; placeId: string }>> {
  if (latitude === undefined || longitude === undefined) {
    return { success: false, error: new Error('Latitude and longitude are required') };
  }
  if (!apiKey) {
    return { success: false, error: new Error('Google Maps API key is required') };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const addressComponents: Record<string, string> = {};
      let postalCode = 'Unknown';

      for (const res of data.results) {
        for (const comp of res.address_components as google.maps.GeocoderAddressComponent[]) {
          comp.types.forEach((type: string) => {
            if (!addressComponents[type]) addressComponents[type] = comp.long_name;
            if (type === 'postal_code' && postalCode === 'Unknown') postalCode = comp.long_name;
          });
        }
        if (postalCode !== 'Unknown') break;
      }

      return {
        success: true,
        data: {
          formattedAddress: data.results[0].formatted_address,
          addressComponents,
          postalCode,
          placeId: data.results[0].place_id
        }
      };
    }
    return { success: false, error: new Error(`Reverse geocoding error: ${data.status}`), errorDetails: data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
