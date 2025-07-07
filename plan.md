# Project Cleanup & Optimization Plan

This plan outlines the steps to clean up, optimize, and prepare the Hello Maps project for transfer and future FSM integration.

---

## Phase 1: Immediate Cleanup

**1. Remove Legacy Files**
```bash
# Remove all .js.bak files
rm src/*.js.bak
rm src/services/*.js.bak
rm src/actions/*.js.bak

# Remove system files
find . -name ".DS_Store" -delete
```

**2. Update .gitignore**
Add these entries:
```gitignore
# System files
.DS_Store
Thumbs.db

# Legacy files
*.js.bak
*.bak

# Environment files
.env.local
.env.*.local

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
```

**3. Fix TypeScript Issues**
Replace `as any` usage in `src/services/errorService.ts` with:
```typescript
const hasErrorCode = (err: unknown): err is { code: number } =>
  typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'number';

const hasErrorMessage = (err: unknown): err is { message: string } =>
  typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string';
```

---

## Phase 2: FSM Preparation

**1. Create FSM State Constants**

Create `src/types/fsm.ts`:
```typescript
export const AppState = {
  INITIALIZING: 'initializing',
  CONFIG_ERROR: 'config_error',
  MAP_READY: 'map_ready',
  MAP_ERROR: 'map_error',
  FETCHING_LOCATION: 'fetching_location',
  LOCATION_READY: 'location_ready',
  LOCATION_ERROR: 'location_error',
  USE_DEFAULT_LOCATION: 'use_default_location',
  SEARCHING_BUSINESSES: 'searching_businesses',
  BUSINESSES_READY: 'businesses_ready',
  SEARCH_ERROR: 'search_error',
  PARTIAL_RESULTS: 'partial_results',
  DISPLAY_COMPLETE: 'display_complete'
} as const;

export type AppStateType = typeof AppState[keyof typeof AppState];

export const StateTransitions: Record<AppStateType, readonly AppStateType[]> = {
  [AppState.INITIALIZING]: [AppState.CONFIG_ERROR, AppState.MAP_READY],
  [AppState.MAP_READY]: [AppState.MAP_ERROR, AppState.FETCHING_LOCATION],
  [AppState.FETCHING_LOCATION]: [AppState.LOCATION_ERROR, AppState.LOCATION_READY, AppState.USE_DEFAULT_LOCATION],
  [AppState.LOCATION_READY]: [AppState.SEARCHING_BUSINESSES],
  [AppState.SEARCHING_BUSINESSES]: [AppState.SEARCH_ERROR, AppState.BUSINESSES_READY, AppState.PARTIAL_RESULTS],
  [AppState.BUSINESSES_READY]: [AppState.DISPLAY_COMPLETE],
  [AppState.PARTIAL_RESULTS]: [AppState.DISPLAY_COMPLETE],
  [AppState.USE_DEFAULT_LOCATION]: [AppState.SEARCHING_BUSINESSES],
  [AppState.CONFIG_ERROR]: [],
  [AppState.MAP_ERROR]: [],
  [AppState.LOCATION_ERROR]: [AppState.USE_DEFAULT_LOCATION],
  [AppState.SEARCH_ERROR]: [AppState.DISPLAY_COMPLETE],
  [AppState.DISPLAY_COMPLETE]: []
} as const;

export const isValidTransition = (currentState: AppStateType, newState: AppStateType): boolean => {
  const validTransitions = StateTransitions[currentState];
  return validTransitions.includes(newState);
};
```

**2. Add Simple State Manager (Temporary)**

Create `src/utils/stateManager.ts`:
```typescript
import { AppState, AppStateType, StateTransitions, isValidTransition } from '../types/fsm';

export class StateManager {
  private currentState: AppStateType = AppState.INITIALIZING;
  private stateChangeCallbacks: Array<(state: AppStateType) => void> = [];

  getCurrentState(): AppStateType {
    return this.currentState;
  }

  transitionTo(newState: AppStateType): boolean {
    if (!isValidTransition(this.currentState, newState)) {
      console.warn(`Invalid state transition: ${this.currentState} -> ${newState}`);
      return false;
    }
    const previousState = this.currentState;
    this.currentState = newState;
    this.stateChangeCallbacks.forEach(callback => callback(this.currentState));
    console.log(`State transition: ${previousState} -> ${newState}`);
    return true;
  }

  subscribe(callback: (state: AppStateType) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  getValidTransitions(): AppStateType[] {
    return [...StateTransitions[this.currentState]];
  }

  isTerminalState(): boolean {
    return StateTransitions[this.currentState].length === 0;
  }

  reset(): void {
    this.currentState = AppState.INITIALIZING;
    this.stateChangeCallbacks.forEach(callback => callback(this.currentState));
  }
}

export const appStateManager = new StateManager();
export const getCurrentAppState = (): AppStateType => appStateManager.getCurrentState();
export const transitionAppState = (newState: AppStateType): boolean => appStateManager.transitionTo(newState);
export const subscribeToAppState = (callback: (state: AppStateType) => void): (() => void) => appStateManager.subscribe(callback);
```

> **Note:** This state manager is a temporary, minimal solution. It will be replaced by a real FSM library (like Robot3) in the future. The main value is in the state constants, transitions, and error mapping, which are all reusable.

---

## Phase 3: Performance Optimizations

**1. Bundle Analysis**

Install the analyzer:
```bash
npm install --save-dev vite-bundle-analyzer
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import { visualizer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**2. Add Environment Validation**

Create `src/utils/env.ts`:
```typescript
export const validateEnvironment = () => {
  const required = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_FOURSQUARE_API_KEY'
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

---

## Phase 4: Documentation Updates

**1. Add API Documentation**

Create `docs/api.md`:
```markdown
# API Documentation

## Google Maps API
- **Key Features**: Autocomplete, Geocoding, Markers
- **Documentation**: [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- **Rate Limits**: [Quotas and Pricing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)

## Foursquare API
- **Key Features**: Nearby business search
- **Documentation**: [Foursquare Places API](https://developer.foursquare.com/docs/places-api)
- **Rate Limits**: [Foursquare API Limits](https://developer.foursquare.com/docs/api/limits)

## Error Handling
- **FSM-Compatible**: All errors follow state machine patterns
- **Recovery Actions**: Automatic recovery based on error type
- **User Feedback**: Clear, actionable error messages
```

**2. Add Development Guide**

Create `DEVELOPMENT.md`:
```markdown
# Development Guide

## Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add API keys
4. Start development: `npm run dev`

## Common Tasks
- **Adding map features**: See `src/services/mapService.ts`
- **Modifying business search**: See `src/services/businessService.ts`
- **Error handling**: See `src/services/errorService.ts`
- **State management**: See FSM patterns in `src/types/fsm.ts`
```

---

## FSM Library Migration (Robot3, XState, etc.)

When you are ready to move to a real FSM library, here’s what happens:

### What’s Reusable
- **State constants/types**: 100% reusable for your FSM config
- **Transition map**: Directly informs your FSM statechart
- **Error-state mapping**: Still useful for error handling

### What’s Replaced
- **Custom StateManager**: Replaced by the FSM library’s machine instance and API
- **Custom subscriptions**: Use the FSM library’s observer/subscription system

### Migration Steps
1. Replace the custom `StateManager` with the FSM library’s machine instance
2. Use your existing `AppState` constants and `StateTransitions` to define the FSM config
3. Update your code to use the FSM library’s API for transitions and subscriptions
4. Remove the custom state manager code

### Example Migration (Robot3)
```typescript
import { createMachine, state, transition } from 'robot3';
import { AppState } from './types/fsm';

const machine = createMachine({
  [AppState.INITIALIZING]: state(
    transition('CONFIG_ERROR', AppState.CONFIG_ERROR),
    transition('MAP_READY', AppState.MAP_READY)
  ),
  // ...other states
});
```

### Summary Table
| Component                | Reusable with Robot3? | Notes                                 |
|--------------------------|:--------------------:|---------------------------------------|
| State constants/types    | ✅                   | Use as-is                             |
| Transition map           | ✅                   | Use as reference for FSM config       |
| Error-state mapping      | ✅                   | Use as-is                             |
| Custom StateManager      | ❌                   | Replaced by Robot3’s machine instance |
| Custom subscriptions     | ❌                   | Use Robot3’s observer API             |

---

## Final Checklist Before Work Laptop Transfer

- [x] Remove all `.js.bak` files
- [x] Remove `.DS_Store` files
- [x] Fix TypeScript `as any` usage
- [x] Update `.gitignore`
- [x] Add FSM state constants and transitions
- [x] Add bundle analyzer
- [x] Add environment validation
- [x] Update documentation (`README.md`, `docs/api.md`, `DEVELOPMENT.md`)

---

This plan ensures your project is clean, maintainable, and ready for FSM integration—whether you use the simple state manager now or migrate to a full-featured FSM library later. 