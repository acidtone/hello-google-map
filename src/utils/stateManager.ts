/**
 * Simple state manager utility for the Hello Maps application
 * Provides state management without requiring a framework
 */

import { 
  AppState, 
  AppStateType, 
  StateTransitions, 
  isValidTransition, 
  transitionTo as validateTransition 
} from '../types/fsm';

/**
 * State manager class for handling application state transitions
 */
export class StateManager {
  private currentState: AppStateType = AppState.INITIALIZING;
  private stateChangeCallbacks: Array<(state: AppStateType) => void> = [];

  /**
   * Get the current application state
   */
  getCurrentState(): AppStateType {
    return this.currentState;
  }

  /**
   * Transition to a new state with validation
   * @param newState - The new state to transition to
   * @returns true if transition was successful, false if invalid
   */
  transitionTo(newState: AppStateType): boolean {
    if (!isValidTransition(this.currentState, newState)) {
      console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;
    
    // Notify all callbacks of state change
    this.stateChangeCallbacks.forEach(callback => callback(this.currentState));
    
    console.log(`State transition: ${previousState} -> ${newState}`);
    return true;
  }

  /**
   * Subscribe to state changes
   * @param callback - Function to call when state changes
   * @returns Function to unsubscribe
   */
  subscribe(callback: (state: AppStateType) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get all valid transitions from the current state
   */
  getValidTransitions(): AppStateType[] {
    return [...StateTransitions[this.currentState]];
  }

  /**
   * Check if the current state is a terminal state
   */
  isTerminalState(): boolean {
    return StateTransitions[this.currentState].length === 0;
  }

  /**
   * Reset the state manager to initial state
   */
  reset(): void {
    this.currentState = AppState.INITIALIZING;
    this.stateChangeCallbacks.forEach(callback => callback(this.currentState));
  }
}

/**
 * Global state manager instance
 * Can be imported and used throughout the application
 */
export const appStateManager = new StateManager();

/**
 * Utility function to get current state
 */
export const getCurrentAppState = (): AppStateType => appStateManager.getCurrentState();

/**
 * Utility function to transition state
 */
export const transitionAppState = (newState: AppStateType): boolean => 
  appStateManager.transitionTo(newState);

/**
 * Utility function to subscribe to state changes
 */
export const subscribeToAppState = (callback: (state: AppStateType) => void): (() => void) => 
  appStateManager.subscribe(callback); 