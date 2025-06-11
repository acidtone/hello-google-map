import { FOURSQUARE_API_KEY } from '../config';
import type { LatLng, Business, Result } from '../types/core';

/** Fetch business data from Foursquare API */
export async function fetchBusinessData(
  location: LatLng,
  limit: number = 4
): Promise<Result<Business[]>> {
  const { lat, lng } = location;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { success: false, error: new Error('Invalid location coordinates') };
  }
  if (!FOURSQUARE_API_KEY || FOURSQUARE_API_KEY === 'PLACEHOLDER_API_KEY') {
    return { success: false, error: new Error('Foursquare API key is missing. Please check your .env file.') };
  }

  const url = 'https://api.foursquare.com/v3/places/search';
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: '1000',
    limit: String(limit),
    categories: '13000,13065,17000,17062',
    sort: 'DISTANCE',
    fields: 'fsq_id,name,location,geocodes,website,tel,categories'
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: FOURSQUARE_API_KEY
      }
    });

    if (!response.ok) {
      return { success: false, error: new Error(`Foursquare API error: ${response.status}`) };
    }

    const data = await response.json();
    const results: Business[] = data.results || [];
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/** Clear business data */
export function clearBusinessData(): Result<null> {
  return { success: true, data: null };
}

/** Process and enrich business data for display */
export function processBusinessData(
  businesses: Business[],
  options: { limit?: number; sortBy?: string } = {}
): Result<Business[]> {
  const { limit = 4, sortBy = 'distance' } = options;
  if (!Array.isArray(businesses)) {
    return { success: false, error: new Error('Invalid business data: expected an array') };
  }

  let processed: Business[] = [...businesses];
  // Sort (if non-default requested). Foursquare default is distance.
  if (sortBy !== 'distance') {
    // Additional sorting logic placeholder.
  }

  if (processed.length > limit) processed = processed.slice(0, limit);

  processed = processed.map(b => {
    const enriched = { ...b } as Business & { location?: any };
    if (enriched.location && !enriched.location.formatted_address) {
      const { address, locality, region, postcode } = enriched.location;
      const parts = [address, locality, region, postcode].filter(Boolean);
      enriched.location.formatted_address = parts.join(', ');
    }
    return enriched;
  });

  return { success: true, data: processed };
}
