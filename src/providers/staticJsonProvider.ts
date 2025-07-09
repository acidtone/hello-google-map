import { BusinessProvider, Business } from '../types/business';

// Type for the JSON data structure
type StaticBusinessData = {
  id: string;
  website: string;
};

export class StaticJsonProvider implements BusinessProvider {
  private staticData: StaticBusinessData[] = [];

  constructor() {
    this.loadStaticData();
  }

  private async loadStaticData(): Promise<void> {
    try {
      const response = await fetch('/src/data/businesses.json');
      if (response.ok) {
        this.staticData = await response.json();
      } else {
        console.warn('Failed to load static business data');
        this.staticData = [];
      }
    } catch (error) {
      console.warn('Error loading static business data:', error);
      this.staticData = [];
    }
  }

  async getNearbyBusinesses(latitude: number, longitude: number, limit: number = 4): Promise<Business[]> {
    // This provider doesn't return businesses directly
    // It's used by the composite provider for website URL overrides
    return [];
  }

  /**
   * Get website URL override for a business by ID
   * @param businessId - The business ID to look up
   * @returns The website URL if found, null otherwise
   */
  getWebsiteOverride(businessId: string): string | null {
    const match = this.staticData.find(item => item.id === businessId);
    return match ? match.website : null;
  }

  /**
   * Get all static business data for merging
   * @returns Array of static business data
   */
  getAllStaticData(): StaticBusinessData[] {
    return [...this.staticData];
  }
} 