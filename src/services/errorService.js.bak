/**
 * Error Service Module
 * Lightweight error handling with FSM-like patterns
 */

// Error types - can be expanded as needed
const ErrorTypes = {
  LOCATION_PERMISSION: 'location_permission_denied',
  LOCATION_UNAVAILABLE: 'location_unavailable',
  GEOCODING_FAILED: 'geocoding_failed',
  POSTAL_CODE_FAILED: 'postal_code_failed',
  BUSINESS_SEARCH_FAILED: 'business_search_failed',
  MAPS_API_FAILED: 'maps_api_failed',
  GOOGLE_API_KEY_MISSING: 'google_api_key_missing',
  FOURSQUARE_API_KEY_MISSING: 'foursquare_api_key_missing',
  UNKNOWN: 'unknown_error'
};

// Recovery actions (potential state transitions in FSM)
const RecoveryActions = {
  USE_DEFAULT_LOCATION: 'use_default_location',
  SHOW_FORM: 'show_manual_entry',
  CONTINUE_PARTIAL: 'continue_with_partial_data',
  NONE: 'no_action'
};

/**
 * Categorize an error based on its properties and context
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {string} - The categorized error type
 */
function categorizeError(error, context) {
  // Geolocation errors
  if (context === 'geolocation') {
    if (error.code === 1) return ErrorTypes.LOCATION_PERMISSION;
    if (error.code === 2 || error.code === 3) return ErrorTypes.LOCATION_UNAVAILABLE;
  }
  
  // API errors
  if (context === 'geocoding') return ErrorTypes.GEOCODING_FAILED;
  if (context === 'postal_code') return ErrorTypes.POSTAL_CODE_FAILED;
  if (context === 'business_search') return ErrorTypes.BUSINESS_SEARCH_FAILED;
  if (context === 'maps_api') return ErrorTypes.MAPS_API_FAILED;
  if (context === 'map_display') return ErrorTypes.UNKNOWN;
  
  // Configuration errors
  if (context === 'config_validation') {
    if (error.message?.includes('Google Maps API key')) return ErrorTypes.GOOGLE_API_KEY_MISSING;
    if (error.message?.includes('Foursquare API key')) return ErrorTypes.FOURSQUARE_API_KEY_MISSING;
  }
  
  return ErrorTypes.UNKNOWN;
}

/**
 * Get appropriate message for an error type
 * @param {string} errorType - Categorized error type
 * @returns {string} - User-friendly error message
 */
function getErrorMessage(errorType) {
  const messages = {
    [ErrorTypes.LOCATION_PERMISSION]: 'Location access denied. Using default location.',
    [ErrorTypes.LOCATION_UNAVAILABLE]: 'Could not determine your location. Using default location.',
    [ErrorTypes.GEOCODING_FAILED]: 'Could not find that location. Please try again.',
    [ErrorTypes.POSTAL_CODE_FAILED]: 'Showing location without postal code data.',
    [ErrorTypes.BUSINESS_SEARCH_FAILED]: 'Showing location without nearby businesses.',
    [ErrorTypes.MAPS_API_FAILED]: 'Maps service is currently unavailable. Please try again later.',
    [ErrorTypes.GOOGLE_API_KEY_MISSING]: 'Maps configuration error. Please check application settings.',
    [ErrorTypes.FOURSQUARE_API_KEY_MISSING]: 'Business search unavailable. Please check application settings.',
    [ErrorTypes.UNKNOWN]: 'An error occurred. Please try again.'
  };
  
  return messages[errorType] || messages[ErrorTypes.UNKNOWN];
}

/**
 * Determine appropriate recovery action for an error
 * @param {string} errorType - Categorized error type
 * @returns {string} - Recovery action to take
 */
function getRecoveryAction(errorType) {
  switch (errorType) {
    case ErrorTypes.LOCATION_PERMISSION:
    case ErrorTypes.LOCATION_UNAVAILABLE:
      return RecoveryActions.USE_DEFAULT_LOCATION;
    case ErrorTypes.GEOCODING_FAILED:
      return RecoveryActions.SHOW_FORM;
    case ErrorTypes.POSTAL_CODE_FAILED:
    case ErrorTypes.BUSINESS_SEARCH_FAILED:
      return RecoveryActions.CONTINUE_PARTIAL;
    case ErrorTypes.MAPS_API_FAILED:
    case ErrorTypes.GOOGLE_API_KEY_MISSING:
      return RecoveryActions.NONE; // No automatic recovery for critical API failures
    case ErrorTypes.FOURSQUARE_API_KEY_MISSING:
      return RecoveryActions.CONTINUE_PARTIAL; // Can still show map without businesses
    default:
      return RecoveryActions.NONE;
  }
}

/**
 * Main error handler function - FSM-friendly
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} - Error information with type, message, and recovery action
 */
function handleError(error, context) {
  const errorType = categorizeError(error, context);
  const message = getErrorMessage(errorType);
  const recovery = getRecoveryAction(errorType);
  
  // Log for debugging
  console.error(`[${context}] ${message}`, error);
  
  // Return structured error info for FSM-like handling
  return { type: errorType, message, recovery };
}

// Export public functions and constants
export {
  ErrorTypes,
  RecoveryActions,
  handleError
};
