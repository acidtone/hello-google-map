# Development Guide

This guide provides information for developers working on the Hello Maps application.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Maps API key
- Foursquare API key

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hello-maps
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_FOURSQUARE_API_KEY=your_foursquare_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

---

## Project Structure

```
hello-maps/
├── src/
│   ├── actions/          # Business logic and data processing
│   │   ├── businessActions.ts
│   │   ├── locationActions.ts
│   │   └── mapActions.ts
│   ├── services/         # Core application services
│   │   ├── businessService.ts
│   │   ├── errorService.ts
│   │   ├── locationService.ts
│   │   └── mapService.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── business.ts
│   │   ├── config.ts
│   │   ├── error.ts
│   │   ├── fsm.ts       # FSM state constants
│   │   ├── index.ts
│   │   ├── location.ts
│   │   ├── map.ts
│   │   └── result.ts
│   ├── utils/           # Utility functions
│   │   ├── debug.ts     # Development debugging
│   │   ├── env.ts       # Environment validation
│   │   └── stateManager.ts # FSM state management
│   ├── config.ts        # Application configuration
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles
├── docs/                # Documentation
│   ├── api.md          # API documentation
│   └── fsm-integration.md # FSM integration guide
├── public/             # Static assets
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project overview
```

---

## Development Workflow

### Common Tasks

#### Adding New Map Features
- **File**: `src/services/mapService.ts`
- **Pattern**: Add new functions that return promises for async operations
- **Example**:
  ```typescript
  export const addCustomMarker = async (position: Coordinates, options?: MarkerOptions): Promise<google.maps.Marker> => {
    // Implementation
  };
  ```

#### Modifying Business Search
- **File**: `src/services/businessService.ts`
- **Pattern**: Update search parameters or add new search types
- **Example**:
  ```typescript
  export const searchBusinessesByCategory = async (category: string, location: Coordinates): Promise<Business[]> => {
    // Implementation
  };
  ```

#### Error Handling
- **File**: `src/services/errorService.ts`
- **Pattern**: Add new error types and recovery actions
- **Example**:
  ```typescript
  const ErrorTypes = {
    // ... existing types
    NEW_ERROR_TYPE: 'new_error_type'
  };
  ```

#### State Management
- **File**: `src/types/fsm.ts`
- **Pattern**: Add new states and transitions for FSM integration
- **Example**:
  ```typescript
  export const AppState = {
    // ... existing states
    NEW_STATE: 'new_state'
  };
  ```

### Code Quality

#### TypeScript
- All code is written in TypeScript with strict type checking
- Use interfaces and types for all data structures
- Avoid `any` type - use proper type definitions

#### Error Handling
- All async operations should be wrapped in try-catch blocks
- Use the centralized error service for consistent error handling
- Provide user-friendly error messages

#### State Management
- Use FSM state constants for all state transitions
- Validate state transitions before executing them
- Log state changes for debugging

---

## Available Scripts

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Bundle Analysis
```bash
# Build and analyze bundle size
npm run build
# This will automatically open bundle analysis in browser
```

### Environment Validation
```bash
# Start dev server (will validate environment)
npm run dev
```

---

## API Integration

### Google Maps API
- **Documentation**: [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- **Key Features**: Maps, Places, Geocoding
- **Rate Limits**: [Quotas and Pricing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)

### Foursquare Places API
- **Documentation**: [Foursquare Places API](https://developer.foursquare.com/docs/places-api)
- **Key Features**: Business search, venue details
- **Rate Limits**: 950 requests/day (free tier)

### Environment Variables
```bash
# Required for Google Maps functionality
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Required for business search functionality
VITE_FOURSQUARE_API_KEY=your_key_here
```

---

## FSM Integration

### Current Implementation
The application uses a lightweight FSM-compatible state management system:

```typescript
import { transitionAppState, getCurrentAppState } from './utils/stateManager';
import { AppState } from './types/fsm';

// Transition to a new state
const success = transitionAppState(AppState.MAP_READY);

// Get current state
const currentState = getCurrentAppState();
```

### Future Migration
When ready to migrate to a full FSM library (like Robot3):

1. Replace `src/utils/stateManager.ts` with the FSM library
2. Keep existing state constants from `src/types/fsm.ts`
3. Update transition calls to use the library's API
4. Remove custom state manager code

See `docs/fsm-integration.md` for detailed migration guide.

---

## Debugging

### Environment Issues
```typescript
import { logEnvironmentInfo } from './utils/debug';

// Log environment information (development only)
logEnvironmentInfo();
```

### State Management
```typescript
import { appStateManager } from './utils/stateManager';

// Subscribe to state changes
const unsubscribe = appStateManager.subscribe((state) => {
  console.log('State changed to:', state);
});

// Later, unsubscribe
unsubscribe();
```

### Error Handling
```typescript
import { handleError } from './services/errorService';

try {
  // Your code here
} catch (error) {
  const errorInfo = handleError(error, 'context_name');
  console.log('Error:', errorInfo.message);
  console.log('Recovery:', errorInfo.recovery);
}
```

---

## Performance Considerations

### Bundle Size
- Current bundle: ~28KB (10.8KB gzipped)
- Monitor bundle size with `npm run build`
- Keep dependencies minimal

### API Calls
- Implement caching for repeated API calls
- Use debouncing for search inputs
- Handle rate limits gracefully

### Map Performance
- Limit marker count for large datasets
- Use marker clustering for dense areas
- Optimize marker icons and info windows

---

## Testing

### Manual Testing Checklist
- [ ] Map loads correctly with valid API key
- [ ] Geolocation works (with permission)
- [ ] Search autocomplete functions
- [ ] Business search returns results
- [ ] Error handling works for invalid inputs
- [ ] State transitions work correctly
- [ ] Bundle size remains reasonable

### Environment Testing
- [ ] App works with missing Google Maps API key
- [ ] App works with missing Foursquare API key
- [ ] App works with both API keys missing
- [ ] Error messages are user-friendly

---

## Deployment

### Production Build
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables
- Ensure all required environment variables are set
- Use HTTPS in production (required for geolocation)
- Monitor API usage and rate limits

### Bundle Analysis
- Run `npm run build` to analyze bundle size
- Optimize large dependencies if needed
- Consider code splitting for large features

---

## Troubleshooting

### Common Issues

**Map Not Loading**
- Check Google Maps API key is valid
- Verify API key has required permissions
- Check browser console for errors

**Business Search Not Working**
- Verify Foursquare API key is correct
- Check rate limits (950 requests/day)
- Ensure HTTPS is used in production

**Environment Variables Not Working**
- Restart development server after adding variables
- Check variable names start with `VITE_`
- Verify `.env` file is in project root

**TypeScript Errors**
- Run `npm run build` to check for type errors
- Ensure all imports are correct
- Check type definitions for external libraries

### Getting Help
- Check the browser console for error messages
- Review the API documentation links above
- Consult the FSM integration guide for state management issues 