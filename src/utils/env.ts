/**
 * Environment validation utilities
 * Provides type-safe environment variable access and validation
 */

/**
 * Validates that required environment variables are present
 * @throws {Error} - If any required environment variables are missing
 * @returns true if all required variables are present
 */
export const validateEnvironment = (): boolean => {
  const required = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_FOURSQUARE_API_KEY'
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Get environment variable with type safety
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if the key is not set
 * @returns The environment variable value or default
 */
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value || defaultValue || '';
};

/**
 * Check if an environment variable is set
 * @param key - The environment variable key
 * @returns true if the variable is set and not empty
 */
export const hasEnvVar = (key: string): boolean => {
  const value = import.meta.env[key];
  return value !== undefined && value !== '';
};

/**
 * Get all environment variables for debugging
 * @returns Object with all environment variables (excluding sensitive data)
 */
export const getEnvironmentInfo = (): Record<string, string> => {
  const env = import.meta.env;
  
  return {
    NODE_ENV: env.NODE_ENV || 'unknown',
    MODE: env.MODE || 'unknown',
    BASE_URL: env.BASE_URL || '',
    DEV: env.DEV ? 'true' : 'false',
    PROD: env.PROD ? 'true' : 'false',
    SSR: env.SSR ? 'true' : 'false',
    // Note: We don't include API keys in debug info for security
    HAS_GOOGLE_MAPS_KEY: hasEnvVar('VITE_GOOGLE_MAPS_API_KEY') ? 'true' : 'false',
    HAS_FOURSQUARE_KEY: hasEnvVar('VITE_FOURSQUARE_API_KEY') ? 'true' : 'false'
  };
}; 