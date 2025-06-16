/**
 * Error-related type definitions
 */

/**
 * Represents error categories in the application
 */
export const ErrorCategory = {
  GEOLOCATION: 'geolocation',
  GEOCODING: 'geocoding',
  API: 'api',
  MAPS_API: 'maps_api',
  BUSINESS_API: 'business_api',
  CONFIG_VALIDATION: 'config_validation',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

/**
 * Represents recovery actions that can be taken after an error
 */
export const RecoveryAction = {
  USE_DEFAULT_LOCATION: 'use_default_location',
  RETRY: 'retry',
  SHOW_FORM: 'show_form',
  RELOAD_PAGE: 'reload_page',
  NONE: 'none'
} as const;

export type RecoveryAction = typeof RecoveryAction[keyof typeof RecoveryAction];

/**
 * Represents error information with recovery options
 */
export type ErrorInfo = {
  message: string;
  category: ErrorCategory;
  recovery: RecoveryAction;
  originalError?: Error;
  details?: unknown;
};
