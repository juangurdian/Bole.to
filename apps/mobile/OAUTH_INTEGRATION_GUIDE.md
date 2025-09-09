# OAuth Integration Setup Guide

This guide provides step-by-step instructions for setting up and testing the OAuth integration with Google and Apple sign-in for the Bole.to mobile app.

## Prerequisites

1. **Gateway API Setup**: Ensure the Gateway API is deployed and accessible
2. **OAuth Provider Credentials**: Google and Apple OAuth credentials configured
3. **Development Environment**: React Native development environment set up
4. **Device/Emulator**: iOS device/simulator for Apple Sign-In testing

## Configuration Steps

### 1. Environment Variables

Create a `.env` file in the mobile app root directory:

```env
# Gateway API Configuration
EXPO_PUBLIC_GATEWAY_URL=https://gateway.bole.to
EXPO_PUBLIC_APP_VERSION=1.0.0

# OAuth Provider Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id

# Deep Link Configuration
EXPO_PUBLIC_OAUTH_REDIRECT_URI=https://app.bole.to/auth/callback

# Development Configuration
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_DEBUG_AUTH=false
```

### 2. Google OAuth Configuration

#### 2.1 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Enable the Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web client ID**: For Gateway API communication
   - **iOS client ID**: For mobile app (if using native flows)
5. Configure authorized domains and redirect URIs

#### 2.2 Mobile App Configuration
The Google OAuth provider is already configured in `oauth-providers.ts`. Ensure your client IDs are correctly set in the environment variables.

### 3. Apple Sign-In Configuration

#### 3.1 Apple Developer Console Setup
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Register your App ID with Sign In with Apple capability
3. Create a Services ID for web authentication (if needed)
4. Configure your domain and redirect URLs

#### 3.2 Xcode Configuration
When building for iOS, ensure the Apple Sign-In capability is enabled in your Xcode project.

### 4. Deep Link Configuration

#### 4.1 Universal Links (iOS)
1. Upload the apple-app-site-association file to your domain:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAMID.com.bole.to.mobile",
           "paths": ["/auth/*"]
         }
       ]
     }
   }
   ```

#### 4.2 App Links (Android)
The `app.json` configuration includes the necessary intent filters for Android app links.

## Testing the Integration

### 1. Run Integration Tests

Use the built-in test suite to verify the setup:

```javascript
import { AuthTestSuite } from './src/auth/auth-test-utils';

const testSuite = new AuthTestSuite();
const results = await testSuite.runFullTestSuite();
console.log(testSuite.generateReport());
```

### 2. Manual Testing Checklist

#### 2.1 Google Sign-In Test
- [ ] Google Sign-In button appears on login screen
- [ ] Clicking Google Sign-In opens Google authentication
- [ ] User can select Google account
- [ ] Authentication completes successfully
- [ ] User data is stored correctly
- [ ] JWT tokens are received and stored

#### 2.2 Apple Sign-In Test (iOS Only)
- [ ] Apple Sign-In button appears on iOS devices
- [ ] Clicking Apple Sign-In opens Apple authentication
- [ ] Face ID/Touch ID authentication works (if enabled)
- [ ] User can choose to share or hide email
- [ ] Authentication completes successfully
- [ ] User data is stored correctly

#### 2.3 Deep Link Test
- [ ] OAuth callback URLs redirect to the app
- [ ] State parameter validation works
- [ ] PKCE code verification succeeds
- [ ] Authentication completes after deep link

#### 2.4 Account Selection Test
- [ ] Multiple accounts trigger selection modal
- [ ] User can choose between accounts
- [ ] Selected account is authenticated correctly
- [ ] Account switching works in profile

#### 2.5 Session Management Test
- [ ] Active sessions are listed correctly
- [ ] Current device is marked appropriately
- [ ] Session revocation works
- [ ] "Sign out all devices" functions properly

### 3. Error Handling Test

Test various error scenarios:
- Network connectivity issues
- Invalid OAuth credentials
- Cancelled authentication flows
- Expired or invalid tokens
- Deep link manipulation attempts

## Security Considerations

### 1. PKCE Implementation
- Code verifiers are cryptographically random
- Code challenges use SHA256 with base64url encoding
- Verifiers are stored securely and cleared after use

### 2. State Parameter Validation
- State parameters include entropy and expiration
- State validation prevents CSRF attacks
- Invalid states are rejected immediately

### 3. Token Storage
- JWT tokens stored in Expo SecureStore
- Biometric protection available where supported
- Token rotation implemented for refresh tokens

### 4. Deep Link Security
- URLs validated against trusted domains
- Parameters sanitized before processing
- Malformed links rejected gracefully

## Troubleshooting

### Common Issues

#### 1. Google Sign-In Not Working
- **Issue**: "Google Sign-In failed" error
- **Solutions**:
  - Verify Google client IDs in environment variables
  - Check Google Play Services availability (Android)
  - Confirm OAuth consent screen is configured
  - Verify SHA-1/SHA-256 fingerprints (Android)

#### 2. Apple Sign-In Not Available
- **Issue**: Apple Sign-In button doesn't appear
- **Solutions**:
  - Confirm running on iOS device/simulator
  - Check Apple Sign-In capability in Xcode
  - Verify App ID configuration in Apple Developer Console

#### 3. Deep Links Not Working
- **Issue**: OAuth callbacks don't return to app
- **Solutions**:
  - Verify universal links configuration
  - Check apple-app-site-association file accessibility
  - Confirm intent filters in app.json (Android)
  - Test deep links in development vs production

#### 4. Gateway API Connection Issues
- **Issue**: Authentication requests fail
- **Solutions**:
  - Verify Gateway API URL in environment variables
  - Check network connectivity
  - Confirm Gateway API CORS configuration
  - Validate OAuth endpoints are accessible

### Debug Tools

#### 1. Enable Debug Logging
Set `EXPO_PUBLIC_DEBUG_AUTH=true` to enable verbose logging.

#### 2. Test Network Connectivity
```javascript
import { devUtils } from './src/auth/auth-test-utils';
const isConnected = await devUtils.testNetworkConnectivity();
```

#### 3. Clear Auth State
```javascript
import { devUtils } from './src/auth/auth-test-utils';
await devUtils.clearAllAuthData();
```

#### 4. Inspect Current Auth State
```javascript
import { devUtils } from './src/auth/auth-test-utils';
await devUtils.logCurrentAuthState();
```

## Production Deployment

### 1. Environment Variables
- Update environment variables for production Gateway API
- Use production OAuth client IDs
- Configure production deep link domains

### 2. Build Configuration
- Enable code signing for iOS
- Configure Android keystore for app links verification
- Test deep links with production domains

### 3. App Store Requirements
- Add OAuth provider usage descriptions to Info.plist
- Include privacy policy links for OAuth data usage
- Test OAuth flows in app store review environment

## Monitoring and Analytics

### 1. Authentication Metrics
Monitor key OAuth metrics:
- Authentication success/failure rates by provider
- Account selection frequency
- Session duration and activity
- Deep link callback success rates

### 2. Error Tracking
Track OAuth-related errors:
- Provider-specific failure rates
- Network connectivity issues
- Token refresh failures
- Deep link parsing errors

### 3. Security Events
Log security-relevant events:
- Suspicious deep link attempts
- Invalid state parameters
- Token tampering attempts
- Unusual session patterns

## Support and Maintenance

### 1. Regular Updates
- Keep OAuth SDKs updated
- Monitor provider API changes
- Update security best practices
- Review and rotate credentials periodically

### 2. User Support
- Provide clear OAuth error messages
- Document account linking process
- Offer fallback authentication methods
- Support account recovery scenarios

This integration provides a secure, scalable OAuth solution that integrates seamlessly with the Gateway API infrastructure while maintaining excellent user experience across both iOS and Android platforms.