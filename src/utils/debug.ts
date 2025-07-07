/**
 * Debug utilities for development
 * Provides helpful debugging information without exposing sensitive data
 */

import { getEnvironmentInfo, validateEnvironment } from './env';

/**
 * Log environment information for debugging
 * Only logs non-sensitive information
 */
export const logEnvironmentInfo = (): void => {
  if (import.meta.env.DEV) {
    const envInfo = getEnvironmentInfo();
    
    console.group('🌍 Environment Information');
    console.log('Mode:', envInfo.MODE);
    console.log('Node Environment:', envInfo.NODE_ENV);
    console.log('Base URL:', envInfo.BASE_URL);
    console.log('Development:', envInfo.DEV);
    console.log('Production:', envInfo.PROD);
    console.log('SSR:', envInfo.SSR);
    console.log('Has Google Maps Key:', envInfo.HAS_GOOGLE_MAPS_KEY);
    console.log('Has Foursquare Key:', envInfo.HAS_FOURSQUARE_KEY);
    console.groupEnd();
  }
};

/**
 * Validate environment and log helpful information
 * @throws {Error} - If environment validation fails
 */
export const validateAndLogEnvironment = (): void => {
  try {
    // This will throw if required env vars are missing
    validateEnvironment();
    
    console.log('✅ Environment validation passed');
    logEnvironmentInfo();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    console.log('💡 Make sure you have a .env file with the required API keys');
    throw error;
  }
}; 