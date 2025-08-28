# Bole.to MVP API Endpoints

This document provides a comprehensive overview of all API endpoints available through the staging gateway service.

## Base URLs

- **Staging**: `https://staging-api.bole.to`
- **Gateway Health**: `https://staging-api.bole.to/healthz`
- **Hi.Events Backend**: Proxied through gateway

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## Gateway Endpoints

### Health Check

```http
GET /healthz
```

**Response**: Gateway health status
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "used": 45,
      "total": 128,
      "external": 2,
      "rss": 67
    }
  }
}
```

### Deep Health Check

```http
GET /healthz?deep=true
```

**Response**: Includes backend connectivity check
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "system": { ... },
  "backend": {
    "healthy": true,
    "status": 200,
    "responseTime": 45,
    "url": "https://hievents-backend/api/public/color-themes"
  }
}
```

## Authentication Endpoints

### Login

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "user@example.com"
    }
  }
}
```

### Register

```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "timezone": "America/New_York"
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Headers**: `Authorization: Bearer <current_token>`

### Logout

```http
POST /api/auth/logout
```

**Headers**: `Authorization: Bearer <token>`

## User Endpoints

### Get Current User

```http
GET /api/users/me
```

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "timezone": "America/New_York",
    "created_at": "2025-01-20T10:00:00.000Z"
  }
}
```

### Update Current User

```http
PUT /api/users/me
```

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "timezone": "America/Los_Angeles"
}
```

## Event Endpoints

### Get Events (Private)

```http
GET /api/events
```

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (integer): Page number
- `per_page` (integer): Items per page (max 100)
- `search` (string): Search term
- `sort_by` (string): Field to sort by
- `sort_direction` (string): `asc` or `desc`

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Tech Conference 2025",
      "description": "Annual technology conference",
      "start_date": "2025-03-15T09:00:00.000Z",
      "end_date": "2025-03-15T17:00:00.000Z",
      "timezone": "America/New_York",
      "status": "LIVE",
      "currency": "USD",
      "settings": {
        "location_details": {
          "venue_name": "Convention Center",
          "address_line_1": "123 Main St",
          "city": "New York",
          "state_or_region": "NY",
          "zip_or_postal_code": "10001",
          "country": "US"
        }
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1
  }
}
```

### Get Single Event (Private)

```http
GET /api/events/{event_id}
```

**Headers**: `Authorization: Bearer <token>`

### Create Event

```http
POST /api/events
```

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "My Event",
  "description": "Event description",
  "start_date": "2025-03-15T09:00:00.000Z",
  "end_date": "2025-03-15T17:00:00.000Z",
  "timezone": "America/New_York",
  "currency": "USD",
  "settings": {
    "location_details": {
      "venue_name": "My Venue",
      "address_line_1": "123 Event St",
      "city": "Event City",
      "state_or_region": "EC",
      "zip_or_postal_code": "12345",
      "country": "US"
    }
  }
}
```

## Public Event Endpoints

### Get Public Event

```http
GET /api/public/events/{event_id}
```

**Response**: Same as private event endpoint but with public fields only

### Get Public Event Products (Tickets)

```http
GET /api/public/events/{event_id}/products
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "General Admission",
      "description": "Standard entry ticket",
      "price": 50.00,
      "quantity_available": 100,
      "quantity_sold": 25,
      "sale_start_date": "2025-01-01T00:00:00.000Z",
      "sale_end_date": "2025-03-14T23:59:59.000Z",
      "is_available": true
    }
  ]
}
```

## Order Endpoints

### Create Order (Public)

```http
POST /api/public/events/{event_id}/order
```

**Request Body**:
```json
{
  "order_items": [
    {
      "ticket_id": 1,
      "quantity": 2
    }
  ],
  "attendee_details": [
    {
      "ticket_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

**Response**:
```json
{
  "data": {
    "short_id": "ORD123",
    "total": 100.00,
    "currency": "USD",
    "status": "AWAITING_PAYMENT",
    "expires_at": "2025-01-20T11:00:00.000Z"
  }
}
```

### Get Order (Public)

```http
GET /api/public/events/{event_id}/order/{order_short_id}
```

### Complete Order (Public)

```http
PUT /api/public/events/{event_id}/order/{order_short_id}
```

**Request Body**:
```json
{
  "payment_method": "stripe",
  "payment_intent_id": "pi_1234567890"
}
```

## Stripe Payment Endpoints

### Create Payment Intent

```http
POST /api/public/events/{event_id}/order/{order_short_id}/stripe/payment_intent
```

**Response**:
```json
{
  "data": {
    "client_secret": "pi_1234567890_secret_abcd",
    "payment_intent_id": "pi_1234567890",
    "publishable_key": "pk_test_..."
  }
}
```

### Get Payment Intent

```http
GET /api/public/events/{event_id}/order/{order_short_id}/stripe/payment_intent
```

## Organizer Endpoints

### Get Public Organizer

```http
GET /api/public/organizers/{organizer_id}
```

### Get Organizer Events (Public)

```http
GET /api/public/organizers/{organizer_id}/events
```

## Utility Endpoints

### Get Color Themes

```http
GET /api/public/color-themes
```

**Response**:
```json
{
  "data": [
    {
      "id": "blue",
      "name": "Blue",
      "primary": "#2196F3",
      "secondary": "#FFC107"
    }
  ]
}
```

## Error Responses

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": {
      "email": ["The email field is required."]
    }
  }
}
```

### Common Error Codes

- `400` - `BAD_REQUEST`: Invalid request data
- `401` - `UNAUTHORIZED`: Invalid or missing authentication
- `403` - `FORBIDDEN`: Insufficient permissions
- `404` - `NOT_FOUND`: Resource not found
- `422` - `VALIDATION_ERROR`: Request validation failed
- `429` - `RATE_LIMITED`: Too many requests
- `500` - `INTERNAL_ERROR`: Server error
- `502` - `BAD_GATEWAY`: Backend service unavailable
- `503` - `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `504` - `GATEWAY_TIMEOUT`: Request timeout

## Request/Response Headers

### Common Request Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: application/json
User-Agent: BoletoApp/1.0.0 (iOS/Android)
```

### Common Response Headers

```http
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
Cache-Control: no-cache, private
```

## Rate Limiting

- **Unauthenticated**: 60 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Payment endpoints**: 10 requests per minute per IP

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when window resets

## CORS Configuration

The gateway is configured to allow requests from:
- Expo development: `exp://localhost:*`, `exp://127.0.0.1:*`, `exp://192.168.*:*`
- Local development: `http://localhost:*`
- Staging domain: `https://staging-api.bole.to`
- Production domain: `https://app.bole.to`

## Testing with cURL

### Authentication Example

```bash
# Login
curl -X POST https://staging-api.bole.to/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Use the returned token for authenticated requests
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# Get current user
curl -H "Authorization: Bearer $TOKEN" \
  https://staging-api.bole.to/api/users/me
```

### Public Endpoints Example

```bash
# Get color themes
curl https://staging-api.bole.to/api/public/color-themes

# Get public event
curl https://staging-api.bole.to/api/public/events/1
```

---

*For mobile app integration examples and SDK documentation, see [Mobile Integration Guide](./mobile-integration.md)*