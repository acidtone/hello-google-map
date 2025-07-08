import { BusinessProvider, Business } from '../types/business';
import { FOURSQUARE_API_KEY } from '../config';

export class FoursquareProvider implements BusinessProvider {
  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    const url = 'https://api.foursquare.com/v3/places/search';
    const params = new URLSearchParams({
      ll: `${latitude},${longitude}`,
      radius: '1000',
      limit: limit.toString(),
      categories: '13000,13065,17000,17062',
      sort: 'DISTANCE',
      fields: 'fsq_id,name,location,geocodes,website,tel,categories,rating,price,hours,description,photos,distance'
    });
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': FOURSQUARE_API_KEY
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map((place: any) => ({
      id: place.fsq_id,
      name: place.name,
      location: {
        address: place.location.address,
        crossStreet: place.location.cross_street,
        city: place.location.locality,
        state: place.location.admin_region,
        postalCode: place.location.postcode,
        country: place.location.country,
        coordinates: {
          lat: place.location.geocodes?.main?.latitude || 0,
          lng: place.location.geocodes?.main?.longitude || 0
        },
        formattedAddress: place.location.formatted_address ? [place.location.formatted_address] : undefined
      },
      categories: place.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon
      })),
      website: place.website,
      tel: place.tel,
      rating: place.rating,
      distance: place.distance,
      description: place.description,
      hours: place.hours ? {
        status: place.hours.status,
        isOpen: place.hours.is_open
      } : undefined,
      photos: place.photos?.map((photo: any) => ({
        id: photo.id,
        prefix: photo.prefix,
        suffix: photo.suffix
      }))
    }));
  }
} 