# Hello Maps

A lightweight Google Maps application with location search, geocoding, and nearby business discovery features. This application demonstrates FSM-compatible patterns for error handling and state management.

## Features

- Interactive Google Maps integration
- Geolocation-based user positioning
- Postal code/zip code search
- Location autocomplete with Google Places API
- Nearby business search with Foursquare Places API
- Responsive marker and list interactions

## Architecture

The application follows a modular service-based architecture with FSM-compatible patterns for future state machine integration.

### Core Services

- **Map Service**: Handles map initialization and marker management
- **Location Service**: Manages geolocation and geocoding operations
- **Business Service**: Fetches and displays nearby businesses
- **Error Service**: Provides FSM-compatible error handling

### Application Flow

The application follows a unified process flow with multiple entry points that converge to a common sequence:

```
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  INITIALIZING     │────▶│  CONFIG_ERROR     │
│                   │     │                   │
└─────────┬─────────┘     └───────────────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  MAP_READY        │────▶│  MAP_ERROR        │
│                   │     │                   │
└─────────┬─────────┘     └───────────────────┘
          │
          │  ┌─────────────────────────────────────────────┐
          │  │                                             │
          │  │  Entry Points:                              │
          │  │  1. Page Load (auto)                        │
          │  │  2. "Locate Me" Button                      │
          │  │  3. Postal Code Submission                  │
          │  │  4. Autocomplete Selection                  │
          │  │                                             │
          │  └─────────────────────────────────────────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  FETCHING_LOCATION│────▶│  LOCATION_ERROR   │────┐
│                   │     │                   │    │
└─────────┬─────────┘     └─────────┬─────────┘    │
          │                         │              │
          │  ┌─────────────────────────────────────────────┐
          │  │                                             │
          │  │  Location Fetching Steps:                   │
          │  │  1. Check geolocation API availability      │
          │  │  2. Request user permission                 │
          │  │  3. Retrieve coordinates                    │
          │  │  4. Handle timeout/errors                   │
          │  │  5. Format location data                    │
          │  │                                             │
          │  └─────────────────────────────────────────────┘
          │
          │                         ▼              │
          │               ┌───────────────────┐    │
          │               │                   │    │
          │               │  USE_DEFAULT      │    │
          │               │  LOCATION         │    │
          │               │                   │    │
          │               └─────────┬─────────┘    │
          │                         │              │
          ▼                         │              │
┌───────────────────┐               │              │
│                   │               │              │
│  LOCATION_READY   │◀──────────────┘              │
│                   │                              │
└─────────┬─────────┘                              │
          │                                        │
          ▼                                        │
┌───────────────────┐     ┌───────────────────┐    │
│                   │     │                   │    │
│  SEARCHING        │────▶│  SEARCH_ERROR     │    │
│  BUSINESSES       │     │                   │    │
│                   │     └─────────┬─────────┘    │
└─────────┬─────────┘               │              │
          │                         │              │
          │                         ▼              │
          │               ┌───────────────────┐    │
          │               │                   │    │
          │               │  PARTIAL_RESULTS  │    │
          │               │                   │    │
          │               └─────────┬─────────┘    │
          │                         │              │
          ▼                         │              │
┌───────────────────┐               │              │
│                   │               │              │
│  BUSINESSES_READY │◀──────────────┘              │
│                   │                              │
└─────────┬─────────┘                              │
          │                                        │
          ▼                                        │
┌───────────────────┐                              │
│                   │                              │
│  DISPLAY_COMPLETE │◀─────────────────────────────┘
│                   │
└───────────────────┘
```

## State Descriptions

### Initial States
- **INITIALIZING**: Loading Google Maps API, validating config
- **MAP_READY**: Map initialized and ready for operations
- **CONFIG_ERROR**: API keys missing or invalid
- **MAP_ERROR**: Google Maps API failed to load or initialize

### Location States
- **FETCHING_LOCATION**: Getting user location or geocoding postal code
- **LOCATION_READY**: Valid location obtained, ready to display
- **LOCATION_ERROR**: Failed to get location
- **USE_DEFAULT_LOCATION**: Fallback to default location

### Business States
- **SEARCHING_BUSINESSES**: Fetching nearby businesses
- **BUSINESSES_READY**: Businesses retrieved and ready to display
- **SEARCH_ERROR**: Failed to get businesses
- **PARTIAL_RESULTS**: Some results available (e.g., Foursquare API key missing)

### Final State
- **DISPLAY_COMPLETE**: Location and available businesses displayed on map

## FSM-Compatible Error Handling

The application implements a lightweight FSM-compatible error handling system:

1. **Error Types**: Predefined error types for different scenarios
2. **Error Categorization**: Errors are categorized by severity and context
3. **Recovery Actions**: Each error type has an associated recovery action
4. **User Feedback**: Clear, read-only error messages guide the user

Example error handling pattern:
```javascript
try {
  // Operation that might fail
} catch (error) {
  const errorInfo = handleError(error, 'context_name');
  
  // Take appropriate recovery action based on the recovery type
  if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
    await useDefaultLocation();
  }
}
```

## Setup and Configuration

### Prerequisites

- Node.js and npm
- API Keys:
  - Google Maps JavaScript API (with Places and Geocoding enabled)
  - Foursquare Places API

### Environment Variables

Create a `.env` file in the project root with:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_FOURSQUARE_API_KEY=your_foursquare_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Future FSM Integration

The codebase has been prepared for future FSM integration through:

1. **Documented State Transitions**: Each function includes FSM state pattern documentation
2. **Consistent Error Handling**: FSM-compatible error handling throughout the application
3. **Modular Architecture**: Clear separation of concerns for easier state management
4. **Unified Process Flow**: Well-defined states and transitions

To integrate a full FSM library in the future:
1. Define explicit state constants
2. Implement state transition functions
3. Add state subscribers for UI updates
4. Refactor service functions to use the state machine

## Bundle Size

The application maintains a small bundle size while implementing robust functionality:
- JavaScript: ~12KB
- CSS: ~2.8KB
- Total: ~14.8KB

This lightweight footprint is achieved through:
- Minimal dependencies
- Modular code structure
- Efficient error handling
- No external state management libraries
