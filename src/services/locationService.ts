/**
 * Location Service Module
 * Handles geolocation and address-related functionality
 *
 * FSM State Patterns:
 * This module implements loose FSM patterns for future integration with a state machine.
 *
 * Potential Location States:
 * - IDLE: Initial state, no location operations in progress
 * - FETCHING: Actively retrieving user location
 * - GEOCODING: Converting coordinates to address or vice versa
 * - READY: Location data successfully retrieved
 * - ERROR: Error occurred during location operations
 */

import type { LatLng, LocationResult, LocationState as LocationStateType } from '../types/core';
import { DEFAULT_LOCATION } from '../config';
import { fetchGeolocationData, fetchDefaultLocation, geocodeAddress, reverseGeocode } from '../actions/locationActions';

/**
 * Location state constants
 */
export const LocationState = {
  IDLE: 'IDLE' as LocationStateType,
  FETCHING: 'FETCHING' as LocationStateType,
  GEOCODING: 'GEOCODING' as LocationStateType,
  READY: 'READY' as LocationStateType,
  ERROR: 'ERROR' as LocationStateType,
};

let currentLocationState: LocationStateType = LocationState.IDLE;

/** Get the current state of the location service. */
export function getLocationState(): LocationStateType {
  return currentLocationState;
}

/** Get the user's current location using the Geolocation API. */
export async function getCurrentLocation(): Promise<LatLng> {
  currentLocationState = LocationState.FETCHING;
  const result = await fetchGeolocationData();
  if (result.success) {
    currentLocationState = LocationState.READY;
    return result.data!;
  } else {
    currentLocationState = LocationState.ERROR;
    throw result.error;
  }
}

/** Get postal code from coordinates using Google Maps Geocoding API. */
export async function getPostalCode(latitude: number, longitude: number): Promise<string> {
  currentLocationState = LocationState.GEOCODING;
  const result = await reverseGeocode(latitude, longitude);
  if (result.success) {
    currentLocationState = LocationState.READY;
    return result.data!.postalCode;
  } else {
    console.warn('Reverse geocoding error:', result.error);
    currentLocationState = LocationState.ERROR;
    return 'Unknown';
  }
}

/** Geocode a zip/postal code to get coordinates. */
export async function geocodeZipCode(zipCode: string): Promise<LatLng & { formattedAddress: string }> {
  currentLocationState = LocationState.GEOCODING;
  const result = await geocodeAddress(zipCode);
  if (result.success) {
    currentLocationState = LocationState.READY;
    return {
      lat: result.data!.lat,
      lng: result.data!.lng,
      formattedAddress: result.data!.formattedAddress!
    };
  } else {
    currentLocationState = LocationState.ERROR;
    throw result.error;
  }
}

/** Get the default location as a fallback. */
export function getDefaultLocation(): LatLng & { name: string } {
  const result: LocationResult = fetchDefaultLocation();
  if (result.success && result.data) {
    const { lat, lng, name } = result.data as LatLng & { name: string };
    return { lat, lng, name };
  } else {
    console.error('Error getting default location:', result.error);
    return DEFAULT_LOCATION;
  }
}
