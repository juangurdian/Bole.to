# API Endpoint Testing Guide

## New Endpoints Implemented for Mobile MVP

### 1. Public Events Discovery
**Endpoint:** `GET /api/public/events`

**Query Parameters:**
- `search=string` - Search in event title/description
- `city=string` - Filter by city in location_details
- `category=string` - Filter by event category (MUSIC, SPORTS, etc.)
- `date_from=YYYY-MM-DD` - Start date range
- `date_to=YYYY-MM-DD` - End date range  
- `sort=recommended|date|price|popularity` - Sort options
- `page=number` - Pagination page
- `per_page=number` - Items per page (max 50)

**Example Request:**
```bash
GET /api/public/events?search=concert&city=New%20York&category=MUSIC&date_from=2025-01-01&sort=date&page=1&per_page=20
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 123,
      "title": "Concert Event",
      "description_preview": "Amazing music event...",
      "start_date": "2025-01-15T19:00:00Z",
      "end_date": "2025-01-15T23:00:00Z",
      "currency": "USD",
      "slug": "concert-event",
      "location_details": {...},
      "images": [...],
      "organizer": {...},
      "price_range": {"min": 25.00, "max": 100.00},
      "availability": {"total_capacity": 500, "available_tickets": 123},
      "category": "MUSIC"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  }
}
```

### 2. User Orders (Tickets)
**Endpoint:** `GET /api/users/me/orders`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
- `status=upcoming|past|all` - Filter by event date status
- `page=number` - Pagination page
- `per_page=number` - Items per page (max 50)

**Example Request:**
```bash
GET /api/users/me/orders?status=upcoming&page=1&per_page=10
Authorization: Bearer {jwt-token}
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 456,
      "short_id": "ORD123",
      "total_gross": 75.00,
      "currency": "USD",
      "status": "COMPLETED",
      "payment_status": "PAYMENT_RECEIVED",
      "created_at": "2025-01-01T12:00:00Z",
      "event": {
        "id": 123,
        "title": "Concert Event",
        "start_date": "2025-02-15T19:00:00Z",
        "location_details": {...}
      },
      "tickets": [...],
      "qr_codes": [
        {
          "attendee_id": 789,
          "attendee_short_id": "ATT456",
          "first_name": "John",
          "last_name": "Doe",
          "qr_code_content": "ATT456",
          "qr_code_url": "/api/public/events/123/attendees/ATT456"
        }
      ]
    }
  ]
}
```

### 3. Event Categories
**Endpoint:** `GET /api/public/categories`

**Example Request:**
```bash
GET /api/public/categories
```

**Response Format:**
```json
{
  "data": [
    {
      "value": "MUSIC",
      "label": "Music",
      "emoji": "🎵"
    },
    {
      "value": "SPORTS", 
      "label": "Sports",
      "emoji": "⚽"
    }
  ]
}
```

## Testing with cURL

### Test Events Discovery
```bash
curl -X GET "http://localhost:8000/api/public/events?search=music&sort=date&per_page=5" \
  -H "Accept: application/json"
```

### Test User Orders (requires authentication)
```bash
curl -X GET "http://localhost:8000/api/users/me/orders?status=upcoming" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Categories
```bash
curl -X GET "http://localhost:8000/api/public/categories" \
  -H "Accept: application/json"
```

## Database Migration Required

Run the migration to add search indexes:
```bash
php artisan migrate
```

## Notes

1. **CORS Configuration**: Already configured to allow mobile app access
2. **Pagination**: All endpoints support pagination with `page` and `per_page` parameters
3. **Validation**: All endpoints include proper request validation
4. **Security**: Public endpoints only return LIVE events, user orders require authentication
5. **Performance**: Database indexes added for efficient searching and filtering