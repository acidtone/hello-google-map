# FSM Integration Guide

This document explains how to use the FSM (Finite State Machine) state constants and utilities in the Hello Maps application.

## Overview

The application now includes FSM-compatible state management that can be used for:
- Type-safe state transitions
- Centralized state management
- Future integration with state machine libraries
- Error handling with automatic state transitions

## State Constants

All application states are defined in `src/types/fsm.ts`:

```typescript
import { AppState, AppStateType } from './types/fsm';

// Available states:
AppState.INITIALIZING
AppState.CONFIG_ERROR
AppState.MAP_READY
AppState.MAP_ERROR
AppState.FETCHING_LOCATION
AppState.LOCATION_READY
AppState.LOCATION_ERROR
AppState.USE_DEFAULT_LOCATION
AppState.SEARCHING_BUSINESSES
AppState.BUSINESSES_READY
AppState.SEARCH_ERROR
AppState.PARTIAL_RESULTS
AppState.DISPLAY_COMPLETE
```

## State Manager Usage

### Basic State Management

```typescript
import { appStateManager, transitionAppState, getCurrentAppState } from './utils/stateManager';
import { AppState } from './types/fsm';

// Get current state
const currentState = getCurrentAppState();

// Transition to a new state
const success = transitionAppState(AppState.MAP_READY);

// Check if transition was successful
if (success) {
  console.log('State transition successful');
} else {
  console.log('Invalid state transition');
}
```

### State Change Subscriptions

```typescript
import { subscribeToAppState } from './utils/stateManager';

// Subscribe to state changes
const unsubscribe = subscribeToAppState((newState) => {
  console.log(`Application state changed to: ${newState}`);
  
  // Update UI based on state
  switch (newState) {
    case AppState.MAP_READY:
      // Show map controls
      break;
    case AppState.LOCATION_ERROR:
      // Show error message
      break;
    case AppState.DISPLAY_COMPLETE:
      // Show complete interface
      break;
  }
});

// Later, unsubscribe when no longer needed
unsubscribe();
```

## Error Handling Integration

The error service now includes FSM state mapping:

```typescript
import { handleError, getErrorState } from './services/errorService';
import { transitionAppState } from './utils/stateManager';

try {
  // Some operation that might fail
  await someRiskyOperation();
} catch (error) {
  const errorInfo = handleError(error, 'operation_context');
  
  // Automatically transition to error state
  const errorState = getErrorState(errorInfo.type);
  transitionAppState(errorState);
  
  // Handle recovery based on error type
  if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
    await useDefaultLocation();
  }
}
```

## State Transitions

Valid state transitions are defined in `src/types/fsm.ts`:

```typescript
import { StateTransitions, isValidTransition } from './types/fsm';

// Check if a transition is valid
const isValid = isValidTransition(AppState.MAP_READY, AppState.FETCHING_LOCATION);

// Get all valid transitions from current state
const validTransitions = StateTransitions[AppState.MAP_READY];
```

## Integration with Existing Services

### Location Service

```typescript
// In locationService.ts
import { transitionAppState } from '../utils/stateManager';
import { AppState } from '../types/fsm';

async function getCurrentLocation(): Promise<void> {
  transitionAppState(AppState.FETCHING_LOCATION);
  
  try {
    // ... location logic ...
    transitionAppState(AppState.LOCATION_READY);
  } catch (error) {
    transitionAppState(AppState.LOCATION_ERROR);
  }
}
```

### Business Service

```typescript
// In businessService.ts
import { transitionAppState } from '../utils/stateManager';
import { AppState } from '../types/fsm';

async function getNearbyBusinesses(): Promise<void> {
  transitionAppState(AppState.SEARCHING_BUSINESSES);
  
  try {
    // ... business search logic ...
    transitionAppState(AppState.BUSINESSES_READY);
  } catch (error) {
    transitionAppState(AppState.SEARCH_ERROR);
  }
}
```

## Future State Machine Library Integration

When you're ready to integrate a full state machine library:

1. **Replace the simple state manager** with your chosen library
2. **Keep the same state constants** - they're already well-defined
3. **Update transition functions** to use the library's API
4. **Maintain the same state flow** - the transitions are already documented

### Example with XState (future)

```typescript
import { createMachine, interpret } from 'xstate';
import { AppState, StateTransitions } from './types/fsm';

const appMachine = createMachine({
  id: 'helloMaps',
  initial: AppState.INITIALIZING,
  states: {
    [AppState.INITIALIZING]: {
      on: {
        CONFIG_ERROR: AppState.CONFIG_ERROR,
        MAP_READY: AppState.MAP_READY
      }
    },
    [AppState.MAP_READY]: {
      on: {
        MAP_ERROR: AppState.MAP_ERROR,
        FETCHING_LOCATION: AppState.FETCHING_LOCATION
      }
    },
    // ... other states
  }
});
```

## Benefits

1. **Type Safety**: All states and transitions are type-checked
2. **Documentation**: State flow is clearly defined
3. **Error Prevention**: Invalid transitions are caught at runtime
4. **Future-Proof**: Ready for full state machine library integration
5. **Consistency**: Centralized state management across the application

## Migration Path

The current implementation allows for gradual migration:

1. **Phase 1**: Use state constants for documentation (current)
2. **Phase 2**: Integrate state manager in key functions
3. **Phase 3**: Replace with full state machine library when needed

This approach ensures you can start using FSM patterns immediately while keeping the door open for more sophisticated state management in the future. 