/**
 * Error Service Module
 * Lightweight error handling with FSM-like patterns
 */

// Error types - can be expanded as needed
export enum ErrorTypes {
  LOCATION_PERMISSION = 'location_permission_denied',
  LOCATION_UNAVAILABLE = 'location_unavailable',
  GEOCODING_FAILED = 'geocoding_failed',
  POSTAL_CODE_FAILED = 'postal_code_failed',
  BUSINESS_SEARCH_FAILED = 'business_search_failed',
  MAPS_API_FAILED = 'maps_api_failed',
  GOOGLE_API_KEY_MISSING = 'google_api_key_missing',
  FOURSQUARE_API_KEY_MISSING = 'foursquare_api_key_missing',
  UNKNOWN = 'unknown_error'
}

// Recovery actions (potential state transitions in FSM)
export enum RecoveryActions {
  USE_DEFAULT_LOCATION = 'use_default_location',
  SHOW_FORM = 'show_manual_entry',
  CONTINUE_PARTIAL = 'continue_with_partial_data',
  NONE = 'no_action'
}

export interface ErrorInfo {
  type: ErrorTypes;
  message: string;
  recovery: RecoveryActions;
  originalError?: Error;
}

/**
 * Categorize an error based on its properties and context
 * @param error - The error object
 * @param context - Context where the error occurred
 * @returns Error information with type and recovery action
 */
export function handleError(error: Error, context?: string): ErrorInfo {
  // Default error info
  const errorInfo: ErrorInfo = {
    type: ErrorTypes.UNKNOWN,
    message: error.message || 'An unknown error occurred',
    recovery: RecoveryActions.NONE,
    originalError: error
  };

  // Determine error type based on message and context
  if (error.message.includes('permission') || error.message.includes('denied')) {
    errorInfo.type = ErrorTypes.LOCATION_PERMISSION;
    errorInfo.recovery = RecoveryActions.SHOW_FORM;
    errorInfo.message = 'Location permission denied. Please enter your location manually.';
  } else if (error.message.includes('unavailable') || error.message.includes('timeout')) {
    errorInfo.type = ErrorTypes.LOCATION_UNAVAILABLE;
    errorInfo.recovery = RecoveryActions.USE_DEFAULT_LOCATION;
    errorInfo.message = 'Unable to determine your location. Using default location.';
  } else if (context === 'geocoding') {
    errorInfo.type = ErrorTypes.GEOCODING_FAILED;
    errorInfo.recovery = RecoveryActions.SHOW_FORM;
    errorInfo.message = 'Could not find that location. Please try a different search.';
  } else if (context === 'postal_code') {
    errorInfo.type = ErrorTypes.POSTAL_CODE_FAILED;
    errorInfo.recovery = RecoveryActions.SHOW_FORM;
    errorInfo.message = 'Invalid postal code. Please try again.';
  } else if (context === 'business_search') {
    errorInfo.type = ErrorTypes.BUSINESS_SEARCH_FAILED;
    errorInfo.recovery = RecoveryActions.CONTINUE_PARTIAL;
    errorInfo.message = 'Could not find businesses in this area.';
  } else if (context === 'maps_api') {
    errorInfo.type = ErrorTypes.MAPS_API_FAILED;
    errorInfo.recovery = RecoveryActions.NONE;
    errorInfo.message = 'Maps API failed to load. Please check your connection.';
  }

  return errorInfo;
}

/**
 * Log an error with additional context
 * @param error - The error object or message
 * @param context - Additional context information
 */
export function logError(error: Error | string, context?: string): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorObject = typeof error === 'string' ? new Error(error) : error;
  
  console.error(`[${context || 'ERROR'}]`, errorMessage, errorObject);
}

/**
 * Display an error message in the UI
 * @param message - Error message to display
 * @param elementId - ID of element to display error in
 */
export function displayError(message: string, elementId?: string): void {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<div class="error-message">${message}</div>`;
      element.classList.add('has-error');
    }
  }
  
  // Always log to console as well
  console.error(message);
}
