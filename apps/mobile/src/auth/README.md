# Authentication System

## Current Setup

The app currently uses **mock authentication** for development purposes. This allows you to test the app without needing a backend server.

### Files

- `useAuth.tsx` - Current mock authentication provider (used by the app)
- `useAuthReal.tsx` - Real Gateway authentication (ready for production)
- `gateway-auth-service.ts` - Complete Gateway client implementation with JWT, OAuth PKCE, and biometrics
- `token.ts` - Secure token storage utilities

## Development Mode (Current)

The mock authentication accepts any credentials and simulates:
- Login/logout flows
- User profile management
- OAuth authentication
- Token storage

### How to Login
1. Enter any email and password
2. The app will accept the credentials and log you in
3. Your email will be used as the display name

## Production Mode (Future)

When ready to switch to real authentication:

1. Rename the files:
```bash
# Switch to real auth
mv src/auth/useAuth.tsx src/auth/useAuthMock.tsx
mv src/auth/useAuthReal.tsx src/auth/useAuth.tsx
```

2. Set up environment variables:
```bash
# Create .env.local
EXPO_PUBLIC_GATEWAY_URL=https://your-gateway-url.com
EXPO_PUBLIC_OAUTH_REDIRECT_URI=com.bole.to://oauth/callback
```

3. Ensure the Gateway backend is running with:
- JWT RS256 token signing
- OAuth providers configured (Google, Apple)
- Hi.Events integration for user management

## Features Ready for Production

✅ JWT token management with auto-refresh
✅ OAuth PKCE flows for Google/Apple
✅ Biometric authentication support
✅ Secure token storage with Expo SecureStore
✅ Device fingerprinting
✅ Deep link handling for OAuth callbacks
✅ Comprehensive error handling

## Testing OAuth in Development

Even with mock auth, you can test OAuth flows:
```javascript
// The mock will simulate OAuth login
await authenticateWithOAuth('google', 'mock_auth_code');
```

## Security Notes

- Tokens are stored securely using Expo SecureStore
- Biometric authentication is optional and gracefully degrades
- All sensitive operations use try-catch for error handling
- The Gateway client includes rate limiting and security headers