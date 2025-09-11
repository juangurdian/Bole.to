# Authentication API Reference

## Overview

This document provides comprehensive API reference for the Hi.Events mobile authentication system. The API provides JWT-based authentication with mobile-optimized endpoints, biometric security integration, and multi-account support.

## Base Configuration

**Base URL**: `{HIEVENTS_URL}/api/auth/mobile`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`  
**Accept**: `application/json`

### Environment Variables
```bash
EXPO_PUBLIC_HIEVENTS_URL=https://api.bole.to
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_USE_HIEVENTS_AUTH=true
```

## Authentication Endpoints

### Login
Authenticate user with email and password, returning JWT token and account context.

**Endpoint**: `POST /api/auth/mobile/login`  
**Authentication**: None required  
**Rate Limiting**: 5 requests per minute per IP

#### Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "account_id": 123,
  "device_info": {
    "device_id": "unique-device-identifier",
    "platform": "ios",
    "app_version": "1.0.0",
    "os_version": "17.0.1",
    "device_name": "iPhone 15 Pro"
  }
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "expires_at": "2024-09-11T15:30:00Z",
    "user": {
      "id": "123",
      "first_name": "John",
      "last_name": "Doe", 
      "email": "user@example.com",
      "email_verified_at": "2024-01-15T10:00:00Z",
      "timezone": "UTC",
      "avatar_url": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "phone_verified_at": "2024-01-16T10:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-09-01T12:00:00Z"
    },
    "accounts": [
      {
        "id": "456",
        "name": "Personal Account",
        "currency": "USD",
        "timezone": "America/New_York",
        "is_personal": true,
        "role": "owner",
        "permissions": ["events:create", "events:manage", "tickets:sell"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-09-01T12:00:00Z"
      }
    ],
    "current_account": {
      "id": "456",
      "name": "Personal Account",
      "currency": "USD",
      "timezone": "America/New_York",
      "is_personal": true,
      "role": "owner",
      "permissions": ["events:create", "events:manage", "tickets:sell"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-09-01T12:00:00Z"
    }
  }
}
```

#### Response (Error - 401)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {}
  }
}
```

#### Response Headers
```
Authorization: Bearer {access_token}
X-Auth-Token: {access_token}
```

### Logout
Invalidate current session and optionally logout from all devices.

**Endpoint**: `POST /api/auth/mobile/logout`  
**Authentication**: Bearer Token required

#### Request
```json
{
  "everywhere": false
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Token Refresh
Refresh JWT token to extend session.

**Endpoint**: `POST /api/auth/mobile/refresh`  
**Authentication**: Bearer Token required

#### Request
```json
{}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "expires_at": "2024-09-11T16:30:00Z"
  }
}
```

### Get User Profile
Retrieve current user profile and account context.

**Endpoint**: `GET /api/auth/mobile/me`  
**Authentication**: Bearer Token required

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "user@example.com",
      "email_verified_at": "2024-01-15T10:00:00Z",
      "timezone": "UTC",
      "avatar_url": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "phone_verified_at": "2024-01-16T10:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-09-01T12:00:00Z"
    },
    "accounts": [
      {
        "id": "456",
        "name": "Personal Account",
        "currency": "USD",
        "timezone": "America/New_York",
        "is_personal": true,
        "role": "owner",
        "permissions": ["events:create", "events:manage", "tickets:sell"],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-09-01T12:00:00Z"
      },
      {
        "id": "789",
        "name": "Business Account",
        "currency": "USD",
        "timezone": "America/Los_Angeles",
        "is_personal": false,
        "role": "admin",
        "permissions": ["events:view", "tickets:sell"],
        "created_at": "2024-02-01T00:00:00Z",
        "updated_at": "2024-09-01T12:00:00Z"
      }
    ],
    "current_account": {
      "id": "456",
      "name": "Personal Account",
      "currency": "USD",
      "timezone": "America/New_York",
      "is_personal": true,
      "role": "owner",
      "permissions": ["events:create", "events:manage", "tickets:sell"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-09-01T12:00:00Z"
    }
  }
}
```

### Switch Account
Switch to a different account context (requires biometric authentication on mobile).

**Endpoint**: `POST /api/auth/mobile/switch-account`  
**Authentication**: Bearer Token required

#### Request
```json
{
  "account_id": "789"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "789",
      "name": "Business Account",
      "currency": "USD",
      "timezone": "America/Los_Angeles",
      "is_personal": false,
      "role": "admin",
      "permissions": ["events:view", "tickets:sell"],
      "created_at": "2024-02-01T00:00:00Z",
      "updated_at": "2024-09-01T12:00:00Z"
    }
  }
}
```

### Verify Token
Validate JWT token without requiring full user profile fetch.

**Endpoint**: `GET /api/auth/mobile/verify`  
**Authentication**: Bearer Token required

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "expires_at": "2024-09-11T15:30:00Z",
    "user": {
      "id": "123",
      "email": "user@example.com"
    }
  }
}
```

#### Response (Invalid Token - 401)
```json
{
  "success": true,
  "data": {
    "valid": false
  }
}
```

### Health Check
Verify API health and mobile service availability.

**Endpoint**: `GET /api/auth/mobile/health`  
**Authentication**: None required

#### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-09-11T14:30:00Z",
    "version": "2.0.0",
    "services": {
      "database": "healthy",
      "cache": "healthy",
      "jwt": "healthy"
    }
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context",
      "trace_id": "unique-trace-identifier"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_ACCOUNT_NOT_FOUND` | 404 | Requested account doesn't exist |
| `AUTH_ACCOUNT_ACCESS_DENIED` | 403 | User doesn't have access to account |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token has expired |
| `AUTH_TOKEN_INVALID` | 401 | JWT token is malformed or invalid |
| `AUTH_DEVICE_COMPROMISED` | 403 | Device security assessment failed |
| `AUTH_RATE_LIMITED` | 429 | Too many requests, rate limit exceeded |
| `AUTH_BIOMETRIC_REQUIRED` | 403 | Biometric authentication required |
| `DEVICE_COMPROMISED` | 403 | Device shows signs of compromise |
| `NETWORK_ERROR` | 500 | Network connectivity issues |
| `VALIDATION_ERROR` | 422 | Request validation failed |

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully  
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

## Client Implementation Examples

### JavaScript/TypeScript Client

```typescript
class HiEventsAuthClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = `${baseURL}/api/auth/mobile`;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Bole.to-Mobile/1.0.0 (iOS)',
        'X-Platform': 'ios',
        'X-App-Version': '1.0.0'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new HiEventsError(
        errorData.error.code,
        errorData.error.message,
        response.status,
        errorData.error.details
      );
    }

    const data = await response.json();
    this.accessToken = data.data.access_token;
    
    return data;
  }

  async refreshToken(): Promise<RefreshResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.accessToken = data.data.access_token;
    
    return data;
  }

  async getMe(): Promise<UserResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${this.baseURL}/me`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return await response.json();
  }
}
```

### React Native Integration

```typescript
// useAuth hook implementation
export function useAuth() {
  const authClient = HiEventsAuthClient.getInstance();
  
  const login = async (email: string, password: string) => {
    try {
      const deviceInfo = await getDeviceInfo();
      const response = await authClient.login({
        email,
        password,
        device_info: deviceInfo
      });
      
      // Store tokens securely
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.user));
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authClient.refreshToken();
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  return { login, refreshToken, /* ... other methods */ };
}
```

## Request/Response Examples

### Complete Login Flow

1. **Initial Login Request**
```bash
curl -X POST https://api.bole.to/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: Bole.to-Mobile/1.0.0 (iOS)" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "device_info": {
      "device_id": "A1B2C3D4-E5F6-7G8H-9I0J-K1L2M3N4O5P6",
      "platform": "ios",
      "app_version": "1.0.0",
      "os_version": "17.0.1",
      "device_name": "iPhone 15 Pro"
    }
  }'
```

2. **Authenticated API Request**
```bash
curl -X GET https://api.bole.to/api/auth/mobile/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

3. **Account Switching Request**
```bash
curl -X POST https://api.bole.to/api/auth/mobile/switch-account \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "789"
  }'
```

4. **Token Refresh Request**
```bash
curl -X POST https://api.bole.to/api/auth/mobile/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

5. **Logout Request**
```bash
curl -X POST https://api.bole.to/api/auth/mobile/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "everywhere": false
  }'
```

## Rate Limiting

### Limits by Endpoint

| Endpoint | Rate Limit | Window |
|----------|------------|---------|
| `/login` | 5 requests | 1 minute |
| `/refresh` | 10 requests | 1 minute |
| `/me` | 60 requests | 1 minute |
| `/switch-account` | 10 requests | 1 minute |
| `/logout` | 5 requests | 1 minute |
| `/verify` | 60 requests | 1 minute |

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1694440800
Retry-After: 60
```

## Security Considerations

### Request Security
- All requests must use HTTPS
- Sensitive operations require biometric authentication on mobile
- Device fingerprinting for enhanced security
- Certificate pinning prevents MITM attacks

### Token Security
- JWT tokens include device-specific claims
- Tokens expire after 60 minutes by default
- Refresh tokens valid for 14 days
- Server-side token revocation on logout

### Data Protection
- User data encrypted in transit and at rest
- PII masking in logs
- Secure headers enforced
- OWASP security standards compliance

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Hi.Events Mobile Authentication API
  description: JWT-based mobile authentication with biometric security
  version: 2.0.0
  contact:
    name: Bole.to Development Team
    email: dev@bole.to

servers:
  - url: https://api.bole.to/api/auth/mobile
    description: Production server
  - url: https://staging-api.bole.to/api/auth/mobile
    description: Staging server

paths:
  /login:
    post:
      summary: Authenticate user
      description: Login with email and password, returning JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /me:
    get:
      summary: Get user profile
      description: Retrieve current user profile and account context
      security:
        - BearerAuth: []
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    LoginRequest:
      type: object
      required:
        - email
        - password
        - device_info
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        account_id:
          type: integer
          nullable: true
        device_info:
          $ref: '#/components/schemas/DeviceInfo'

    DeviceInfo:
      type: object
      required:
        - device_id
        - platform
        - app_version
        - os_version
      properties:
        device_id:
          type: string
        platform:
          type: string
          enum: [ios, android]
        app_version:
          type: string
        os_version:
          type: string
        device_name:
          type: string
          nullable: true

    LoginResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            access_token:
              type: string
            token_type:
              type: string
            expires_in:
              type: integer
            expires_at:
              type: string
              format: date-time
            user:
              $ref: '#/components/schemas/User'
            accounts:
              type: array
              items:
                $ref: '#/components/schemas/Account'
            current_account:
              $ref: '#/components/schemas/Account'
              nullable: true

    User:
      type: object
      properties:
        id:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        email:
          type: string
          format: email
        email_verified_at:
          type: string
          format: date-time
          nullable: true
        timezone:
          type: string
        avatar_url:
          type: string
          format: uri
          nullable: true
        phone:
          type: string
          nullable: true
        phone_verified_at:
          type: string
          format: date-time
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Account:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        currency:
          type: string
        timezone:
          type: string
        is_personal:
          type: boolean
        role:
          type: string
          enum: [owner, admin, member]
        permissions:
          type: array
          items:
            type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
```

---

**Document Version**: 1.0  
**Last Updated**: September 11, 2024  
**API Version**: 2.0.0