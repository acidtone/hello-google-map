/**
 * Error Service Module
 * Handles error categorization, logging, user notification, and recovery strategies
 */

// Basic error categories - we can expand these as needed
const ErrorTypes = {
  LOCATION_PERMISSION: 'location_permission_denied',
  LOCATION_UNAVAILABLE: 'location_unavailable',
  GEOCODING_FAILED: 'geocoding_failed',
  UNKNOWN: 'unknown_error'
};

// Recovery actions that could become transitions in a future FSM
const RecoveryActions = {
  USE_DEFAULT_LOCATION: 'use_default_location',
  RETRY: 'retry_operation',
  SHOW_FORM: 'show_manual_entry',
  NONE: 'no_action'
};

/**
 * Categorize an error based on its properties
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {string} - The categorized error type
 */
function categorizeError(error, context) {
  if (context === 'geolocation' && error.code === 1) {
    return ErrorTypes.LOCATION_PERMISSION;
  } else if (context === 'geolocation' && (error.code === 2 || error.code === 3)) {
    return ErrorTypes.LOCATION_UNAVAILABLE;
  } else if (context === 'geocoding') {
    return ErrorTypes.GEOCODING_FAILED;
  }
  return ErrorTypes.UNKNOWN;
}

/**
 * Log error details for debugging
 * @param {Error} error - The error object
 * @param {string} errorType - Categorized error type
 * @param {string} context - Context where the error occurred
 */
function logError(error, errorType, context) {
  console.error(`[${context}] Error (${errorType}):`, error);
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
    default:
      return RecoveryActions.NONE;
  }
}

/**
 * Display an error message to the user
 * @param {string} errorType - Categorized error type
 * @param {HTMLElement} container - Container element for the error message
 */
function showErrorMessage(errorType, container) {
  const messages = {
    [ErrorTypes.LOCATION_PERMISSION]: 'Location access was denied. Using default location instead.',
    [ErrorTypes.LOCATION_UNAVAILABLE]: 'Could not determine your location. Using default location instead.',
    [ErrorTypes.GEOCODING_FAILED]: 'Could not find the specified location. Please try a different search.',
    [ErrorTypes.UNKNOWN]: 'An error occurred. Please try again.'
  };
  
  if (container) {
    container.textContent = messages[errorType] || messages[ErrorTypes.UNKNOWN];
    container.classList.add('error-message');
  }
}

/**
 * Main error handler function
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {HTMLElement} container - Container for error messages (optional)
 * @returns {string} - Recovery action to take
 */
function handleError(error, context, container = null) {
  const errorType = categorizeError(error, context);
  logError(error, errorType, context);
  
  if (container) {
    showErrorMessage(errorType, container);
  }
  
  return getRecoveryAction(errorType);
}

// Export public functions
export {
  ErrorTypes,
  RecoveryActions,
  handleError,
  showErrorMessage
};
