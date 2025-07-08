import { BusinessProvider, Business } from '../types/business';

export class CompositeProvider implements BusinessProvider {
  private providers: BusinessProvider[];

  constructor(providers: BusinessProvider[]) {
    this.providers = providers;
  }

  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    const results = await Promise.all(
      this.providers.map(p => p.getNearbyBusinesses(latitude, longitude, limit))
    );
    // Flatten the array of arrays
    return results.flat();
  }
} 