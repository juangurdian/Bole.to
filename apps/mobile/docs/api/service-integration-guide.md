# Bole.to Service-to-Service Integration Guide

## Overview

This guide provides comprehensive examples for integrating services with the Bole.to unified authentication system. Services can verify JWT tokens issued by the Gateway using the JWKS (JSON Web Key Set) endpoint for secure service-to-service communication.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│                 │    │              │    │                 │
│   Your Service  │    │   Gateway    │    │   Hi.Events     │
│   (Consumer)    ├────┤  (Issuer)    ├────┤  (User DB)      │
│                 │    │              │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────┐
         │              │              │
         └──────────────┤ JWKS Endpoint │
                        │/.well-known/  │
                        │  jwks.json    │
                        └──────────────┘
```

## JWT Verification Flow

1. **Client Request**: Service receives request with JWT in Authorization header
2. **Token Parsing**: Extract JWT and parse header to get Key ID ('kid')
3. **Key Retrieval**: Fetch signing key from Gateway's JWKS endpoint using 'kid'
4. **Signature Verification**: Verify JWT signature using RS256 algorithm
5. **Claims Validation**: Validate standard and custom JWT claims
6. **Request Processing**: Process authenticated request with user context

## JWT Structure

### JWT Header
```json
{
  "typ": "JWT",
  "alg": "RS256",
  "kid": "key1"
}
```

### JWT Payload (Claims)
```json
{
  "iss": "https://gateway.bole.to",
  "sub": "usr_1234567890abcdef",
  "aud": "bole.to",
  "exp": 1640999400,
  "iat": 1640995800,
  "jti": "jwt_abcdef123456",
  "email": "john.doe@example.com",
  "role": "attendee",
  "permissions": ["events:read", "tickets:manage", "profile:manage"],
  "verified": true
}
```

## Implementation Examples

### Node.js/Express Implementation

```typescript
// src/middleware/authMiddleware.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  email: string;
  role: string;
  permissions: string[];
  verified: boolean;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

class JWTVerificationService {
  private jwksClient: jwksClient.JwksClient;
  private keyCache: Map<string, string> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private keyTimestamps: Map<string, number> = new Map();

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: 'https://gateway.bole.to/.well-known/jwks.json',
      requestHeaders: {
        'User-Agent': 'YourService/1.0.0'
      },
      timeout: 10000, // 10 seconds
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 3600000, // 1 hour
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
  }

  private async getSigningKey(kid: string): Promise<string> {
    // Check cache first
    const cachedKey = this.keyCache.get(kid);
    const timestamp = this.keyTimestamps.get(kid);
    
    if (cachedKey && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return cachedKey;
    }

    try {
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();
      
      // Cache the key
      this.keyCache.set(kid, publicKey);
      this.keyTimestamps.set(kid, Date.now());
      
      return publicKey;
    } catch (error) {
      // Clear cached key if verification fails
      this.keyCache.delete(kid);
      this.keyTimestamps.delete(kid);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      // Decode token header to get key ID
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
        throw new Error('Invalid token format or missing key ID');
      }

      const kid = decoded.header.kid;
      const publicKey = await this.getSigningKey(kid);

      // Verify token signature and claims
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://gateway.bole.to',
        audience: 'bole.to',
        clockTolerance: 60 // Allow 60 seconds clock skew
      }) as JWTPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`JWT verification failed: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active yet');
      }
      throw error;
    }
  }
}

const jwtVerificationService = new JWTVerificationService();

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required'
        }
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>'
        }
      });
      return;
    }

    const payload = await jwtVerificationService.verifyToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    res.status(401).json({
      success: false,
      error: {
        code: 'JWT_VERIFICATION_FAILED',
        message: error instanceof Error ? error.message : 'Token verification failed'
      }
    });
  }
};

export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User authentication required'
        }
      });
      return;
    }

    const hasPermissions = requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );

    if (!hasPermissions) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          details: {
            required: requiredPermissions,
            current: user.permissions
          }
        }
      });
      return;
    }

    next();
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'User role not authorized for this resource',
          details: {
            required: allowedRoles,
            current: user.role
          }
        }
      });
      return;
    }

    next();
  };
};
```

### Usage Example

```typescript
// src/routes/events.ts
import express from 'express';
import { authenticateJWT, requirePermissions, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// Public endpoint (no authentication required)
router.get('/events/public', (req, res) => {
  res.json({ events: [] });
});

// Authenticated endpoint
router.get('/events', authenticateJWT, (req, res) => {
  const user = req.user;
  res.json({
    events: [],
    user: {
      id: user?.sub,
      email: user?.email,
      role: user?.role
    }
  });
});

// Permission-based access
router.post('/events', 
  authenticateJWT,
  requirePermissions(['events:create']),
  (req, res) => {
    // Only users with 'events:create' permission can access this
    res.json({ message: 'Event created' });
  }
);

// Role-based access
router.get('/admin/events', 
  authenticateJWT,
  requireRole(['admin', 'organizer']),
  (req, res) => {
    // Only admins and organizers can access this
    res.json({ adminEvents: [] });
  }
);

// Multiple permission requirements
router.delete('/events/:id',
  authenticateJWT,
  requirePermissions(['events:delete', 'events:manage']),
  (req, res) => {
    res.json({ message: 'Event deleted' });
  }
);

export default router;
```

### Python/FastAPI Implementation

```python
# auth_middleware.py
import jwt
import httpx
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from functools import lru_cache
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger(__name__)

class JWKSService:
    def __init__(self, jwks_url: str = "https://gateway.bole.to/.well-known/jwks.json"):
        self.jwks_url = jwks_url
        self.client = httpx.AsyncClient(timeout=10.0)
        self._keys_cache: Optional[Dict[str, Any]] = None
        self._cache_timestamp: Optional[datetime] = None
        self.cache_ttl_seconds = 3600  # 1 hour

    async def get_jwks(self) -> Dict[str, Any]:
        """Fetch JWKS with caching"""
        now = datetime.now(timezone.utc)
        
        # Check cache validity
        if (self._keys_cache is not None and 
            self._cache_timestamp is not None and 
            (now - self._cache_timestamp).total_seconds() < self.cache_ttl_seconds):
            return self._keys_cache

        try:
            response = await self.client.get(self.jwks_url)
            response.raise_for_status()
            
            self._keys_cache = response.json()
            self._cache_timestamp = now
            
            return self._keys_cache
            
        except httpx.RequestError as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            # Return cached version if available
            if self._keys_cache is not None:
                logger.warning("Using stale JWKS cache due to fetch error")
                return self._keys_cache
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch signing keys"
            )

    async def get_signing_key(self, kid: str) -> str:
        """Get public key for given key ID"""
        jwks = await self.get_jwks()
        
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # Convert JWK to PEM format
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Signing key not found for kid: {kid}"
        )

    async def close(self):
        await self.client.aclose()

class JWTVerificationService:
    def __init__(self):
        self.jwks_service = JWKSService()

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return claims"""
        try:
            # Decode header to get key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing key ID"
                )

            # Get signing key
            signing_key = await self.jwks_service.get_signing_key(kid)

            # Verify token
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                issuer="https://gateway.bole.to",
                audience="bole.to",
                options={
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_iss": True,
                    "verify_aud": True
                }
            )

            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed"
            )

    async def cleanup(self):
        await self.jwks_service.close()

# Global instance
jwt_service = JWTVerificationService()

# Dependency for FastAPI
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """FastAPI dependency to get current authenticated user"""
    return await jwt_service.verify_token(credentials.credentials)

def require_permissions(required_permissions: List[str]):
    """Decorator to require specific permissions"""
    def permission_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_permissions = user.get("permissions", [])
        
        missing_permissions = [p for p in required_permissions if p not in user_permissions]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_PERMISSIONS",
                    "message": "Insufficient permissions to access this resource",
                    "details": {
                        "required": required_permissions,
                        "missing": missing_permissions,
                        "current": user_permissions
                    }
                }
            )
        
        return user
    
    return permission_checker

def require_role(allowed_roles: List[str]):
    """Decorator to require specific roles"""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = user.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_ROLE",
                    "message": "User role not authorized for this resource",
                    "details": {
                        "required": allowed_roles,
                        "current": user_role
                    }
                }
            )
        
        return user
    
    return role_checker
```

### FastAPI Usage Example

```python
# main.py
from fastapi import FastAPI, Depends
from auth_middleware import get_current_user, require_permissions, require_role, jwt_service
from typing import Dict, Any

app = FastAPI(title="Bole.to Service")

@app.on_event("shutdown")
async def shutdown_event():
    await jwt_service.cleanup()

# Public endpoint
@app.get("/events/public")
async def get_public_events():
    return {"events": []}

# Authenticated endpoint
@app.get("/events")
async def get_events(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "events": [],
        "user": {
            "id": user["sub"],
            "email": user["email"],
            "role": user["role"]
        }
    }

# Permission-based endpoint
@app.post("/events")
async def create_event(user: Dict[str, Any] = Depends(require_permissions(["events:create"]))):
    return {"message": "Event created", "creator": user["sub"]}

# Role-based endpoint
@app.get("/admin/events")
async def get_admin_events(user: Dict[str, Any] = Depends(require_role(["admin", "organizer"]))):
    return {"admin_events": []}

# Multiple requirements
@app.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    user: Dict[str, Any] = Depends(require_permissions(["events:delete", "events:manage"]))
):
    return {"message": f"Event {event_id} deleted"}

# Health check with user info
@app.get("/health")
async def health_check(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "status": "healthy",
        "authenticated_user": user["sub"],
        "timestamp": "2024-01-15T12:00:00Z"
    }
```

## Error Handling Best Practices

### Comprehensive Error Response Format

```typescript
interface ServiceErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}
```

### Common Error Scenarios

```typescript
// src/utils/errorHandler.ts
export class JWTVerificationError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'JWTVerificationError';
  }
}

export const handleJWTError = (error: any): ServiceErrorResponse => {
  const timestamp = new Date().toISOString();
  
  if (error instanceof JWTVerificationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp
      }
    };
  }

  // Network errors when fetching JWKS
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return {
      success: false,
      error: {
        code: 'JWKS_FETCH_ERROR',
        message: 'Unable to fetch signing keys from Gateway',
        details: { originalError: error.message },
        timestamp
      }
    };
  }

  // JWT library errors
  if (error.name === 'JsonWebTokenError') {
    return {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token format is invalid',
        timestamp
      }
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        details: { expiredAt: error.expiredAt },
        timestamp
      }
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred during authentication',
      timestamp
    }
  };
};
```

## Caching and Performance Optimization

### JWKS Caching Strategy

```typescript
// src/cache/JWKSCache.ts
import Redis from 'ioredis';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate: number; // Additional time to serve stale data
}

export class JWKSCache {
  private redis: Redis;
  private fallbackCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(redisUrl?: string) {
    this.redis = redisUrl ? new Redis(redisUrl) : new Redis();
  }

  async get(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      // Fallback to in-memory cache
      console.warn('Redis error, using fallback cache:', error);
      const fallback = this.fallbackCache.get(key);
      return fallback ? fallback.data : null;
    }
  }

  async set(key: string, value: any, options: CacheOptions): Promise<void> {
    const serialized = JSON.stringify(value);
    
    try {
      await this.redis.setex(key, options.ttl, serialized);
    } catch (error) {
      // Fallback to in-memory cache
      console.warn('Redis error, using fallback cache:', error);
      this.fallbackCache.set(key, {
        data: value,
        timestamp: Date.now()
      });
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Redis error during invalidation:', error);
    }
    
    this.fallbackCache.delete(key);
  }
}
```

## Testing JWT Verification

### Unit Tests

```typescript
// tests/auth.test.ts
import { JWTVerificationService } from '../src/middleware/authMiddleware';
import jwt from 'jsonwebtoken';
import fs from 'fs';

describe('JWT Verification', () => {
  let jwtService: JWTVerificationService;
  let mockPrivateKey: string;
  let mockPublicKey: string;

  beforeAll(() => {
    // Load test keys
    mockPrivateKey = fs.readFileSync('./tests/fixtures/private-key.pem', 'utf8');
    mockPublicKey = fs.readFileSync('./tests/fixtures/public-key.pem', 'utf8');
    
    jwtService = new JWTVerificationService();
  });

  it('should verify valid JWT token', async () => {
    const payload = {
      iss: 'https://gateway.bole.to',
      sub: 'usr_test123',
      aud: 'bole.to',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      email: 'test@example.com',
      role: 'attendee',
      permissions: ['events:read'],
      verified: true
    };

    const token = jwt.sign(payload, mockPrivateKey, {
      algorithm: 'RS256',
      keyid: 'test-key-1'
    });

    // Mock JWKS response
    jest.spyOn(jwtService as any, 'getSigningKey').mockResolvedValue(mockPublicKey);

    const result = await jwtService.verifyToken(token);
    expect(result.sub).toBe('usr_test123');
    expect(result.email).toBe('test@example.com');
  });

  it('should reject expired token', async () => {
    const payload = {
      iss: 'https://gateway.bole.to',
      sub: 'usr_test123',
      aud: 'bole.to',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200,
      email: 'test@example.com',
      role: 'attendee',
      permissions: ['events:read'],
      verified: true
    };

    const token = jwt.sign(payload, mockPrivateKey, {
      algorithm: 'RS256',
      keyid: 'test-key-1'
    });

    await expect(jwtService.verifyToken(token)).rejects.toThrow('Token has expired');
  });

  it('should reject token with invalid signature', async () => {
    const payload = {
      iss: 'https://gateway.bole.to',
      sub: 'usr_test123',
      aud: 'bole.to',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign with wrong key
    const wrongKey = 'wrong-key';
    const token = jwt.sign(payload, wrongKey, { algorithm: 'HS256' });

    await expect(jwtService.verifyToken(token)).rejects.toThrow();
  });
});
```

## Monitoring and Observability

### Metrics Collection

```typescript
// src/metrics/authMetrics.ts
import { createPrometheusMetrics } from './prometheus';

export const authMetrics = createPrometheusMetrics({
  jwt_verification_total: {
    type: 'counter',
    help: 'Total JWT verification attempts',
    labelNames: ['status', 'error_type']
  },
  jwt_verification_duration: {
    type: 'histogram',
    help: 'JWT verification duration in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  },
  jwks_fetch_total: {
    type: 'counter',
    help: 'Total JWKS fetch attempts',
    labelNames: ['status']
  },
  active_sessions: {
    type: 'gauge',
    help: 'Number of active authenticated sessions'
  }
});

export const recordJWTVerification = (status: 'success' | 'failure', errorType?: string, duration?: number) => {
  authMetrics.jwt_verification_total.labels(status, errorType || '').inc();
  if (duration) {
    authMetrics.jwt_verification_duration.observe(duration);
  }
};
```

## Security Best Practices

### 1. Key Rotation Handling
- Always check 'kid' in JWT header
- Cache multiple keys during rotation periods  
- Implement graceful fallback for key mismatches

### 2. Error Information Disclosure
- Don't expose sensitive error details to clients
- Log detailed errors server-side for debugging
- Use generic error messages for security

### 3. Performance Considerations
- Cache JWKS responses appropriately (1 hour recommended)
- Use in-memory fallback for Redis failures
- Implement circuit breaker for JWKS endpoint

### 4. Monitoring and Alerting
- Monitor JWT verification failure rates
- Alert on JWKS fetch failures
- Track token expiration patterns

This service-to-service integration guide provides production-ready implementations for verifying Gateway-issued JWTs across different technology stacks, with comprehensive error handling, caching strategies, and monitoring capabilities.