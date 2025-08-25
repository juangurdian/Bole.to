# Bole.to Authentication API Documentation

Complete authentication system documentation for the Bole.to mobile event ticketing platform.

## Overview

This documentation provides comprehensive coverage of the Bole.to Authentication API, designed specifically for mobile applications with React Native/Expo integration. The API supports event organizers and attendees with secure authentication, authorization, and user management capabilities.

## Documentation Structure

### 📁 API Specifications
- **[OpenAPI 3.0 Specification](./auth-openapi.yaml)** - Complete API specification with all endpoints, schemas, and examples
- **[Postman Collection](./postman-collection.json)** - Ready-to-use API testing collection

### 📱 Integration Guides
- **[React Native Integration Guide](./react-native-integration.md)** - Complete implementation guide with code examples

## Quick Start

### 1. Import Postman Collection
```bash
# Import the Postman collection for immediate API testing
curl -o postman-collection.json https://raw.githubusercontent.com/your-repo/postman-collection.json
```

### 2. Configure Environment Variables
```bash
# Set up your environment variables
EXPO_PUBLIC_API_BASE_URL=https://api.bole.to/v1
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
```

### 3. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage expo-secure-store expo-local-authentication
```

## API Overview

### Base URLs
- **Production**: `https://api.bole.to/v1`
- **Staging**: `https://api-staging.bole.to/v1`
- **Development**: `http://localhost:8000/api/v1`

### Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Core Features

### 🔐 Authentication & Registration
- **User Registration** with email/phone verification
- **Email/Password Login** with device fingerprinting
- **Social Authentication** (Google, Apple, Facebook)
- **JWT Token Management** with automatic refresh
- **Biometric Authentication** support (Face ID, Touch ID, Fingerprint)

### 🔒 Security Features
- **Two-Factor Authentication (2FA)** with TOTP and backup codes
- **Session Management** across multiple devices
- **Rate Limiting** to prevent abuse
- **Account Lockout** after failed login attempts
- **Device Management** and registration
- **Secure Token Storage** using platform keychains

### 👤 Profile Management
- **User Profiles** with preferences and settings
- **Avatar Upload** with image processing
- **Role-Based Permissions** (Attendee, Organizer, Admin)
- **Profile Verification** status tracking

### 🔄 Account Lifecycle
- **Password Reset** and recovery
- **Account Deactivation** (temporary)
- **Account Deletion** (permanent with 30-day grace period)
- **Account Reactivation** for deactivated accounts

## Endpoint Categories

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user account |
| `POST` | `/auth/login` | User login with credentials |
| `POST` | `/auth/logout` | User logout (single or all devices) |
| `POST` | `/auth/refresh` | Refresh expired access token |

### Verification Endpoints  
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register/verify-email` | Verify email with code |
| `POST` | `/auth/register/verify-phone` | Verify phone with SMS code |
| `POST` | `/auth/register/resend-verification` | Resend verification code |

### Social Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/social/google` | Google OAuth authentication |
| `POST` | `/auth/social/apple` | Apple Sign In authentication |
| `POST` | `/auth/social/facebook` | Facebook authentication |
| `DELETE` | `/auth/social/unlink/{provider}` | Unlink social account |

### Password Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/password/forgot` | Request password reset |
| `POST` | `/auth/password/reset` | Reset password with token |
| `POST` | `/auth/password/change` | Change current password |

### Profile Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/profile` | Get user profile |
| `PUT` | `/auth/profile` | Update user profile |
| `POST` | `/auth/profile/avatar` | Upload profile avatar |

### Session & Device Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/sessions` | Get active sessions |
| `DELETE` | `/auth/sessions/{id}` | Revoke specific session |
| `DELETE` | `/auth/sessions` | Revoke all sessions |
| `GET` | `/auth/devices` | Get registered devices |
| `POST` | `/auth/devices` | Register new device |
| `PUT` | `/auth/devices/{id}` | Update device information |
| `DELETE` | `/auth/devices/{id}` | Unregister device |

### Two-Factor Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/2fa/setup` | Setup 2FA (generate QR code) |
| `POST` | `/auth/2fa/verify` | Verify 2FA setup |
| `POST` | `/auth/2fa/disable` | Disable 2FA |
| `GET` | `/auth/2fa/backup-codes` | Get backup codes |
| `POST` | `/auth/2fa/backup-codes` | Regenerate backup codes |

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": ["Specific validation errors"]
    }
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Rate Limiting

### Default Limits
- **General requests**: 100 per 5 minutes
- **Authentication requests**: 10 per 5 minutes  
- **Password reset**: 3 per 10 minutes
- **Verification codes**: 3 per 5 minutes

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1640995200
Retry-After: 300
```

## Mobile Integration

### React Native Implementation
The authentication system is designed with mobile-first principles:

- **Secure Token Storage** using Expo SecureStore/Keychain
- **Biometric Authentication** with Face ID/Touch ID/Fingerprint
- **Offline Token Validation** for improved UX
- **Automatic Token Refresh** with retry logic
- **Network Connection Handling** with request queuing
- **Push Notification Integration** for security alerts

### Key Dependencies
```json
{
  "expo-secure-store": "^14.2.4",
  "expo-local-authentication": "^14.1.4",  
  "expo-notifications": "^0.20.1",
  "@react-native-async-storage/async-storage": "^1.19.3"
}
```

## Security Considerations

### Token Security
- Access tokens expire in **1 hour**
- Refresh tokens expire in **7 days**  
- Tokens stored in secure keychain/keystore
- Support for token rotation and revocation

### Password Policy
- Minimum **8 characters**
- Must contain uppercase, lowercase, number, and special character
- Password age limit of **90 days**
- History prevention (last 5 passwords)

### Account Security
- **Account lockout** after 5 failed login attempts
- **Progressive lockout** with increasing delay
- **Session limits** (max 5 concurrent sessions)
- **Device registration** required for push notifications

### Network Security
- **Certificate pinning** recommended
- **Request/response encryption** with TLS 1.3
- **API key authentication** for service-to-service calls
- **Security headers** on all responses

## Testing

### Postman Collection Features
- **Environment variables** for easy switching between environments
- **Automatic token management** with refresh handling
- **Comprehensive test scripts** for all endpoints
- **Error scenario testing** including rate limits
- **Pre-request scripts** for setup automation

### Test Scenarios Covered
- ✅ User registration and verification flows
- ✅ Login/logout with various credential types
- ✅ Social authentication integration
- ✅ Password reset and change operations  
- ✅ Profile management and updates
- ✅ 2FA setup and verification
- ✅ Session and device management
- ✅ Rate limiting and error handling
- ✅ Token refresh and expiration

## Support & Troubleshooting

### Common Issues

**Token Refresh Failures**
- Check network connectivity
- Verify refresh token hasn't expired
- Ensure correct API endpoint URLs

**Biometric Authentication Issues**  
- Verify device biometric enrollment
- Check app permissions for biometric access
- Handle fallback to password authentication

**Social Authentication Problems**
- Validate OAuth client configuration
- Check redirect URI setup
- Verify provider-specific token format

### Getting Help
- **API Support**: api-support@bole.to
- **Documentation Issues**: Create an issue in the repository
- **Integration Questions**: Check the React Native integration guide

## Changelog

### Version 1.0.0 (Current)
- Initial authentication API release
- Complete user registration and verification flows
- Social authentication support (Google, Apple, Facebook)
- Two-factor authentication with backup codes
- Session and device management
- Comprehensive error handling and rate limiting
- Mobile-optimized token management
- React Native integration examples

---

## Quick Reference

### Essential Curl Examples

**Register User:**
```bash
curl -X POST https://api.bole.to/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "attendee",
    "acceptsTerms": true
  }'
```

**Login:**
```bash
curl -X POST https://api.bole.to/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Profile:**
```bash
curl -X GET https://api.bole.to/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### React Native Quick Setup

```typescript
import AuthService from './services/AuthService';
import { useAuth } from './hooks/useAuth';

// Initialize auth service
const authService = AuthService.getInstance();

// In your component
const { login, user, isAuthenticated } = useAuth();

// Login user
await login({
  email: 'user@example.com',
  password: 'SecurePass123!'
});
```

This documentation provides everything needed to integrate and test the Bole.to Authentication API. For detailed implementation examples, refer to the React Native Integration Guide.