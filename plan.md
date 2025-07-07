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

export const StateTransitions = {
  [AppState.INITIALIZING]: [AppState.CONFIG_ERROR, AppState.MAP_READY],
  [AppState.MAP_READY]: [AppState.MAP_ERROR, AppState.FETCHING_LOCATION],
  [AppState.FETCHING_LOCATION]: [AppState.LOCATION_ERROR, AppState.LOCATION_READY, AppState.USE_DEFAULT_LOCATION],
  [AppState.LOCATION_READY]: [AppState.SEARCHING_BUSINESSES],
  [AppState.SEARCHING_BUSINESSES]: [AppState.SEARCH_ERROR, AppState.BUSINESSES_READY, AppState.PARTIAL_RESULTS],
  [AppState.BUSINESSES_READY]: [AppState.DISPLAY_COMPLETE],
  [AppState.PARTIAL_RESULTS]: [AppState.DISPLAY_COMPLETE]
} as const;
```

**2. Add State Management Hook (if using React in the future)**

Create `src/hooks/useAppState.ts`:
```typescript
import { useState, useCallback } from 'react';
import { AppState, AppStateType } from '../types/fsm';

export const useAppState = () => {
  const [currentState, setCurrentState] = useState<AppStateType>(AppState.INITIALIZING);
  const [error, setError] = useState<string | null>(null);

  const transitionTo = useCallback((newState: AppStateType, errorMessage?: string) => {
    setCurrentState(newState);
    setError(errorMessage || null);
  }, []);

  return {
    currentState,
    error,
    transitionTo,
    isInState: (state: AppStateType) => currentState === state
  };
};
```

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

## Final Checklist Before Work Laptop Transfer

- [ ] Remove all `.js.bak` files
- [ ] Remove `.DS_Store` files
- [ ] Fix TypeScript `as any` usage
- [ ] Update `.gitignore`
- [ ] Add FSM state constants and transitions
- [ ] Add bundle analyzer
- [ ] Add environment validation
- [ ] Update documentation (`README.md`, `docs/api.md`, `DEVELOPMENT.md`)

---

This plan will ensure your project is clean, maintainable, and ready for FSM integration and future work. 