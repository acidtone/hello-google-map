import { BusinessProvider, Business } from '../types/business';

const dummyBusinesses: Business[] = [
  {
    id: 'dummy-1',
    name: 'Dummy Coffee Shop',
    location: {
      address: '123 Brew St',
      city: 'Testville',
      state: 'TS',
      postalCode: '12345',
      country: 'Testland',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      formattedAddress: ['123 Brew St, Testville, TS 12345']
    },
    website: 'https://dummy1.example.com',
    categories: [{ id: '1', name: 'Cafe' }],
    distance: 100
  },
  {
    id: 'dummy-2',
    name: 'Fake Bookstore',
    location: {
      address: '456 Read Ave',
      city: 'Testville',
      state: 'TS',
      postalCode: '12345',
      country: 'Testland',
      coordinates: { lat: 39.7395, lng: -104.9910 },
      formattedAddress: ['456 Read Ave, Testville, TS 12345']
    },
    website: 'https://dummy2.example.com',
    categories: [{ id: '2', name: 'Bookstore' }],
    distance: 200
  },
  {
    id: 'dummy-3',
    name: 'Sample Diner',
    location: {
      address: '789 Dine Rd',
      city: 'Testville',
      state: 'TS',
      postalCode: '12345',
      country: 'Testland',
      coordinates: { lat: 39.7400, lng: -104.9920 },
      formattedAddress: ['789 Dine Rd, Testville, TS 12345']
    },
    website: 'https://dummy3.example.com',
    categories: [{ id: '3', name: 'Diner' }],
    distance: 300
  },
  {
    id: 'dummy-4',
    name: 'Mock Florist',
    location: {
      address: '321 Bloom Blvd',
      city: 'Testville',
      state: 'TS',
      postalCode: '12345',
      country: 'Testland',
      coordinates: { lat: 39.7410, lng: -104.9930 },
      formattedAddress: ['321 Bloom Blvd, Testville, TS 12345']
    },
    website: 'https://dummy4.example.com',
    categories: [{ id: '4', name: 'Florist' }],
    distance: 400
  }
];

export class DummyProvider implements BusinessProvider {
  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    // Helper to generate a small random offset
    const randomOffset = () => (Math.random() - 0.5) * 0.004; // ~±0.002 degrees

    // Map dummy businesses to new coordinates
    return dummyBusinesses.slice(0, limit).map((biz) => ({
      ...biz,
      location: {
        ...biz.location,
        coordinates: {
          lat: latitude + randomOffset(),
          lng: longitude + randomOffset(),
        }
      }
    }));
  }
} 