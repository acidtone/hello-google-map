import type { Business, Result } from '../types/core';
import { handleError } from './errorService';
import { updateInteractionUI } from '../main';
import { fetchBusinessData } from '../actions/businessActions';

/** Business state constants */
export type BusinessStateType = 'IDLE' | 'SEARCHING' | 'READY' | 'ERROR' | 'INTERACTING';
export const BusinessState: { [K in BusinessStateType]: BusinessStateType } = {
  IDLE: 'IDLE',
  SEARCHING: 'SEARCHING',
  READY: 'READY',
  ERROR: 'ERROR',
  INTERACTING: 'INTERACTING',
};

let currentBusinessState: BusinessStateType = BusinessState.IDLE;

/** Get current state of business service */
export function getBusinessState(): BusinessStateType {
  return currentBusinessState;
}

/** Get nearby businesses using Foursquare Places API */
export async function getNearbyBusinesses(
  latitude: number,
  longitude: number,
  limit: number = 4
): Promise<Business[]> {
  currentBusinessState = BusinessState.SEARCHING;
  try {
    const result = await fetchBusinessData({ lat: latitude, lng: longitude }, limit);
    if (result.success) {
      currentBusinessState = BusinessState.READY;
      return result.data!;
    } else {
      currentBusinessState = BusinessState.ERROR;
      throw result.error;
    }
  } catch (error) {
    currentBusinessState = BusinessState.ERROR;
    const errorInfo = handleError(error as Error, 'business_search');
    console.error('Error fetching nearby businesses:', error, errorInfo);
    return [];
  }
}

/** Create default and highlighted marker icons for businesses */
export function createBusinessMarkerIcons(): {
  default: google.maps.Icon | google.maps.Symbol;
  highlighted: google.maps.Icon | google.maps.Symbol;
} {
  return {
    default: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#EA4335',
      fillOpacity: 1,
      scale: 10,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      labelOrigin: new google.maps.Point(0, 0),
    },
    highlighted: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      scale: 10,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      labelOrigin: new google.maps.Point(0, 0),
    },
  };
}

/** Marker/list item interaction info */
export interface BusinessMarkerInfo {
  marker: google.maps.Marker;
  listItem: HTMLElement;
  defaultIcon: google.maps.Icon;
  highlightedIcon: google.maps.Icon;
  business: Business;
}

/** Setup two-way hover interactions between marker and list item */
export function setupMarkerListItemInteraction(
  markerInfo: BusinessMarkerInfo
): void {
  const { marker, listItem, defaultIcon, highlightedIcon } = markerInfo;

  // List item hover
  listItem.addEventListener('mouseenter', () => {
    if (currentBusinessState !== BusinessState.ERROR) {
      const prev = currentBusinessState;
      currentBusinessState = BusinessState.INTERACTING;
      highlightMarkerAndListItem(markerInfo, true);
      currentBusinessState = prev;
    } else {
      highlightMarkerAndListItem(markerInfo, true);
    }
  });
  listItem.addEventListener('mouseleave', () => {
    highlightMarkerAndListItem(markerInfo, false);
  });

  // Marker hover
  marker.addListener('mouseover', () => {
    if (currentBusinessState !== BusinessState.ERROR) {
      const prev = currentBusinessState;
      currentBusinessState = BusinessState.INTERACTING;
      highlightMarkerAndListItem(markerInfo, true);
      currentBusinessState = prev;
    } else {
      highlightMarkerAndListItem(markerInfo, true);
    }
  });
  marker.addListener('mouseout', () => {
    highlightMarkerAndListItem(markerInfo, false);
  });
}

/** Highlight or unhighlight a marker and its list item */
export function highlightMarkerAndListItem(
  markerInfo: BusinessMarkerInfo,
  highlight: boolean
): void {
  updateInteractionUI({ markerInfo, highlight, state: currentBusinessState });
}

/** Setup click interaction for a business marker and list item */
export function setupBusinessClickInteraction(
  markerInfo: BusinessMarkerInfo
): void {
  const { marker, listItem, business } = markerInfo;
  if (!business.website) return;

  const handleClick = () => {
    const prev = currentBusinessState;
    if (prev !== BusinessState.ERROR) {
      currentBusinessState = BusinessState.INTERACTING;
      window.open(business.website, '_blank');
      currentBusinessState = prev;
    } else {
      window.open(business.website, '_blank');
    }
  };

  marker.addListener('click', handleClick);
  listItem.style.cursor = 'pointer';
  listItem.addEventListener('click', e => {
    if ((e.target as HTMLElement).tagName.toLowerCase() !== 'a') {
      handleClick();
    }
  });
}
