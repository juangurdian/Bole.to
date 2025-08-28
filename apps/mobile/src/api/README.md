# Hi.Events API Integration

This document describes the Hi.Events API integration implemented for the mobile app.

## Overview

The mobile app has been updated to use the real Hi.Events API through the staging gateway at `https://staging-api.bole.to` instead of mock APIs.

## Architecture

### Core Components

1. **httpClient.ts** - Axios-based HTTP client with JWT auth interceptors
2. **realApiService.ts** - Service layer implementing all Hi.Events API endpoints
3. **authService.ts** - Authentication service with JWT token management
4. **RealAuthProvider.tsx** - React context provider for authentication state

### Key Features

- **JWT Authentication**: Automatic token attachment and refresh
- **Multi-tenant Support**: Handle users with multiple accounts
- **Error Handling**: Automatic logout on 401 errors
- **Offline Detection**: API connectivity checking
- **Type Safety**: Full TypeScript support with Zod schemas

## API Endpoints Implemented

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/select-account` - Multi-tenant account selection
- `GET /api/users/me` - Current user data

### Events
- `GET /api/public/events` - Event discovery with filtering
- `GET /api/public/events/{id}` - Event details
- `GET /api/public/categories` - Event categories

### Orders & Tickets
- `GET /api/users/me/orders` - User's orders
- `POST /api/public/events/{id}/order` - Create order (returns Stripe client_secret)
- `POST /api/orders/{id}/confirm` - Confirm payment

### Health Check
- `GET /healthz` - API health status

## Authentication Flow

1. User enters credentials
2. App calls `/api/auth/login`
3. If multiple accounts, user selects account via `/api/auth/select-account`  
4. JWT token stored securely in Expo SecureStore
5. Token automatically included in subsequent API requests
6. Automatic logout on token expiration (401 errors)

## Usage Examples

### Basic API Call
```typescript
import { realApiService } from './api/realApiService';

// Get events with filters
const events = await realApiService.getEvents({
  city: 'Managua',
  category_ids: ['music'],
  price_max: 50
});
```

### Authentication
```typescript
import { useAuth } from './auth/useAuth';

const { login, user, isAuthenticated } = useAuth();

// Login user
const response = await login('user@example.com', 'password');

// Handle multi-tenant
if (response.accounts.length > 1) {
  await selectAccount(accountId);
}
```

## Screen Integration Status

### ✅ Completed
- **LoginScreen**: Real authentication with account selection
- **DiscoverScreen**: Real events API with filtering
- **TicketsScreen**: Real orders/tickets API
- **CheckoutScreen**: Real order creation (Stripe integration ready)
- **App Navigation**: Real auth state management

### 🔄 Needs Stripe SDK for Full Payment
- Add `@stripe/stripe-react-native` dependency
- Implement Stripe Payment Sheet in CheckoutScreen
- Handle payment confirmation flow

## Configuration

### Environment Variables
```typescript
const API_BASE_URL = 'https://staging-api.bole.to';
```

### Security
- JWT tokens stored in Expo SecureStore (not AsyncStorage)
- Certificate pinning could be added for production
- Automatic token cleanup on logout

## Testing

Use the `apiTest.ts` utilities to verify connectivity:

```typescript
import { runBasicAPITest } from './api/apiTest';

const results = await runBasicAPITest();
console.log('API integration status:', results);
```

## Next Steps

1. **Add Stripe SDK**: `expo install @stripe/stripe-react-native`
2. **Complete Payment Flow**: Integrate Stripe Payment Sheet 
3. **Test with Real Data**: Verify all endpoints with staging data
4. **Error Handling**: Add user-friendly error messages
5. **Offline Support**: Add cached data for offline mode

## Migration Notes

- All screens now use `useAuth` from `./auth/useAuth` instead of MockAuthProvider
- API calls use `useApi()` hook which now returns real API service
- User object structure changed to include account information
- All API responses now follow Hi.Events schema with proper TypeScript types