import { MAP_CONFIG } from '../config.js';
import type { LatLng, MapResult, Result } from '../types/core';

/** Initialize a Google Map instance */
export function initializeGoogleMap(
  elementId: string,
  config: Partial<google.maps.MapOptions> = {}
): MapResult<{ map: google.maps.Map; elementId: string; config: google.maps.MapOptions }> {
  if (!elementId) return { success: false, error: new Error('Element ID is required') };
  const mapElement = document.getElementById(elementId);
  if (!mapElement) return { success: false, error: new Error(`Map element with ID "${elementId}" not found`) };

  const mapOptions: google.maps.MapOptions = {
    ...MAP_CONFIG,
    ...config
  };

  try {
    const map = new google.maps.Map(mapElement, mapOptions);
    return { success: true, data: { map, elementId, config: mapOptions } };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/** Create a marker on the provided map */
export function createMapMarker(
  position: LatLng,
  options: google.maps.MarkerOptions = {},
  map: google.maps.Map
): MapResult<{ marker: google.maps.Marker; position: LatLng }> {
  if (!position || position.lat === undefined || position.lng === undefined)
    return { success: false, error: new Error('Valid position with lat and lng is required') };
  if (!map) return { success: false, error: new Error('Map instance is required') };
  try {
    const marker = new google.maps.Marker({ position, map, ...options });
    return { success: true, data: { marker, position } };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/** Update map center / zoom */
export function updateMapView(
  map: google.maps.Map,
  position: LatLng,
  zoom: number | null = null
): MapResult<{ position: LatLng; zoom: number }> {
  if (!map) return { success: false, error: new Error('Map instance is required') };
  if (!position) return { success: false, error: new Error('Position is required') };
  try {
    map.setCenter(position);
    if (zoom !== null) {
      if (zoom < 0) return { success: false, error: new Error('Zoom must be non-negative') };
      map.setZoom(zoom);
    }
    const resolvedZoom: number = zoom ?? map.getZoom() ?? MAP_CONFIG.zoom;
    return { success: true, data: { position, zoom: resolvedZoom } };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/** Build LatLngBounds from an array of positions */
export function createMapBounds(positions: LatLng[] = []): MapResult<{ bounds: google.maps.LatLngBounds; isEmpty: boolean }> {
  if (!Array.isArray(positions)) return { success: false, error: new Error('Positions must be an array') };
  const bounds = new google.maps.LatLngBounds();
  let valid = 0;
  positions.forEach(p => {
    if (p && p.lat !== undefined && p.lng !== undefined) {
      bounds.extend(p);
      valid++;
    }
  });
  return { success: true, data: { bounds, isEmpty: valid === 0 } };
}

/** Fit map view to bounds */
export function fitMapBounds(
  map: google.maps.Map,
  bounds: google.maps.LatLngBounds,
  options: { padding?: number } = {}
): MapResult {
  if (!map) return { success: false, error: new Error('Map instance is required') };
  if (!bounds) return { success: false, error: new Error('Bounds object is required') };
  if (bounds.isEmpty()) return { success: false, error: new Error('Cannot fit to empty bounds') };
  try {
    map.fitBounds(bounds, options.padding);
    return { success: true };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/** Clear provided markers from the map */
export function clearMapMarkers(markers: google.maps.Marker[] = []): Result<{ clearedCount: number; failedCount: number }> {
  if (!Array.isArray(markers)) return { success: false, error: new Error('Markers must be an array') };
  let cleared = 0;
  let failed = 0;
  markers.forEach(m => {
    try {
      if (m && typeof m.setMap === 'function') {
        m.setMap(null);
        cleared++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  });
  return { success: true, data: { clearedCount: cleared, failedCount: failed } };
}
