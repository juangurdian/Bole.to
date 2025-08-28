# MVP Endpoint Inventory - Hi.Events Backend

## Authentication Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| User Login | POST `/auth/login` | N | `email`, `password`, `account_id?` | JWT token + accounts | - | ✅ Implemented | Multi-tenant support, mobile integrated |
| User Logout | GET/POST `/auth/logout` | Y | - | Success message | - | ✅ Implemented | JWT required |
| Refresh Token | POST `/auth/refresh` | Y | - | New JWT token | - | ✅ Implemented | Auto-refresh in mobile app |
| Register Account | POST `/auth/register` | N | Account + user details | Account + token | - | Ready | Creates account + user |
| Forgot Password | POST `/auth/forgot-password` | N | `email` | Success message | - | Ready | - |
| Reset Password | POST `/auth/reset-password/{token}` | N | `password`, `password_confirmation` | Success message | - | Ready | - |

## User Profile Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Current User | GET `/users/me` | Y | - | User details | - | ✅ Implemented | Mobile profile screen integrated |
| Update Profile | PUT `/users/me` | Y | User fields | Updated user | - | ✅ Implemented | Mobile profile editing working |

## Event Discovery Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Public Event | GET `/public/events/{id}` | N | `promo_code?` | Event details + products | - | ✅ Implemented | Event details screen working |
| Get Events (Organizer) | GET `/events` | Y (Organizer+) | - | Event list | Yes (standard Laravel) | Ready | Account-scoped events |
| Get Organizer Events (Public) | GET `/public/organizers/{id}/events` | N | - | Event list | Yes | Ready | Public organizer events |
| **Get All Events (Public)** | GET `/public/events` | N | Filters: `query`, `category_ids[]`, `city`, `start_date`, `end_date`, `price_min`, `price_max`, `is_free`, pagination | Event list with pagination | Yes | ✅ Implemented | New endpoint for event discovery |

## Product/Ticket Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Event Products | GET `/events/{id}/products` | Y | - | Product list | - | Ready | Organizer access |
| Get Public Event Products | GET `/public/events/{id}/products` | N | - | Event details (includes products) | - | ✅ Implemented | Via GetEventPublic, mobile checkout working |

## Order/Purchase Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Create Order | POST `/public/events/{id}/order` | N | `products[]`, `promo_code?`, `affiliate_code?` | Order details with short_id | - | ✅ Implemented | Mobile checkout creating orders |
| Complete Order | PUT `/public/events/{id}/order/{order_short_id}` | N | Payment details | Completed order | - | Ready | Payment completion |
| Get Order (Public) | GET `/public/events/{id}/order/{order_short_id}` | N | - | Order details | - | ✅ Implemented | Order confirmation screen working |
| Offline Payment | POST `/public/events/{id}/order/{order_short_id}/await-offline-payment` | N | - | Order status | - | Ready | For offline payment methods |
| **Get User Orders** | GET `/users/me/orders` | Y | - | User's order history | Yes | ✅ Implemented | New endpoint for ticket wallet |

## Attendee/Ticket Wallet Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Public Attendee | GET `/public/events/{id}/attendees/{attendee_short_id}` | N | - | Attendee + ticket details | - | Ready | Ticket display |
| Get Event Attendees | GET `/events/{id}/attendees` | Y (Organizer) | - | Attendee list | Yes | Ready | For organizers |

## Check-in/QR Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Check-in List | GET `/public/check-in-lists/{short_id}` | N | - | Check-in list details | - | Ready | Public check-in lists |
| Get List Attendees | GET `/public/check-in-lists/{short_id}/attendees` | N | - | Attendee list | Yes | Ready | For check-in |
| Create Check-in | POST `/public/check-in-lists/{short_id}/check-ins` | N | `attendee_public_id` | Check-in record | - | Ready | QR scan endpoint |
| Delete Check-in | DELETE `/public/check-in-lists/{short_id}/check-ins/{check_in_short_id}` | N | - | Success | - | Ready | Undo check-in |

## Payment Integration Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Create Payment Intent | POST `/public/events/{id}/order/{order_short_id}/stripe/payment_intent` | N | Order details | Stripe client_secret + payment intent | - | ✅ Implemented | Mobile Stripe integration working |
| Get Payment Intent | GET `/public/events/{id}/order/{order_short_id}/stripe/payment_intent` | N | - | Payment intent status | - | ✅ Implemented | Payment status verification working |

## Promo Code Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Promo Code | GET `/public/events/{id}/promo-codes/{code}` | N | - | Promo code details | - | Ready | Validation & discount info |

## Question/Survey Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Public Questions | GET `/public/events/{id}/questions` | N | - | Question list | - | Ready | Event registration questions |
| **Get Event Categories** | GET `/public/categories` | N | - | Category list | - | ✅ Implemented | New endpoint for event categorization |

## Organizer Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Public Organizer | GET `/public/organizers/{id}` | N | - | Organizer details | - | Ready | Public organizer info |
| Contact Organizer | POST `/public/organizers/{id}/contact` | N | Message details | Success | - | Ready | Contact form |

## Media/Images Endpoints

| Feature | Endpoint | Auth | Request Params | Response | Pagination/Filters | Status | Notes |
|---------|----------|------|----------------|----------|-------------------|--------|-------|
| Get Event Images | GET `/events/{id}/images` | Y | - | Image list | - | Ready | Event gallery |

## Notes on Authentication & Authorization

- **JWT-based auth** via `auth:api` middleware
- **Role-based access** with minimum role requirements (User, Organizer, etc.)
- **Account scoping** - users access only their account's resources
- **Public endpoints** under `/public` prefix don't require auth
- **Multi-tenancy** via `account_id` parameter and context

## Notes on Response Formats

- **Laravel Resources** used for consistent response formatting
- **Standard Laravel pagination** on list endpoints
- **Consistent error responses** via ResponseCodes class
- **Public vs Private resources** - different response shapes for public consumption

## Phase 1 Implementation Complete ✅

All critical MVP endpoints have been implemented and integrated with the mobile app:

**✅ Completed in Phase 1:**
1. ✅ **Event Search/Filter** - `/api/public/events` with comprehensive filtering
2. ✅ **My Orders/Tickets** - `/api/users/me/orders` endpoint integrated
3. ✅ **Event Categories** - `/api/public/categories` endpoint available
4. ✅ **Stripe Payment Flow** - Complete payment intent integration
5. ✅ **Mobile Authentication** - JWT auth with account selection
6. ✅ **Event Discovery** - Full event browsing with filters
7. ✅ **Ticket Wallet** - User ticket management interface

**Ready for Phase 2:**
- User Registration flow (separate from account creation)
- QR Check-in system endpoints (available, mobile integration pending)
- Advanced event management features
- Social features and messaging systems