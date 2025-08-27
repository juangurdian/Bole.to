# Gap Analysis & Mini-RFCs

## Gap 1: Public Event Discovery Endpoint

### Problem
Hi.Events lacks a unified public endpoint for event discovery with search and filtering capabilities. Current options:
- `GET /public/organizers/{id}/events` - Limited to single organizer
- `GET /events` - Requires organizer authentication, account-scoped

### Minimal Proposal
**New Endpoint:** `GET /public/events`

**Query Parameters:**
```
?search=string          // Event title/description search
?city=string            // Filter by city
?category=string        // Filter by category
?date_from=YYYY-MM-DD   // Start date range
?date_to=YYYY-MM-DD     // End date range  
?page=number            // Pagination
?per_page=number        // Items per page (max 50)
?sort=recommended|date|price|popularity
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 123,
      "title": "Event Title",
      "description_preview": "Short description...",
      "start_date": "2024-01-15T19:00:00Z",
      "end_date": "2024-01-15T23:00:00Z", 
      "currency": "USD",
      "slug": "event-slug",
      "location_details": {
        "venue_name": "Venue Name",
        "city": "City Name",
        "address": "Full Address"
      },
      "images": [...],
      "organizer": {
        "id": 456,
        "name": "Organizer Name"
      },
      "price_range": {
        "min": 25.00,
        "max": 100.00
      },
      "availability": {
        "total_capacity": 500,
        "available_tickets": 123
      }
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

**Implementation Notes:**
- Only return `LIVE` status events for public access
- Include only public organizers
- Filter out events with no available tickets
- Implement basic text search on title/description
- Add database indexes for performance

**Risk:** Low - Standard Laravel paginated endpoint
**Impact on UX:** High - Enables core discovery functionality
**ETA:** 2-3 days backend development

---

## Gap 2: User's Orders/Tickets Endpoint

### Problem
No authenticated endpoint for users to retrieve their purchased tickets/orders. Required for "My Tickets" functionality.

### Minimal Proposal
**New Endpoint:** `GET /users/me/orders`

**Query Parameters:**
```
?status=upcoming|past|all   // Filter by event date
?page=number
?per_page=number
```

**Response Format:**
```json
{
  "data": [
    {
      "id": 789,
      "order_short_id": "ORD-ABC123",
      "status": "PAID",
      "total_gross": 75.00,
      "currency": "USD",
      "created_at": "2024-01-10T10:00:00Z",
      "event": {
        "id": 123,
        "title": "Event Title",
        "start_date": "2024-01-15T19:00:00Z",
        "location_details": {...},
        "images": [...]
      },
      "attendees": [
        {
          "id": 456,
          "attendee_short_id": "ATT-XYZ789",
          "first_name": "John",
          "last_name": "Doe", 
          "email": "john@example.com",
          "ticket_reference": "TKT-123456",
          "qr_code": "base64-encoded-qr-code",
          "product": {
            "title": "General Admission",
            "description": "General entry ticket"
          },
          "checked_in": false,
          "checked_in_at": null
        }
      ]
    }
  ],
  "meta": {...}
}
```

**Implementation Notes:**
- Join orders with attendees and event data
- Filter by user's email address or authenticated user ID
- Include QR codes for ticket display
- Filter by event date for upcoming/past categorization
- Include check-in status for each attendee

**Alternative Approach:**
If user management is complex, could use order lookup by email:
`GET /public/orders/by-email/{email}` with email verification

**Risk:** Medium - Need to verify user-order relationship logic
**Impact on UX:** High - Core wallet functionality
**ETA:** 2-3 days backend development

---

## Gap 3: Event Categories Lookup

### Problem
No public endpoint to get available event categories for filtering UI.

### Minimal Proposal  
**New Endpoint:** `GET /public/categories`

**Response Format:**
```json
{
  "data": [
    {
      "id": "music",
      "name": "Music",
      "description": "Concerts, festivals, and music events"
    },
    {
      "id": "sports", 
      "name": "Sports",
      "description": "Sports events and competitions"
    },
    // ... more categories
  ]
}
```

**Implementation Notes:**
- Return static list of predefined categories
- Could be hard-coded or from database table
- Support for localization if needed

**Risk:** Low - Simple static data endpoint
**Impact on UX:** Medium - Improves discovery filtering
**ETA:** 1 day backend development

---

## Gap 4: CORS Configuration for Mobile

### Problem
Hi.Events may not have CORS configured for mobile app API access.

### Minimal Proposal
Update Laravel CORS configuration:

```php
// config/cors.php
return [
    'paths' => ['api/*', 'public/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'exp://*',                    // Expo development
        'http://localhost:*',         // Local development
        'https://*.exp.direct',       // Expo published apps
        'https://your-app.com',       // Production app domain
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'X-Account-ID',              // Custom header for account context
    ],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

**Risk:** Low - Standard CORS setup
**Impact on UX:** Critical - Blocks all API access without proper CORS
**ETA:** 1 hour configuration change

---

## Gap 5: QR Code Generation Format

### Problem
Need to ensure QR codes generated by backend are compatible with mobile scanner.

### Minimal Proposal
Standardize QR code format and ensure attendee endpoint includes QR data:

**QR Code Content Format:**
```
hievents://attendee/{attendee_public_id}?event={event_id}&list={check_in_list_id}
```

**Or JSON format:**
```json
{
  "type": "hievents_attendee",
  "attendee_id": "ATT-XYZ789", 
  "event_id": 123,
  "check_in_list_id": 456,
  "verification": "signature_hash"
}
```

**Backend Changes:**
- Ensure attendee endpoint includes base64-encoded QR code
- QR code should encode attendee_public_id for scanning
- Include QR data in order/attendee responses

**Mobile Changes:**
- QR scanner should parse attendee ID from QR content
- Use attendee ID to call check-in endpoint

**Risk:** Low - Standard QR code implementation
**Impact on UX:** Critical - Core check-in functionality
**ETA:** 1-2 days coordination between backend/mobile

---

## Gap 6: Account Context Handling

### Problem
Hi.Events is multi-tenant but mobile app may not handle account context properly.

### Minimal Proposal
**Backend Changes:**
- Ensure all protected endpoints validate account context
- Add account_id validation to middleware
- Return proper errors for wrong account access

**Mobile Changes:**
- Store selected account_id with JWT token
- Include account context in API calls where needed
- Handle account switching if user belongs to multiple accounts

**Account Selection UI:**
```typescript
// After login, if user has multiple accounts
if (accounts.length > 1) {
  showAccountSelectionModal(accounts);
} else {
  setSelectedAccount(accounts[0]);
}
```

**Risk:** Medium - Multi-tenancy complexity
**Impact on UX:** Medium - May affect organizer users
**ETA:** 2-3 days backend + mobile changes

---

## Gap 7: Offline Payment Handling

### Problem
Mobile app needs to handle offline/cash payment methods for events that support them.

### Minimal Proposal
**Order Flow for Offline Payments:**
1. Create order as normal with `POST /public/events/{id}/order`
2. If offline payment selected, call `POST /public/events/{id}/order/{order_short_id}/await-offline-payment`
3. Order status becomes "AWAITING_OFFLINE_PAYMENT"
4. User receives order confirmation with payment instructions
5. Organizer marks as paid manually via admin interface

**Mobile UI Changes:**
- Add offline payment option in checkout
- Show payment instructions screen for offline orders
- Handle "awaiting payment" status in order list

**Risk:** Low - Endpoint already exists
**Impact on UX:** Medium - Supports events without online payment
**ETA:** 1-2 days mobile development

---

## Gap 8: Error Response Standardization

### Problem
Need consistent error response format for mobile app error handling.

### Minimal Proposal
Ensure all Hi.Events endpoints return errors in consistent format:

```json
{
  "error": {
    "type": "validation_error",
    "message": "The given data was invalid.",
    "errors": {
      "email": ["The email field is required."],
      "password": ["The password must be at least 8 characters."]
    }
  }
}
```

**Common Error Types:**
- `validation_error` - Form validation failures
- `authentication_error` - Invalid credentials  
- `authorization_error` - Insufficient permissions
- `not_found_error` - Resource not found
- `conflict_error` - Business rule violation (e.g., sold out)
- `server_error` - Internal server error

**Risk:** Low - Laravel provides this structure
**Impact on UX:** High - Better error handling UX
**ETA:** 1 day to verify and document

---

## Implementation Priority

1. **CORS Configuration** (Critical - 1 hour)
2. **Public Event Discovery** (High - 2-3 days)
3. **User Orders Endpoint** (High - 2-3 days)  
4. **QR Code Format** (High - 1-2 days)
5. **Account Context** (Medium - 2-3 days)
6. **Event Categories** (Medium - 1 day)
7. **Offline Payments** (Low - 1-2 days)
8. **Error Standardization** (Low - 1 day)

## Next Steps

1. Get stakeholder approval on proposed endpoints
2. Create backend tickets for new endpoint development
3. Coordinate QR code format between backend and mobile teams
4. Set up staging environment with CORS configured for testing
5. Plan parallel development tracks to minimize blocking