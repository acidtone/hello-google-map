import { BusinessProvider, Business } from '../types/business';

export class StaticJsonProvider implements BusinessProvider {
  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    // TODO: Load and filter businesses from src/data/businesses.json
    return [];
  }
} 