import type { LatLng } from '../types/core';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG, MAPS_API_CONFIG } from '../config';
import { clearBusinessData } from '../actions/businessActions';
import {
  initializeGoogleMap,
  createMapMarker,
  updateMapView,
  createMapBounds,
  fitMapBounds,
  clearMapMarkers
} from '../actions/mapActions';

/** Map state constants */
export type MapStateType = 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'ERROR' | 'UPDATING';
export const MapState: Record<MapStateType, MapStateType> = {
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  ERROR: 'ERROR',
  UPDATING: 'UPDATING'
};

let map: google.maps.Map | null = null;
let markers: google.maps.Marker[] = [];
let userMarkers: google.maps.Marker[] = [];
let businessMarkers: google.maps.Marker[] = [];
let activeInfoWindow: google.maps.InfoWindow | null = null;
let currentMapState: MapStateType = MapState.UNINITIALIZED;

/** Get current map state */
export function getMapState(): MapStateType {
  return currentMapState;
}

/** Initialize the map */
export function initializeMap(elementId: string): google.maps.Map | null {
  currentMapState = MapState.INITIALIZING;
  if (!map) {
    try {
      const result = initializeGoogleMap(elementId);
      if (result.success) {
        map = result.data.map;
        currentMapState = MapState.READY;
      } else {
        currentMapState = MapState.ERROR;
        console.error('Map initialization failed:', result.error);
      }
    } catch (error) {
      currentMapState = MapState.ERROR;
      console.error('Map initialization failed:', error);
    }
  }
  return map;
}

/** Get the current map instance */
export function getMap(): google.maps.Map | null {
  if (currentMapState === MapState.ERROR) console.warn('Map is in ERROR state and may not be usable');
  else if (currentMapState === MapState.INITIALIZING) console.warn('Map is still initializing and may not be ready');
  else if (currentMapState === MapState.UNINITIALIZED) console.warn('Map has not been initialized yet');
  return map;
}

/** Add a marker to the map */
export function addMarker(
  position: LatLng,
  options: google.maps.MarkerOptions = {},
  markerType: 'user' | 'business' = 'business'
): google.maps.Marker | null {
  if (!map) {
    console.error('Map not initialized');
    return null;
  }
  currentMapState = MapState.UPDATING;
  try {
    const result = createMapMarker(position, options, map);
    if (result.success) {
      const marker = result.data.marker;
      markers.push(marker);
      if (markerType === 'user') userMarkers.push(marker);
      else businessMarkers.push(marker);
      currentMapState = MapState.READY;
      return marker;
    } else {
      currentMapState = MapState.ERROR;
      console.error('Failed to create marker:', result.error);
      return null;
    }
  } catch (error) {
    currentMapState = MapState.ERROR;
    console.error('Failed to add marker:', error);
    return null;
  }
}

/** Clear all markers from the map */
export function clearAllMarkers(): void {
  currentMapState = MapState.UPDATING;
  try {
    clearMapMarkers(markers);
    markers = [];
    activeInfoWindow = null;
    currentMapState = MapState.READY;
  } catch (error) {
    currentMapState = MapState.ERROR;
    console.error('Failed to clear markers:', error);
  }
}

/** Clear only business markers */
export function clearBusinessMarkers(): void {
  clearBusinessData();
  clearMapMarkers(businessMarkers);
  businessMarkers = [];
}

/** Clear only user markers */
export function clearUserMarkers(): void {
  clearMapMarkers(userMarkers);
  userMarkers = [];
}

/** Set map center and zoom */
export function setCenter(position: LatLng, zoom: number | null = null): void {
  if (!map) {
    console.error('Map not initialized');
    return;
  }
  currentMapState = MapState.UPDATING;
  try {
    const result = updateMapView(map, position, zoom);
    if (result.success) currentMapState = MapState.READY;
    else {
      currentMapState = MapState.ERROR;
      console.error('Failed to update map view:', result.error);
    }
  } catch (error) {
    currentMapState = MapState.ERROR;
    console.error('Failed to update map view:', error);
  }
}

/** Create bounds from positions */
export function createBounds(positions: LatLng[] = []): google.maps.LatLngBounds {
  const result = createMapBounds(positions);
  if (result.success) return result.data.bounds;
  console.error('Failed to create bounds:', result.error);
  const fallback = new google.maps.LatLngBounds();
  positions.forEach(p => { if (p) fallback.extend(p); });
  return fallback;
}

/** Fit map to bounds */
export function fitBounds(bounds: google.maps.LatLngBounds, options: { padding?: number } = {}): void {
  if (!map) {
    console.error('Map not initialized');
    return;
  }
  currentMapState = MapState.UPDATING;
  try {
    const result = fitMapBounds(map, bounds, options);
    if (result.success) currentMapState = MapState.READY;
    else {
      currentMapState = MapState.ERROR;
      console.error('Failed to fit bounds:', result.error);
    }
  } catch (error) {
    currentMapState = MapState.ERROR;
    console.error('Failed to fit bounds:', error);
  }
}

/** Create an info window */
export function createInfoWindow(content: string): google.maps.InfoWindow {
  return new google.maps.InfoWindow({ content });
}

/** Open an info window */
export function openInfoWindow(infoWindow: google.maps.InfoWindow, marker: google.maps.Marker): void {
  if (activeInfoWindow) activeInfoWindow.close();
  infoWindow.open(map, marker);
  activeInfoWindow = infoWindow;
}

/** Close the active info window */
export function closeActiveInfoWindow(): void {
  if (activeInfoWindow) {
    activeInfoWindow.close();
    activeInfoWindow = null;
  }
}

/** Get all current markers */
export function getMarkers(): google.maps.Marker[] {
  return markers;
}
