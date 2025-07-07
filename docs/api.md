# API Documentation

This document provides information about the external APIs used by the Hello Maps application and how they're integrated.

## Google Maps API

### Key Features Used
- **Maps JavaScript API**: Core map functionality and rendering
- **Places API**: Location search and autocomplete
- **Geocoding API**: Address to coordinates conversion

### Documentation Links
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Places API](https://developers.google.com/maps/documentation/javascript/places)
- [Google Geocoding API](https://developers.google.com/maps/documentation/javascript/geocoding)

### Rate Limits & Pricing
- [Quotas and Pricing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Places API Quotas](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)

### Configuration
```typescript
// Required environment variable
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

// API configuration in src/config.ts
const MAPS_API_CONFIG = {
  libraries: ['places'],
  callback: 'initMap'
};
```

### Features Implemented
- Interactive map initialization
- Marker management and clustering
- Location autocomplete with suggestions
- Address geocoding (postal codes, addresses)
- InfoWindow display for business information

---

## Foursquare Places API

### Key Features Used
- **Places API**: Nearby business search and discovery
- **Venue Details**: Business information and metadata

### Documentation Links
- [Foursquare Places API](https://developer.foursquare.com/docs/places-api)
- [API Reference](https://developer.foursquare.com/docs/api-reference)

### Rate Limits
- [Foursquare API Limits](https://developer.foursquare.com/docs/api/limits)
- Free tier: 950 requests per day
- Rate limit: 50 requests per second

### Configuration
```typescript
// Required environment variable
VITE_FOURSQUARE_API_KEY=your_foursquare_api_key

// API endpoint configuration
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3';
```

### Features Implemented
- Nearby business search around user location
- Business details and metadata
- Custom marker icons for different business types
- Business list with interactive elements

---

## Error Handling

### FSM-Compatible Error Handling
The application implements a lightweight FSM-compatible error handling system:

1. **Error Types**: Predefined error types for different scenarios
2. **Error Categorization**: Errors are categorized by severity and context
3. **Recovery Actions**: Each error type has an associated recovery action
4. **User Feedback**: Clear, read-only error messages guide the user

### Error Types
```typescript
const ErrorTypes = {
  LOCATION_PERMISSION: 'location_permission_denied',
  LOCATION_UNAVAILABLE: 'location_unavailable',
  GEOCODING_FAILED: 'geocoding_failed',
  POSTAL_CODE_FAILED: 'postal_code_failed',
  BUSINESS_SEARCH_FAILED: 'business_search_failed',
  MAPS_API_FAILED: 'maps_api_failed',
  GOOGLE_API_KEY_MISSING: 'google_api_key_missing',
  FOURSQUARE_API_KEY_MISSING: 'foursquare_api_key_missing',
  UNKNOWN: 'unknown_error'
};
```

### Recovery Actions
```typescript
const RecoveryActions = {
  USE_DEFAULT_LOCATION: 'use_default_location',
  SHOW_FORM: 'show_manual_entry',
  CONTINUE_PARTIAL: 'continue_with_partial_data',
  NONE: 'no_action'
};
```

### Example Error Handling
```typescript
try {
  // Operation that might fail
  await someRiskyOperation();
} catch (error) {
  const errorInfo = handleError(error, 'context_name');
  
  // Take appropriate recovery action based on the recovery type
  if (errorInfo.recovery === RecoveryActions.USE_DEFAULT_LOCATION) {
    await useDefaultLocation();
  }
}
```

---

## Environment Variables

### Required Variables
```bash
# Google Maps API Key (required)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Foursquare API Key (required for business search)
VITE_FOURSQUARE_API_KEY=your_foursquare_api_key
```

### Environment Validation
The application includes built-in environment validation:

```typescript
import { validateEnvironment } from './utils/env';

// This will throw an error if required variables are missing
validateEnvironment();
```

### Development Debugging
```typescript
import { logEnvironmentInfo } from './utils/debug';

// Log environment information (development only)
logEnvironmentInfo();
```

---

## Bundle Size

The application maintains a small bundle size while implementing robust functionality:
- **JavaScript**: ~24.9KB
- **CSS**: ~3.3KB
- **Total**: ~28KB (10.8KB gzipped)

This lightweight footprint is achieved through:
- Minimal dependencies
- Modular code structure
- Efficient error handling
- No external state management libraries

---

## API Integration Patterns

### Service-Based Architecture
The application follows a modular service-based architecture:

- **Map Service**: Handles map initialization and marker management
- **Location Service**: Manages geolocation and geocoding operations
- **Business Service**: Fetches and displays nearby businesses
- **Error Service**: Provides FSM-compatible error handling

### FSM-Compatible Patterns
All API interactions follow FSM-compatible patterns for future state machine integration:

1. **State Transitions**: Each API call has defined entry and exit states
2. **Error Handling**: Errors trigger appropriate state transitions
3. **Recovery Actions**: Automatic recovery based on error type
4. **User Feedback**: Clear error messages guide user actions

### Example Integration Flow
```
1. Initialize Map (MAP_READY state)
2. Get User Location (FETCHING_LOCATION → LOCATION_READY)
3. Search Businesses (SEARCHING_BUSINESSES → BUSINESSES_READY)
4. Display Results (DISPLAY_COMPLETE state)
```

---

## Troubleshooting

### Common Issues

**Google Maps API Errors**
- Check API key is valid and has required permissions
- Verify Places and Geocoding APIs are enabled
- Check browser console for detailed error messages

**Foursquare API Errors**
- Verify API key is correct
- Check rate limits (950 requests/day free tier)
- Ensure HTTPS is used in production

**Environment Variable Issues**
- Ensure `.env` file exists in project root
- Check variable names start with `VITE_`
- Restart development server after adding variables

### Debug Commands
```bash
# Check environment variables
npm run dev  # Will show validation errors

# Build and analyze bundle
npm run build  # Will show bundle analysis
```

---

## Future Enhancements

### Planned API Integrations
- **Weather API**: Show weather conditions for locations
- **Directions API**: Route planning and navigation
- **Street View API**: Panoramic street-level imagery

### Performance Optimizations
- **API Response Caching**: Reduce redundant API calls
- **Lazy Loading**: Load map features on demand
- **Bundle Splitting**: Separate vendor and application code

### Monitoring & Analytics
- **API Usage Tracking**: Monitor API call patterns
- **Error Rate Monitoring**: Track and alert on API failures
- **Performance Metrics**: Measure load times and user experience 