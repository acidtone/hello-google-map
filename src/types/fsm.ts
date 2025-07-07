/**
 * FSM State definitions for the Hello Maps application
 * Provides type-safe state management and transition validation
 */

/**
 * Application states following the documented flow in README.md
 */
export const AppState = {
  // Initialization states
  INITIALIZING: 'initializing',
  CONFIG_ERROR: 'config_error',
  MAP_READY: 'map_ready',
  MAP_ERROR: 'map_error',
  
  // Location states
  FETCHING_LOCATION: 'fetching_location',
  LOCATION_READY: 'location_ready',
  LOCATION_ERROR: 'location_error',
  USE_DEFAULT_LOCATION: 'use_default_location',
  
  // Business states
  SEARCHING_BUSINESSES: 'searching_businesses',
  BUSINESSES_READY: 'businesses_ready',
  SEARCH_ERROR: 'search_error',
  PARTIAL_RESULTS: 'partial_results',
  
  // Final state
  DISPLAY_COMPLETE: 'display_complete'
} as const;

/**
 * Type for application state values
 */
export type AppStateType = typeof AppState[keyof typeof AppState];

/**
 * Valid state transitions for each state
 * Maps each state to an array of valid next states
 */
export const StateTransitions: Record<AppStateType, readonly AppStateType[]> = {
  [AppState.INITIALIZING]: [AppState.CONFIG_ERROR, AppState.MAP_READY],
  [AppState.MAP_READY]: [AppState.MAP_ERROR, AppState.FETCHING_LOCATION],
  [AppState.FETCHING_LOCATION]: [AppState.LOCATION_ERROR, AppState.LOCATION_READY, AppState.USE_DEFAULT_LOCATION],
  [AppState.LOCATION_READY]: [AppState.SEARCHING_BUSINESSES],
  [AppState.SEARCHING_BUSINESSES]: [AppState.SEARCH_ERROR, AppState.BUSINESSES_READY, AppState.PARTIAL_RESULTS],
  [AppState.BUSINESSES_READY]: [AppState.DISPLAY_COMPLETE],
  [AppState.PARTIAL_RESULTS]: [AppState.DISPLAY_COMPLETE],
  [AppState.USE_DEFAULT_LOCATION]: [AppState.SEARCHING_BUSINESSES],
  [AppState.CONFIG_ERROR]: [], // Terminal state
  [AppState.MAP_ERROR]: [], // Terminal state
  [AppState.LOCATION_ERROR]: [AppState.USE_DEFAULT_LOCATION],
  [AppState.SEARCH_ERROR]: [AppState.DISPLAY_COMPLETE],
  [AppState.DISPLAY_COMPLETE]: [] // Terminal state
} as const;

/**
 * State transition validation function
 * @param currentState - The current application state
 * @param newState - The proposed new state
 * @returns true if the transition is valid, false otherwise
 */
export const isValidTransition = (currentState: AppStateType, newState: AppStateType): boolean => {
  const validTransitions = StateTransitions[currentState];
  return validTransitions.includes(newState);
};

/**
 * State transition function with validation
 * @param currentState - The current application state
 * @param newState - The proposed new state
 * @returns The new state if transition is valid, throws error if invalid
 */
export const transitionTo = (currentState: AppStateType, newState: AppStateType): AppStateType => {
  if (!isValidTransition(currentState, newState)) {
    throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
  }
  return newState;
};

/**
 * Check if a state is a terminal state (no valid transitions)
 * @param state - The state to check
 * @returns true if the state is terminal
 */
export const isTerminalState = (state: AppStateType): boolean => {
  return StateTransitions[state].length === 0;
};

/**
 * Get all valid transitions for a given state
 * @param state - The current state
 * @returns Array of valid next states
 */
export const getValidTransitions = (state: AppStateType): AppStateType[] => {
  return [...StateTransitions[state]];
}; 