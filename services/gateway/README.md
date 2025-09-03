# Bole.to Gateway Service

The Bole.to Gateway Service is a secure authentication and API gateway that provides OAuth 2.0 + PKCE authentication with RS256 JWT tokens. It handles mobile authentication flows, integrates with Hi.Events backend, and provides a unified API surface.

## Features

### 🔐 Authentication
- **OAuth 2.0 + PKCE** - Secure authorization with Google and Apple
- **RS256 JWT Tokens** - Industry standard token signing with RSA keys
- **Refresh Token Rotation** - Automatic token rotation with replay attack prevention
- **Device Tracking** - Multi-device session management
- **State Parameter Validation** - CSRF protection for OAuth flows

### 🛡️ Security
- **Rate Limiting** - Configurable rate limits for authentication endpoints
- **Input Validation** - Comprehensive request validation with express-validator
- **CORS Protection** - Configurable cross-origin resource sharing
- **Security Headers** - Helmet.js security headers
- **Token Family Tracking** - Prevents refresh token reuse attacks

### 🔗 Integration
- **Hi.Events Backend** - Seamless user identity linking
- **Multi-Account Support** - Handle users with multiple event accounts
- **Mobile-First Design** - Optimized for React Native mobile apps

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │◄──►│  Gateway Service │◄──►│  Hi.Events API  │
│                 │    │                  │    │                 │
│ • OAuth Client  │    │ • JWT Issuer     │    │ • User Database │
│ • PKCE Support  │    │ • PKCE Validator │    │ • Event Data    │
│ • Token Storage │    │ • Session Mgmt   │    │ • Business Logic│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    Database      │
                       │                  │
                       │ • OAuth States   │
                       │ • Refresh Tokens │
                       │ • User Sessions  │
                       └──────────────────┘
```

## API Endpoints

### Authentication Endpoints

#### `POST /auth/oauth/:provider/start`
Start OAuth flow with PKCE parameters.

**Supported Providers:** `google`, `apple`

```json
{
  "redirectUri": "com.bole.to://oauth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "random-state-parameter",
    "codeChallenge": "pkce-code-challenge",
    "codeChallengeMethod": "S256",
    "codeVerifier": "pkce-code-verifier"
  }
}
```

#### `POST /auth/oauth/:provider/callback`
Complete OAuth flow and issue JWT tokens.

```json
{
  "code": "oauth-authorization-code",
  "codeVerifier": "pkce-code-verifier",
  "state": "oauth-state-parameter",
  "redirectUri": "com.bole.to://oauth/callback",
  "deviceInfo": {
    "deviceId": "unique-device-id",
    "platform": "ios",
    "appVersion": "1.0.0",
    "osVersion": "16.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "attendee",
      "emailVerified": true,
      "phoneVerified": false,
      "profile": {
        "avatar": "https://...",
        "bio": "Event enthusiast"
      },
      "socialAccounts": [
        {
          "provider": "google",
          "linkedAt": "2025-01-01T00:00:00Z"
        }
      ]
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 3600
    },
    "accounts": [],
    "isNewUser": false,
    "linkedProvider": "google"
  }
}
```

#### `POST /auth/refresh`
Refresh access token using refresh token.

```json
{
  "refreshToken": "refresh-token-string"
}
```

#### `POST /auth/logout`
Logout user and revoke tokens.

```json
{
  "allDevices": false,
  "refreshToken": "refresh-token-string"
}
```

#### `GET /auth/sessions`
Get all active sessions for the authenticated user with pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of sessions to return (max 100, default 20)
- `offset` (optional): Number of sessions to skip (default 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-uuid",
        "userId": "user_123",
        "deviceInfo": {
          "deviceType": "mobile",
          "deviceName": "iPhone 15 Pro",
          "os": "iOS",
          "osVersion": "17.0",
          "browser": null,
          "userAgent": "Bole.to/1.0 (iPhone; iOS 17.0)",
          "appVersion": "1.0.0"
        },
        "ipAddress": "192.168.1.100",
        "lastActivity": "2025-01-15T10:30:00Z",
        "createdAt": "2025-01-15T09:00:00Z",
        "tokenExpiresAt": "2025-02-14T09:00:00Z",
        "isActive": true,
        "isCurrent": true
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### `DELETE /auth/sessions/:id`
Revoke a specific session by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Parameters:**
- `id`: UUID of the session to revoke

**Response:**
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "sessionId": "session-uuid"
  }
}
```

### Profile Endpoints

#### `GET /me`
Get current user profile (requires Bearer token).

#### `PUT /me`
Update current user profile.

#### `GET /me/accounts`
Get user accounts from Hi.Events.

### System Endpoints

#### `GET /healthz`
Health check endpoint with optional deep check.

#### `GET /.well-known/jwks.json`
JSON Web Key Set for JWT verification.

## Configuration

### Environment Variables

#### Server Configuration
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)

#### Database
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (optional)

#### JWT Configuration
- `JWT_ISSUER` - JWT issuer URL
- `JWT_AUDIENCE` - JWT audience
- `JWT_PRIVATE_KEY` - RSA private key (PEM format)
- `JWT_PUBLIC_KEY` - RSA public key (PEM format)
- `JWT_KEY_ID` - Key identifier
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (e.g., "1h")
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (e.g., "30d")

#### OAuth Providers
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=com.bole.to://oauth/callback

# Apple OAuth  
APPLE_CLIENT_ID=your-apple-client-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_REDIRECT_URI=com.bole.to://oauth/callback
```

#### Hi.Events Integration
- `HIEVENTS_API_URL` - Hi.Events backend URL
- `HIEVENTS_API_KEY` - Hi.Events API key

#### Security
- `CORS_ORIGINS` - Comma-separated allowed origins
- `REQUEST_TIMEOUT` - Request timeout in milliseconds
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `RATE_LIMIT_AUTH_WINDOW_MS` - Auth rate limiting window
- `RATE_LIMIT_AUTH_MAX_REQUESTS` - Max auth requests per window

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for session storage)

### Setup
1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up database:
   ```bash
   # The service will auto-create tables on startup
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Docker
```bash
# Build image
docker build -t bole.to/gateway .

# Run container
docker run -p 3001:3001 --env-file .env bole.to/gateway
```

### Production Considerations

1. **Database Scaling**: Use connection pooling and read replicas
2. **Redis**: Enable Redis for session storage in production
3. **Load Balancing**: Deploy behind a load balancer
4. **SSL/TLS**: Terminate SSL at load balancer or reverse proxy
5. **Monitoring**: Set up health check monitoring
6. **Logging**: Configure structured logging for production
7. **Secrets**: Use secrets management for sensitive configuration

## Security Features

### PKCE (Proof Key for Code Exchange)
- **Code Verifier**: 43-128 character URL-safe string
- **Code Challenge**: SHA256 hash of verifier, base64url encoded
- **Challenge Method**: S256 only (more secure than plain)

### JWT Security
- **Algorithm**: RS256 (RSA with SHA-256)
- **Key Rotation**: Support for multiple keys via kid claim
- **Claims Validation**: Issuer, audience, expiration validation
- **Secure Storage**: Private keys never exposed in responses

### Refresh Token Security
- **Token Families**: Track token lineage for replay detection
- **Automatic Rotation**: New tokens issued on each refresh
- **Reuse Detection**: Revoke entire family on suspected reuse
- **Device Binding**: Associate tokens with device fingerprints

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 5 minutes
- **IP-based**: Tracking by client IP address
- **Configurable**: Adjust limits via environment variables

## Monitoring

### Health Checks
- **Basic Health**: `GET /healthz`
- **Deep Health**: `GET /healthz?deep=true` (includes backend checks)

### Metrics
The service logs the following events:
- Authentication successes/failures
- Token issuance and refresh
- OAuth flow completions
- Rate limit violations
- Database connection issues

### Alerting
Set up alerts for:
- High authentication failure rates
- Database connection failures
- Backend service unavailability
- Unusual token reuse patterns

## Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security best practices
5. Test OAuth flows thoroughly

## License

UNLICENSED - Internal Bole.to service