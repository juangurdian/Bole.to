# Bole.to API Reference - Phase 1 MVP

## Overview

The Bole.to API provides comprehensive event management and ticketing capabilities built on Hi.Events backend infrastructure. This documentation covers all endpoints implemented and tested in Phase 1 MVP.

**Base URL:** `https://staging-api.bole.to`  
**API Version:** v1  
**Authentication:** JWT Bearer token  
**Content Type:** `application/json`

## Authentication

### Login

Authenticate a user and receive JWT token with available accounts.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "accounts": [
      {
        "id": 1,
        "name": "My Event Company",
        "slug": "my-event-company"
      }
    ]
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `422` - Validation errors

### Select Account

Switch to a specific account context for multi-tenant users.

```http
POST /api/auth/select-account
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": 1
}
```

**Success Response (200):**
```json
{
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "account": {
      "id": 1,
      "name": "My Event Company"
    }
  }
}
```

### Refresh Token

Refresh an expiring JWT token.

```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Logout

Invalidate the current JWT token.

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "message": "Successfully logged out"
  }
}
```

## User Profile

### Get Current User

Retrieve the authenticated user's profile information.

```http
GET /api/users/me
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "timezone": "America/New_York",
    "locale": "en",
    "created_at": "2025-08-01T10:00:00Z",
    "updated_at": "2025-08-20T15:30:00Z"
  }
}
```

### Update User Profile

Update the authenticated user's profile information.

```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "timezone": "America/Los_Angeles",
  "locale": "en"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "timezone": "America/Los_Angeles",
    "locale": "en",
    "updated_at": "2025-08-28T12:00:00Z"
  }
}
```

## Event Discovery

### Get Events

Retrieve a paginated list of public events with filtering options.

```http
GET /api/public/events?query=music&city=New York&category_ids[]=1&category_ids[]=2&start_date=2025-09-01&end_date=2025-12-31&price_min=0&price_max=100&is_free=false&page=1&per_page=12
```

**Query Parameters:**
- `query` (string) - Text search in event titles and descriptions
- `city` (string) - Filter by city name
- `category_ids[]` (array) - Filter by category IDs
- `start_date` (string) - Filter events starting after this date (YYYY-MM-DD)
- `end_date` (string) - Filter events ending before this date (YYYY-MM-DD)
- `price_min` (number) - Minimum ticket price
- `price_max` (number) - Maximum ticket price
- `is_free` (boolean) - Filter for free events only
- `page` (number) - Page number (default: 1)
- `per_page` (number) - Items per page (default: 12, max: 50)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Summer Music Festival",
      "description": "Amazing outdoor music festival",
      "start_date": "2025-09-15T18:00:00Z",
      "end_date": "2025-09-15T23:00:00Z",
      "status": "LIVE",
      "is_free": false,
      "price_from": 2500,
      "currency": "USD",
      "images": [
        {
          "id": 1,
          "url": "https://example.com/event-image.jpg",
          "alt": "Event cover image"
        }
      ],
      "venue": {
        "name": "Central Park",
        "city": "New York",
        "state": "NY",
        "country": "US",
        "address_line_1": "Central Park West",
        "postal_code": "10024"
      },
      "categories": [
        {
          "id": 1,
          "name": "Music",
          "slug": "music"
        }
      ],
      "tickets": [
        {
          "id": 1,
          "title": "General Admission",
          "price": 2500,
          "currency": "USD",
          "quantity_available": 100,
          "is_sold_out": false
        }
      ],
      "organizer": {
        "id": 1,
        "name": "Music Events Co",
        "email": "contact@musiceventco.com"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 12,
    "total": 25,
    "last_page": 3,
    "has_more": true
  }
}
```

### Get Event Details

Retrieve detailed information about a specific event.

```http
GET /api/public/events/{event_id}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "title": "Summer Music Festival",
    "description": "Experience the best of summer music with top artists...",
    "start_date": "2025-09-15T18:00:00Z",
    "end_date": "2025-09-15T23:00:00Z",
    "status": "LIVE",
    "is_free": false,
    "price_from": 2500,
    "currency": "USD",
    "images": [
      {
        "id": 1,
        "url": "https://example.com/event-image.jpg",
        "alt": "Event cover image"
      }
    ],
    "venue": {
      "name": "Central Park",
      "city": "New York",
      "state": "NY",
      "country": "US",
      "address_line_1": "Central Park West",
      "postal_code": "10024",
      "latitude": 40.785091,
      "longitude": -73.968285
    },
    "categories": [
      {
        "id": 1,
        "name": "Music",
        "slug": "music",
        "description": "Musical events and concerts"
      }
    ],
    "tickets": [
      {
        "id": 1,
        "title": "General Admission",
        "description": "Access to general festival area",
        "price": 2500,
        "currency": "USD",
        "quantity_available": 100,
        "max_per_order": 6,
        "is_sold_out": false,
        "sale_start_date": "2025-08-01T00:00:00Z",
        "sale_end_date": "2025-09-15T17:00:00Z"
      },
      {
        "id": 2,
        "title": "VIP Pass",
        "description": "Premium access with exclusive perks",
        "price": 7500,
        "currency": "USD",
        "quantity_available": 25,
        "max_per_order": 2,
        "is_sold_out": false,
        "sale_start_date": "2025-08-01T00:00:00Z",
        "sale_end_date": "2025-09-15T17:00:00Z"
      }
    ],
    "organizer": {
      "id": 1,
      "name": "Music Events Co",
      "email": "contact@musiceventco.com",
      "phone": "+1-555-123-4567",
      "website": "https://musiceventco.com"
    }
  }
}
```

### Get Event Categories

Retrieve all available event categories for filtering.

```http
GET /api/public/categories
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Music",
      "slug": "music",
      "description": "Musical events and concerts"
    },
    {
      "id": 2,
      "name": "Technology",
      "slug": "technology",
      "description": "Tech conferences and meetups"
    },
    {
      "id": 3,
      "name": "Food & Drink",
      "slug": "food-drink",
      "description": "Culinary experiences and tastings"
    }
  ]
}
```

## Order Management

### Create Order

Create a new order for event tickets.

```http
POST /api/public/events/{event_id}/order
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ],
  "promo_code": "SUMMER2025",
  "affiliate_code": "PARTNER123"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": 123,
    "short_id": "ORD-ABC123",
    "status": "AWAITING_PAYMENT",
    "total_gross": 12500,
    "currency": "USD",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_title": "General Admission",
        "quantity": 2,
        "price": 2500,
        "total": 5000
      },
      {
        "id": 2,
        "product_id": 2,
        "product_title": "VIP Pass",
        "quantity": 1,
        "price": 7500,
        "total": 7500
      }
    ],
    "event": {
      "id": 1,
      "title": "Summer Music Festival",
      "start_date": "2025-09-15T18:00:00Z"
    },
    "expires_at": "2025-08-28T13:15:00Z",
    "created_at": "2025-08-28T12:15:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid product IDs or quantities
- `422` - Validation errors (insufficient inventory, invalid promo code)
- `404` - Event not found

### Get Order

Retrieve order details by short ID.

```http
GET /api/public/events/{event_id}/order/{order_short_id}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 123,
    "short_id": "ORD-ABC123",
    "status": "PAID",
    "total_gross": 12500,
    "currency": "USD",
    "payment_status": "SUCCEEDED",
    "payment_id": "pi_1234567890",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_title": "General Admission",
        "quantity": 2,
        "price": 2500,
        "total": 5000,
        "attendees": [
          {
            "id": 1,
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "ticket_reference": "TKT-XYZ789",
            "check_in_date": null,
            "qr_code": "QR_CODE_STRING_HERE"
          }
        ]
      }
    ],
    "event": {
      "id": 1,
      "title": "Summer Music Festival",
      "start_date": "2025-09-15T18:00:00Z",
      "venue": {
        "name": "Central Park",
        "city": "New York"
      }
    },
    "created_at": "2025-08-28T12:15:00Z",
    "updated_at": "2025-08-28T12:20:00Z"
  }
}
```

### Get User Orders

Retrieve all orders for the authenticated user.

```http
GET /api/users/me/orders?status=upcoming&page=1&per_page=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (string) - Filter by status: `upcoming`, `past`, `all` (default: `all`)
- `page` (number) - Page number (default: 1)
- `per_page` (number) - Items per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 123,
      "short_id": "ORD-ABC123",
      "status": "PAID",
      "total_gross": 12500,
      "currency": "USD",
      "payment_status": "SUCCEEDED",
      "items_count": 3,
      "event": {
        "id": 1,
        "title": "Summer Music Festival",
        "start_date": "2025-09-15T18:00:00Z",
        "venue": {
          "name": "Central Park",
          "city": "New York"
        },
        "images": [
          {
            "url": "https://example.com/event-image.jpg"
          }
        ]
      },
      "created_at": "2025-08-28T12:15:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 5,
    "last_page": 1,
    "has_more": false
  }
}
```

## Payment Processing

### Create Payment Intent

Create a Stripe payment intent for order completion.

```http
POST /api/public/events/{event_id}/order/{order_short_id}/stripe/payment_intent
Content-Type: application/json

{
  "return_url": "https://app.bole.to/order/confirmation"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "pi_1234567890abcdef",
    "client_secret": "pi_1234567890abcdef_secret_xyz",
    "amount": 12500,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

### Get Payment Intent

Retrieve the status of a payment intent.

```http
GET /api/public/events/{event_id}/order/{order_short_id}/stripe/payment_intent
```

**Success Response (200):**
```json
{
  "data": {
    "id": "pi_1234567890abcdef",
    "client_secret": "pi_1234567890abcdef_secret_xyz",
    "amount": 12500,
    "currency": "usd",
    "status": "succeeded",
    "payment_method": {
      "type": "card",
      "last4": "4242",
      "brand": "visa"
    }
  }
}
```

## Check-in System

### Get Check-in List

Retrieve check-in list details for staff access.

```http
GET /api/public/check-in-lists/{short_id}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "short_id": "CIL-ABC123",
    "name": "Main Event Check-in",
    "description": "Primary check-in point for all attendees",
    "event": {
      "id": 1,
      "title": "Summer Music Festival",
      "start_date": "2025-09-15T18:00:00Z"
    },
    "total_attendees": 250,
    "checked_in_count": 87,
    "is_active": true
  }
}
```

### Get Check-in List Attendees

Get attendees for a specific check-in list.

```http
GET /api/public/check-in-lists/{short_id}/attendees?search=john&page=1&per_page=50
```

**Query Parameters:**
- `search` (string) - Search by name or email
- `page` (number) - Page number
- `per_page` (number) - Items per page (max: 100)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "ticket_reference": "TKT-XYZ789",
      "check_in_date": "2025-09-15T18:15:00Z",
      "is_checked_in": true,
      "order_reference": "ORD-ABC123"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 250,
    "last_page": 5
  }
}
```

### Create Check-in

Check in an attendee using their public ID or QR code.

```http
POST /api/public/check-in-lists/{short_id}/check-ins
Content-Type: application/json

{
  "attendee_public_id": "ATT-DEF456"
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "attendee": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "ticket_reference": "TKT-XYZ789"
    },
    "check_in_date": "2025-09-15T18:15:00Z",
    "checked_in_by": "Staff Member"
  }
}
```

**Error Responses:**
- `400` - Attendee already checked in
- `404` - Attendee not found
- `422` - Invalid check-in data

## Error Responses

All API endpoints return consistent error responses:

### Validation Error (422)
```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthorized",
  "error": "Token expired or invalid"
}
```

### Not Found (404)
```json
{
  "message": "Not found",
  "error": "The requested resource was not found"
}
```

### Server Error (500)
```json
{
  "message": "Internal server error",
  "error": "Something went wrong on our end"
}
```

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authenticated requests:** 1000 requests per hour per user
- **Public endpoints:** 500 requests per hour per IP
- **Payment endpoints:** 100 requests per hour per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1693334400
```

## Pagination

Paginated endpoints return data in the following format:

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8,
    "has_more": true
  }
}
```

## Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request format
- `401` - Unauthorized: Authentication required or failed
- `403` - Forbidden: Access denied
- `404` - Not Found: Resource not found
- `422` - Unprocessable Entity: Validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## SDK Integration Examples

### JavaScript/React Native

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://staging-api.bole.to',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login example
const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password
  });
  return response.data.data;
};

// Get events example
const getEvents = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (Array.isArray(filters[key])) {
      filters[key].forEach(value => params.append(`${key}[]`, value));
    } else if (filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  
  const response = await apiClient.get(`/api/public/events?${params}`);
  return response.data;
};
```

### Python

```python
import requests
import json

class BoletoAPI:
    def __init__(self, base_url="https://staging-api.bole.to"):
        self.base_url = base_url
        self.token = None
        
    def login(self, email, password):
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "password": password}
        )
        data = response.json()
        self.token = data["data"]["token"]
        return data["data"]
    
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def get_events(self, **filters):
        response = requests.get(
            f"{self.base_url}/api/public/events",
            params=filters,
            headers=self.get_headers()
        )
        return response.json()
```

## Testing

### Test Environment
- **Base URL:** `https://staging-api.bole.to`
- **Stripe:** Test mode with test keys
- **Database:** Staging database with test data

### Test Data
- Test user: `test@bole.to` / `password123`
- Test events with various configurations
- Test payment methods (Stripe test cards)

### Health Check
```http
GET /healthz
```

Returns API health status and version information.

This API reference covers all endpoints implemented and tested in Phase 1 MVP. For additional features or questions, contact the development team.