# Hi.Events Backend - Complete Developer Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [File/Folder Map](#file-folder-map)
3. [Runbook](#runbook)
4. [API Inventory](#api-inventory)
5. [Domain & Data Model](#domain-data-model)
6. [Check-in/Scanner Flow](#check-in-scanner-flow)
7. [Payments & Webhooks](#payments-webhooks)
8. [Security & Permissions](#security-permissions)
9. [Jobs, Events, Schedules](#jobs-events-schedules)
10. [Testing & Quality](#testing-quality)
11. [Config Reference & Tuning](#config-reference-tuning)
12. [Gaps, Risks, and Questions](#gaps-risks-questions)
13. [Recommended Integration Plan](#recommended-integration-plan)
14. [Artifacts](#artifacts)

---

## 1. Executive Summary

**Hi.Events** is a mature, production-ready Laravel 12 (PHP 8.2+) ticketing and event management platform. The repository contains a monorepo structure with separate backend (Laravel API) and frontend (React/Vite) applications.

### Main Modules
- **Event Management**: Full lifecycle event creation, publishing, and management
- **Ticketing/Products**: Flexible product system supporting tickets and merchandise
- **Order Processing**: Complete checkout flow with Stripe integration
- **Attendee Management**: Registration, check-ins, QR codes
- **Organizer System**: Multi-tenant organizer accounts with branding
- **Messaging**: Email communication system for attendees
- **Analytics**: Real-time sales and event statistics
- **Webhooks**: Outgoing webhooks for event notifications

### Maturity Level
- Production-ready with Docker support
- Full test coverage structure (PHPUnit)
- Multi-language support (11 languages)
- SAAS mode available with Stripe Connect
- Enterprise features: capacity assignments, check-in lists, affiliates

### Major Dependencies
- **Framework**: Laravel 12.x
- **Database**: PostgreSQL with pgTrigram extensions
- **Cache/Queue**: Redis
- **Payments**: Stripe (Connect support)
- **Auth**: JWT (php-open-source-saver/jwt-auth)
- **Storage**: S3-compatible (MinIO in dev)
- **Email**: SMTP/Mailer support
- **Export**: Excel (maatwebsite/excel)
- **PDF**: DomPDF for invoices

### Ready to Use
- Complete API with 100+ endpoints
- Docker all-in-one setup
- Database migrations and schema
- JWT authentication
- Stripe payment integration

### Needs Configuration
- Stripe API keys and webhook secrets
- S3/storage credentials
- Email SMTP settings
- JWT secret generation
- Database connection

---

## 2. File/Folder Map

```
/backend/
├── app/                          # Application code
│   ├── Console/                  # CLI commands
│   │   └── Kernel.php           # Scheduled tasks configuration
│   ├── DataTransferObjects/     # DTOs for data transfer
│   ├── DomainObjects/           # Domain entities (100+ models)
│   │   ├── Enums/               # Domain enumerations
│   │   ├── Generated/           # Auto-generated abstract classes
│   │   └── Status/              # Status constants
│   ├── Events/                  # Laravel event classes
│   ├── Exceptions/              # Custom exceptions
│   ├── Exports/                 # Excel export classes
│   ├── Http/
│   │   ├── Actions/             # Controller actions (1 per endpoint)
│   │   │   ├── Accounts/        # Account management
│   │   │   ├── Affiliates/      # Affiliate tracking
│   │   │   ├── Attendees/       # Attendee operations
│   │   │   ├── Auth/            # Authentication/authorization
│   │   │   ├── CheckInLists/    # Check-in management
│   │   │   ├── Events/          # Event CRUD
│   │   │   ├── Orders/          # Order processing
│   │   │   ├── Organizers/      # Organizer management
│   │   │   ├── Products/        # Product/ticket management
│   │   │   ├── Questions/       # Custom questions
│   │   │   └── Webhooks/        # Webhook management
│   │   ├── Middleware/          # HTTP middleware
│   │   └── Request/             # Form request validation
│   ├── Jobs/                    # Queued jobs
│   ├── Listeners/               # Event listeners
│   ├── Mail/                    # Email templates
│   ├── Models/                  # Eloquent models
│   ├── Providers/               # Service providers
│   ├── Repository/              # Repository pattern
│   │   ├── Eloquent/            # Concrete implementations
│   │   └── Interfaces/          # Repository contracts
│   └── Services/                # Business logic services (79 services)
│       ├── Domain/              # Domain services
│       └── Infrastructure/     # Infrastructure services
├── bootstrap/                   # Laravel bootstrap
├── config/                      # Configuration files
│   ├── app.php                 # App config
│   ├── auth.php                # JWT auth config
│   ├── cors.php                # CORS settings
│   ├── database.php            # DB connections
│   ├── filesystems.php         # S3/storage config
│   ├── jwt.php                 # JWT settings
│   ├── mail.php                # Email config
│   └── webhook-server.php      # Webhook config
├── database/
│   ├── migrations/              # 40+ migration files
│   │   ├── schema.sql          # Initial schema
│   │   └── extensions.sql      # PostgreSQL extensions
│   ├── factories/              # Model factories
│   └── seeders/                # Database seeders
├── docker/                      # Docker configurations
├── lang/                        # Translations (11 languages)
├── public/                      # Public assets
├── resources/
│   └── views/                   # Blade templates (invoices)
├── routes/
│   ├── api.php                  # API routes (100+ endpoints)
│   ├── web.php                  # Web routes
│   └── mail.php                 # Email preview routes
├── storage/                     # File storage
├── tests/                       # Test suites
├── .env.example                 # Environment template
├── artisan                      # CLI entry point
├── composer.json                # PHP dependencies
└── phpunit.xml                  # Test configuration
```

---

## 3. Runbook

### Prerequisites
- **PHP**: 8.2+ with extensions: intl, pgsql, redis, gd
- **Composer**: 2.x
- **PostgreSQL**: 14+ with pgTrigram extension
- **Redis**: 6+
- **Node.js**: 18+ (for frontend assets)
- **Docker**: 20+ (optional but recommended)

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/HiEventsDev/hi.events.git
cd hi.events

# Use all-in-one Docker setup
cd docker/all-in-one
cp .env.example .env

# Configure essential variables in .env:
# - APP_KEY (generate with: php artisan key:generate)
# - JWT_SECRET (generate random 64-char string)
# - STRIPE_PUBLIC_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET

# Start services
docker-compose up -d

# Access at http://localhost:8123
```

### Manual Setup

```bash
# Install dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Database setup
createdb hi_events
psql hi_events -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
php artisan migrate

# Storage setup
php artisan storage:link

# Queue worker (separate terminal)
php artisan queue:work

# Scheduler (cron or separate terminal)
php artisan schedule:work

# Start server
php artisan serve --port=8000
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **APP_KEY** | ✅ | - | Laravel encryption key |
| **APP_DEBUG** | ❌ | false | Debug mode |
| **APP_URL** | ✅ | http://localhost | Backend URL |
| **APP_FRONTEND_URL** | ✅ | - | Frontend URL |
| **JWT_SECRET** | ✅ | - | JWT signing key |
| **DB_CONNECTION** | ✅ | pgsql | Database driver |
| **DB_HOST** | ✅ | localhost | Database host |
| **DB_PORT** | ❌ | 5432 | Database port |
| **DB_DATABASE** | ✅ | - | Database name |
| **DB_USERNAME** | ✅ | - | Database user |
| **DB_PASSWORD** | ✅ | - | Database password |
| **REDIS_HOST** | ✅ | localhost | Redis host |
| **STRIPE_PUBLIC_KEY** | ✅ | - | Stripe publishable key |
| **STRIPE_SECRET_KEY** | ✅ | - | Stripe secret key |
| **STRIPE_WEBHOOK_SECRET** | ✅ | - | Stripe webhook signing |
| **MAIL_MAILER** | ✅ | smtp | Mail driver |
| **MAIL_HOST** | ✅ | - | SMTP host |
| **MAIL_FROM_ADDRESS** | ✅ | - | From email |
| **AWS_ACCESS_KEY_ID** | ❌ | - | S3 access key |
| **AWS_SECRET_ACCESS_KEY** | ❌ | - | S3 secret |
| **AWS_PUBLIC_BUCKET** | ❌ | - | Public files bucket |
| **AWS_PRIVATE_BUCKET** | ❌ | - | Private files bucket |
| **QUEUE_CONNECTION** | ❌ | sync | Queue driver (redis recommended) |
| **APP_SAAS_MODE_ENABLED** | ❌ | false | Enable SAAS features |

### Health Checks
- **API**: `GET /` - Returns Laravel version
- **Database**: `php artisan migrate:status`
- **Redis**: `redis-cli ping`
- **Queue**: `php artisan queue:monitor`

---

## 4. API Inventory

### Authentication & Users

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/auth/login` | - | Login with email/password |
| **POST** | `/auth/logout` | auth:api | Logout user |
| **POST** | `/auth/register` | - | Create new account |
| **POST** | `/auth/forgot-password` | - | Request password reset |
| **POST** | `/auth/reset-password/{token}` | - | Reset password |
| **POST** | `/auth/refresh` | auth:api | Refresh JWT token |
| **GET** | `/users/me` | auth:api | Get current user |
| **PUT** | `/users/me` | auth:api | Update current user |
| **POST** | `/users` | auth:api | Create user (admin) |
| **GET** | `/users` | auth:api | List users |

### Events

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/events` | auth:api | Create event |
| **GET** | `/events` | auth:api | List events |
| **GET** | `/events/{event_id}` | auth:api | Get event details |
| **PUT** | `/events/{event_id}` | auth:api | Update event |
| **PUT** | `/events/{event_id}/status` | auth:api | Update event status |
| **POST** | `/events/{event_id}/duplicate` | auth:api | Duplicate event |
| **GET** | `/public/events/{event_id}` | - | Get public event |

### Products (Tickets)

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/events/{event_id}/products` | auth:api | Create product |
| **GET** | `/events/{event_id}/products` | auth:api | List products |
| **GET** | `/events/{event_id}/products/{id}` | auth:api | Get product |
| **PUT** | `/events/{event_id}/products/{id}` | auth:api | Update product |
| **DELETE** | `/events/{event_id}/products/{id}` | auth:api | Delete product |
| **POST** | `/events/{event_id}/products/sort` | auth:api | Reorder products |

### Orders

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/public/events/{event_id}/order` | - | Create order |
| **PUT** | `/public/events/{event_id}/order/{order_id}` | - | Complete order |
| **GET** | `/public/events/{event_id}/order/{order_id}` | - | Get order status |
| **GET** | `/events/{event_id}/orders` | auth:api | List orders |
| **PUT** | `/events/{event_id}/orders/{id}` | auth:api | Edit order |
| **POST** | `/events/{event_id}/orders/{id}/refund` | auth:api | Refund order |
| **POST** | `/events/{event_id}/orders/{id}/cancel` | auth:api | Cancel order |

### Attendees

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **GET** | `/events/{event_id}/attendees` | auth:api | List attendees |
| **POST** | `/events/{event_id}/attendees` | auth:api | Create attendee |
| **GET** | `/events/{event_id}/attendees/{id}` | auth:api | Get attendee |
| **PUT** | `/events/{event_id}/attendees/{id}` | auth:api | Update attendee |
| **POST** | `/events/{event_id}/attendees/{id}/check_in` | auth:api | Check in attendee |
| **POST** | `/events/{event_id}/attendees/{id}/resend-ticket` | auth:api | Resend ticket |

### Check-in Lists

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/events/{event_id}/check-in-lists` | auth:api | Create list |
| **GET** | `/events/{event_id}/check-in-lists` | auth:api | List check-in lists |
| **GET** | `/public/check-in-lists/{short_id}` | - | Get public list |
| **GET** | `/public/check-in-lists/{id}/attendees` | - | List attendees |
| **POST** | `/public/check-in-lists/{id}/check-ins` | - | Check in attendee |
| **DELETE** | `/public/check-in-lists/{id}/check-ins/{id}` | - | Undo check-in |

### Payment (Stripe)

| Method | Path | Middleware | Description |
|--------|------|------------|-------------|
| **POST** | `/public/events/{id}/order/{id}/stripe/payment_intent` | - | Create payment intent |
| **GET** | `/public/events/{id}/order/{id}/stripe/payment_intent` | - | Get payment intent |
| **POST** | `/public/webhooks/stripe` | - | Stripe webhook endpoint |
| **POST** | `/accounts/{id}/stripe/connect` | auth:api | Setup Stripe Connect |

### Authentication
- **Type**: JWT Bearer Token
- **Header**: `Authorization: Bearer {token}`
- **Token TTL**: 120 minutes (configurable)
- **Refresh endpoint**: `/auth/refresh`

### Response Format
```json
{
  "data": {},      // Main response data
  "meta": {        // Pagination/metadata
    "current_page": 1,
    "total": 100,
    "per_page": 50
  }
}
```

### Error Format
```json
{
  "message": "Validation failed",
  "errors": {
    "field": ["Error message"]
  }
}
```

---

## 5. Domain & Data Model

### Core Entities

#### Account
- **Fields**: id, name, email, currency_code, timezone, stripe_account_id
- **Relations**: has many Users, Events, Organizers
- **Notes**: Multi-tenant root entity

#### User
- **Fields**: id, email, first_name, last_name, password, timezone
- **Relations**: belongs to Account, has many Events
- **Notes**: JWT authentication

#### Organizer
- **Fields**: id, name, email, website, description, currency, timezone
- **Relations**: belongs to Account, has many Events
- **Notes**: Event organizer profile

#### Event
- **Fields**: id, title, start_date, end_date, location, status, short_id
- **Relations**: belongs to Organizer, has many Products, Orders
- **Notes**: Main event entity

#### Product (formerly Ticket)
- **Fields**: id, title, type, sale_start_date, sale_end_date, order
- **Relations**: belongs to Event, has many Prices
- **Types**: TICKET, MERCHANDISE, DONATION

#### Order
- **Fields**: id, short_id, status, payment_status, total_gross, currency
- **Relations**: belongs to Event, has many OrderItems, Attendees
- **Statuses**: RESERVED, COMPLETED, CANCELLED, EXPIRED

#### Attendee
- **Fields**: id, first_name, last_name, email, public_id, ticket_id
- **Relations**: belongs to Order, has CheckIns
- **Notes**: Individual ticket holder

#### CheckIn
- **Fields**: id, checked_in_at, checked_in_by, check_in_list_id
- **Relations**: belongs to Attendee
- **Notes**: Tracks check-in history

### Entity Relationship Diagram

```mermaid
erDiagram
    Account ||--o{ User : has
    Account ||--o{ Organizer : has
    Account ||--o{ Event : owns
    Organizer ||--o{ Event : manages
    Event ||--o{ Product : contains
    Event ||--o{ Order : receives
    Event ||--o{ Question : has
    Event ||--o{ PromoCode : offers
    Event ||--o{ CheckInList : has
    Product ||--o{ ProductPrice : has
    Product }o--o{ TaxAndFee : applies
    Order ||--o{ OrderItem : contains
    Order ||--o{ Attendee : generates
    Order }o--|| PromoCode : uses
    Order ||--|| StripePayment : pays_via
    Attendee }o--o{ CheckIn : records
    Attendee }o--o{ QuestionAnswer : provides
    CheckInList }o--o{ Product : includes
    Question ||--o{ QuestionAnswer : collects
```

---

## 6. Check-in/Scanner Flow

### Check-in Process
1. **Scanner App Access**: GET `/public/check-in-lists/{short_id}`
2. **Fetch Attendees**: GET `/public/check-in-lists/{id}/attendees`
3. **Scan QR/Search**: Attendee public_id encoded in QR
4. **Validate Ticket**: GET `/public/check-in-lists/{id}/attendees/{public_id}`
5. **Record Check-in**: POST `/public/check-in-lists/{id}/check-ins`
6. **Undo if needed**: DELETE `/public/check-in-lists/{id}/check-ins/{id}`

### Offline Sync Support
- **Bulk Export**: Download all attendees for offline use
- **Delta Sync**: Track check-ins with timestamps
- **Batch Upload**: POST multiple check-ins when online
- **Conflict Resolution**: Server timestamp wins

### Key Files
- `app/Services/Domain/CheckInList/CreateAttendeeCheckInService.php`
- `app/Services/Domain/CheckInList/CheckInListDataService.php`
- `app/Http/Actions/CheckInLists/Public/*`

### Security
- Check-in lists have unique short_ids (no auth required for scanning)
- Duplicate check-in prevention
- Check-in history tracking
- Optional capacity limits

---

## 7. Payments & Webhooks

### Stripe Integration

#### Payment Flow
1. Create order with products
2. Generate payment intent
3. Process payment client-side
4. Webhook confirms payment
5. Order marked complete
6. Tickets generated and sent

#### Webhook Events Handled
- `payment_intent.succeeded` - Complete order
- `payment_intent.payment_failed` - Mark failed
- `charge.refunded` - Process refund
- `account.updated` - Stripe Connect updates

#### Key Files
- `app/Services/Domain/Payment/Stripe/*`
- `app/Http/Actions/Orders/Payment/Stripe/*`
- `app/Http/Actions/Common/Webhooks/StripeIncomingWebhookAction.php`

### Outgoing Webhooks
- **Events**: order.completed, attendee.checked_in, order.refunded
- **Format**: JSON POST with HMAC signature
- **Retry**: 3 attempts with exponential backoff
- **Management**: Via API endpoints

### Payment States
- **AWAITING_PAYMENT**: Initial state
- **PAYMENT_RECEIVED**: Stripe confirmed
- **PARTIALLY_REFUNDED**: Some items refunded
- **FULLY_REFUNDED**: Complete refund
- **OFFLINE_PAYMENT**: Manual payment pending

---

## 8. Security & Permissions

### Authentication
- **JWT Bearer tokens** with 2-hour TTL
- **Refresh tokens** for session extension
- **Email verification** required for accounts
- **Password reset** via email tokens

### Middleware Stack
```php
'auth:api'        // JWT authentication
'throttle:60,1'   // Rate limiting
'cors'            // CORS headers
'verified'        // Email verified
```

### Authorization
- **Account-level isolation**: Multi-tenant data separation
- **Role-based access**: Via account_users pivot
- **Resource ownership**: User must own resource
- **Public endpoints**: Explicitly marked routes

### Data Protection
- **Password hashing**: Bcrypt
- **Sensitive fields**: Excluded from JSON
- **SQL injection**: Eloquent ORM protection
- **XSS**: HTMLPurifier for user content
- **CSRF**: Token validation

---

## 9. Jobs, Events, Schedules

### Queued Jobs
```php
// Email Jobs
SendOrderDetailsEmailJob::class
SendEventEmailJob::class
SendMessagesJob::class

// Statistics
UpdateEventStatisticsJob::class
UpdateEventPageViewsJob::class

// Export
ExportAnswersJob::class
```

### Event Listeners
```php
OrderStatusChangedEvent => [
    CreateInvoiceListener,
    SendOrderDetailsEmailListener,
    WebhookEventListener
]

EventUpdateEvent => [
    UpdateEventStatsListener
]
```

### Scheduled Tasks (app/Console/Kernel.php)
```php
// Hourly
$schedule->job(UpdateEventStatisticsJob::class)->hourly();

// Daily
$schedule->command('orders:expire')->daily();
$schedule->command('webhooks:cleanup')->daily();
```

---

## 10. Testing & Quality

### Test Structure
```
tests/
├── Feature/       # Integration tests
│   ├── Auth/     # Authentication flows
│   ├── Events/   # Event operations
│   └── Orders/   # Order processing
└── Unit/         # Unit tests
    ├── Services/ # Service tests
    └── Models/   # Model tests
```

### Running Tests
```bash
# All tests
php artisan test

# Specific suite
php artisan test --testsuite=Feature

# With coverage
php artisan test --coverage
```

### Code Quality
- **Linting**: Laravel Pint (`composer lint`)
- **Static Analysis**: None configured
- **Standards**: PSR-12

---

## 11. Config Reference & Tuning

### Cache Configuration
```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
    ]
]
```

### Queue Configuration
```php
// config/queue.php
'default' => env('QUEUE_CONNECTION', 'redis'),
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'queue' => 'default',
        'retry_after' => 90,
    ]
]
```

### Production Tuning
```env
# Performance
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Security
APP_DEBUG=false
APP_ENV=production

# Optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 12. Gaps, Risks, and Questions

### Identified Gaps
1. **No API versioning** - All endpoints under single version
2. **Limited webhook retry configuration** - Fixed 3 attempts
3. **No built-in seat selection** - Only capacity limits
4. **Missing waitlist functionality**
5. **No native mobile SDK**

### Technical Risks
1. **Single point of failure** - No multi-region support
2. **Timezone handling** - Complex date conversions
3. **Currency conversion** - Manual rates needed
4. **Large event scalability** - Untested beyond 10k attendees

### Questions for Maintainers
1. What's the maximum tested concurrent users?
2. Is there a roadmap for API v2?
3. Are there plans for GraphQL support?
4. What's the backup/disaster recovery strategy?
5. Any known issues with specific payment regions?

---

## 13. Recommended Integration Plan

### Frontend Integration Strategy

#### 1. TypeScript SDK Generation
```typescript
// Generate from OpenAPI spec
npx openapi-typescript openapi.yml --output ./src/api/types.ts

// Create typed client
import { HiEventsClient } from './hi-events-sdk';
const client = new HiEventsClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  auth: { token: localStorage.getItem('jwt') }
});
```

#### 2. Core Integration Points

**Discovery Flow**
```typescript
// List events
GET /public/organizers/{id}/events
// Event details  
GET /public/events/{id}
// Available tickets
GET /public/events/{id}/products
```

**Checkout Flow**
```typescript
// Create order
POST /public/events/{id}/order
// Create payment intent
POST /public/events/{id}/order/{id}/stripe/payment_intent
// Complete order
PUT /public/events/{id}/order/{id}
```

**Post-Purchase**
```typescript
// Get tickets
GET /public/events/{id}/attendees/{id}
// Download invoice
GET /public/events/{id}/order/{id}/invoice
```

#### 3. Mock First Approach
- Use MSW for API mocking
- Implement UI with mock data
- Gradually replace with real endpoints

#### 4. Missing Endpoints to Add
If these features are needed, propose to maintainers:
- `GET /api/v1/events/search` - Full-text search
- `GET /api/v1/attendees/delta` - Delta sync for offline
- `POST /api/v1/orders/bulk-check-in` - Batch check-ins
- `WebSocket /events/{id}/live` - Real-time updates

---

## 14. Artifacts

### OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Hi.Events API
  version: 1.0.0
  description: Event management and ticketing platform API
servers:
  - url: https://api.hi.events
    description: Production
  - url: http://localhost:8000
    description: Local
security:
  - bearerAuth: []
paths:
  /auth/login:
    post:
      tags: [Authentication]
      summary: User login
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  format: password
      responses:
        200:
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  token_type:
                    type: string
                    enum: [bearer]
                  expires_in:
                    type: integer
  
  /events:
    get:
      tags: [Events]
      summary: List events
      operationId: listEvents
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: per_page
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, PUBLISHED, ARCHIVED]
      responses:
        200:
          description: Events list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Event'
                  meta:
                    $ref: '#/components/schemas/Pagination'
    
    post:
      tags: [Events]
      summary: Create event
      operationId: createEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EventInput'
      responses:
        201:
          description: Event created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'

  /public/events/{event_id}/order:
    post:
      tags: [Orders]
      summary: Create order
      operationId: createOrder
      parameters:
        - name: event_id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [products, attendees]
              properties:
                products:
                  type: array
                  items:
                    type: object
                    properties:
                      product_id:
                        type: integer
                      quantity:
                        type: integer
                      price_id:
                        type: integer
                attendees:
                  type: array
                  items:
                    type: object
                    properties:
                      first_name:
                        type: string
                      last_name:
                        type: string
                      email:
                        type: string
                promo_code:
                  type: string
      responses:
        201:
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    Event:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        short_id:
          type: string
        start_date:
          type: string
          format: date-time
        end_date:
          type: string
          format: date-time
        location:
          type: string
        status:
          type: string
          enum: [DRAFT, PUBLISHED, ARCHIVED]
        organizer:
          $ref: '#/components/schemas/Organizer'
    
    EventInput:
      type: object
      required: [title, organizer_id]
      properties:
        title:
          type: string
        description:
          type: string
        start_date:
          type: string
          format: date-time
        end_date:
          type: string
          format: date-time
        location:
          type: string
        organizer_id:
          type: integer
    
    Order:
      type: object
      properties:
        id:
          type: integer
        short_id:
          type: string
        status:
          type: string
          enum: [RESERVED, COMPLETED, CANCELLED]
        payment_status:
          type: string
          enum: [AWAITING_PAYMENT, PAYMENT_RECEIVED, REFUNDED]
        total_gross:
          type: number
        currency:
          type: string
        attendees:
          type: array
          items:
            $ref: '#/components/schemas/Attendee'
    
    Attendee:
      type: object
      properties:
        id:
          type: integer
        public_id:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        email:
          type: string
        ticket:
          $ref: '#/components/schemas/Product'
    
    Product:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        type:
          type: string
          enum: [TICKET, MERCHANDISE, DONATION]
        prices:
          type: array
          items:
            $ref: '#/components/schemas/ProductPrice'
    
    ProductPrice:
      type: object
      properties:
        id:
          type: integer
        price:
          type: number
        label:
          type: string
    
    Organizer:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
        website:
          type: string
    
    Pagination:
      type: object
      properties:
        current_page:
          type: integer
        per_page:
          type: integer
        total:
          type: integer
        last_page:
          type: integer
```

### Postman Collection

```json
{
  "info": {
    "name": "Hi.Events API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.environment.set('jwt_token', jsonData.access_token);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@hi.events\",\n  \"password\": \"password\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Events",
      "item": [
        {
          "name": "List Events",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/events",
              "host": ["{{base_url}}"],
              "path": ["events"]
            }
          }
        },
        {
          "name": "Create Event",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Sample Event\",\n  \"organizer_id\": 1,\n  \"start_date\": \"2025-01-01T10:00:00Z\",\n  \"end_date\": \"2025-01-01T18:00:00Z\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/events",
              "host": ["{{base_url}}"],
              "path": ["events"]
            }
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Order",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"products\": [\n    {\n      \"product_id\": 1,\n      \"quantity\": 2,\n      \"price_id\": 1\n    }\n  ],\n  \"attendees\": [\n    {\n      \"first_name\": \"John\",\n      \"last_name\": \"Doe\",\n      \"email\": \"john@example.com\"\n    }\n  ]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/public/events/1/order",
              "host": ["{{base_url}}"],
              "path": ["public", "events", "1", "order"]
            }
          }
        }
      ]
    }
  ]
}
```

### Database ER Diagram (Mermaid)

```mermaid
erDiagram
    accounts ||--o{ users : has
    accounts ||--o{ organizers : owns
    accounts ||--o{ events : manages
    accounts ||--o{ taxes_and_fees : defines
    accounts ||--|| account_configuration : configures
    
    users ||--o{ events : creates
    users ||--o{ messages : sends
    
    organizers ||--o{ events : hosts
    organizers ||--|| organizer_settings : has
    
    events ||--o{ products : offers
    events ||--o{ orders : receives
    events ||--o{ questions : asks
    events ||--o{ promo_codes : provides
    events ||--o{ messages : sends
    events ||--o{ affiliates : tracks
    events ||--o{ check_in_lists : defines
    events ||--o{ capacity_assignments : limits
    events ||--o{ webhooks : notifies
    events ||--|| event_settings : configures
    events ||--|| event_statistics : tracks
    events ||--o{ event_daily_statistics : aggregates
    
    products ||--o{ product_prices : has
    products ||--o{ product_questions : asks
    products }o--o{ taxes_and_fees : applies
    products }o--|| product_categories : belongs_to
    products }o--o{ check_in_lists : included_in
    products }o--o{ capacity_assignments : limited_by
    
    orders ||--o{ order_items : contains
    orders ||--o{ attendees : generates
    orders ||--|| stripe_payments : paid_via
    orders }o--|| promo_codes : uses
    orders ||--o{ order_refunds : tracks
    orders ||--|| invoices : generates
    
    attendees ||--o{ attendee_check_ins : records
    attendees }o--o{ question_answers : provides
    
    questions ||--o{ question_answers : collects
    
    check_in_lists }o--o{ products : includes
    
    webhooks ||--o{ webhook_logs : logs
```

---

## Summary

Hi.Events is a robust, production-ready event management platform built on Laravel 12. The backend provides a comprehensive REST API with 100+ endpoints covering the full event lifecycle from creation to check-in. 

**Key Strengths:**
- Complete event management solution
- Production-ready with Docker support
- Stripe integration with Connect support
- Multi-language support
- Flexible product system
- Comprehensive check-in functionality

**Integration Readiness:**
- ✅ Complete API available
- ✅ JWT authentication implemented
- ✅ WebHook support for real-time updates
- ✅ Public endpoints for customer-facing operations
- ⚠️ No official SDK (generate from OpenAPI)
- ⚠️ No WebSocket support (polling required)

**Recommended Next Steps:**
1. Set up local development environment with Docker
2. Generate TypeScript types from OpenAPI spec
3. Create thin SDK wrapper for common operations
4. Implement mock-first development approach
5. Gradually integrate real endpoints
6. Add monitoring and error tracking

The platform is mature and well-architected for building custom frontends. The separation of public and authenticated endpoints makes it straightforward to build both customer-facing and admin interfaces.