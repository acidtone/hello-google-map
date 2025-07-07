# Hello Maps

A lightweight Google Maps application with location search, geocoding, and nearby business discovery features. This application demonstrates FSM-compatible patterns for error handling and state management.

## Features

- Interactive Google Maps integration
- Geolocation-based user positioning
- Postal code/zip code search
- Location autocomplete with Google Places API
- Nearby business search with Foursquare Places API
- Responsive marker and list interactions

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Google Maps API key
- Foursquare API key

### Setup
```bash
# Clone and install
git clone <repository-url>
cd hello-maps
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Start development
npm run dev
```

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
          ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  FETCHING_LOCATION│────▶│  LOCATION_ERROR   │
│                   │     │                   │
└─────────┬─────────┘     └─────────┬─────────┘
          │                         │
          ▼                         ▼
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  LOCATION_READY   │────▶│  SEARCHING        │
│                   │     │  BUSINESSES       │
└───────────────────┘     └─────────┬─────────┘
                                   │
                                   ▼
                        ┌───────────────────┐
                        │                   │
                        │  BUSINESSES_READY │
                        │                   │
                        └─────────┬─────────┘
                                   │
                                   ▼
                        ┌───────────────────┐
                        │                   │
                        │  DISPLAY_COMPLETE │
                        │                   │
                        └───────────────────┘
```

For detailed state descriptions and implementation details, see the [FSM Integration Guide](docs/fsm-integration.md).

## Bundle Size

The application maintains a small bundle size while implementing robust functionality:
- **Total**: ~28KB (10.8KB gzipped)
- **JavaScript**: ~24.9KB
- **CSS**: ~3.3KB

This lightweight footprint is achieved through minimal dependencies, modular code structure, and efficient error handling.

## Documentation

This project includes comprehensive documentation organized for different use cases:

### 📚 Detailed Guides
- **[Development Guide](DEVELOPMENT.md)** - Complete setup, workflow, and troubleshooting
- **[API Documentation](docs/api.md)** - External API integration details
- **[FSM Integration Guide](docs/fsm-integration.md)** - State management and future FSM library migration

### 🔗 External References
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Foursquare Places API](https://developer.foursquare.com/docs/places-api)

## FSM Integration

The codebase is prepared for future state machine library integration:

- **State Constants**: Defined in `src/types/fsm.ts`
- **State Manager**: Lightweight implementation in `src/utils/stateManager.ts`
- **Error Handling**: FSM-compatible patterns throughout
- **Migration Path**: Ready for Robot3, XState, or other FSM libraries

See the [FSM Integration Guide](docs/fsm-integration.md) for detailed implementation and migration examples.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production (includes bundle analysis)
npm run preview  # Preview production build
```

## Environment Variables

Required environment variables (see `.env.example`):
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_FOURSQUARE_API_KEY=your_foursquare_api_key
```

## Known Issues

- Geolocation may timeout on slow connections
- Foursquare API requires HTTPS in production
- Google Maps API has usage quotas

For detailed troubleshooting, see the [Development Guide](DEVELOPMENT.md).