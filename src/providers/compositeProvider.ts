import { BusinessProvider, Business } from '../types/business';
import { StaticJsonProvider } from './staticJsonProvider';

export class CompositeProvider implements BusinessProvider {
  private providers: BusinessProvider[];
  private staticJsonProvider: StaticJsonProvider;

  constructor(providers: BusinessProvider[]) {
    this.providers = providers;
    this.staticJsonProvider = new StaticJsonProvider();
  }

  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    // Get businesses from the first provider (typically the API provider)
    const apiProvider = this.providers[0];
    if (!apiProvider) {
      console.error('No API provider available in composite provider');
      return [];
    }
    
    const businesses = await apiProvider.getNearbyBusinesses(latitude, longitude, limit);
    
    // Merge with static JSON data for website URL overrides
    return businesses.map(business => {
      const websiteOverride = this.staticJsonProvider.getWebsiteOverride(business.id);
      
      if (websiteOverride) {
        console.log(`Overriding website for ${business.name} (${business.id}): ${business.website} -> ${websiteOverride}`);
        return {
          ...business,
          website: websiteOverride
        };
      } else {
        // Keep original website URL as fallback
        console.log(`No website override found for ${business.name} (${business.id}), keeping: ${business.website}`);
        return business;
      }
    });
  }
} 