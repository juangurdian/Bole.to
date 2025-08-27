# MVP Wiring Plan & Priorities

## P1 (This Week) - Direct Integration Ready

### 1. Authentication Flow
**Scope:** Login, logout, profile management
**Endpoints:** `POST /auth/login`, `GET /users/me`, `POST /auth/refresh`
**Acceptance Criteria:**
- [ ] Replace MockAuthProvider with Hi.Events JWT auth
- [ ] Store JWT token securely using expo-secure-store
- [ ] Handle multi-tenant account selection
- [ ] Implement token refresh mechanism
- [ ] Update API client to include Authorization header

**Test Steps:**
1. User can login with valid email/password
2. JWT token is stored and persists across app restarts
3. Authenticated API calls include valid token
4. Token refresh works before expiration
5. Logout clears stored token

**Owner:** Mobile team
**Estimate:** 2-3 days

### 2. Event Details & Purchase
**Scope:** View event details, see ticket types, create orders
**Endpoints:** `GET /public/events/{id}`, `POST /public/events/{id}/order`
**Acceptance Criteria:**
- [ ] EventScreen displays real event data
- [ ] Product/ticket types render correctly  
- [ ] Order creation works with real validation
- [ ] Handle sold out and capacity limits
- [ ] Display proper error messages

**Test Steps:**
1. Navigate to event from any list view
2. Event details load (title, description, dates, venue)
3. Ticket types display with prices and availability
4. Can select quantity and create order
5. Order creation handles validation errors
6. Success flow navigates to checkout

**Owner:** Mobile team
**Estimate:** 2-3 days

### 3. QR Check-in System
**Scope:** Staff QR scanning and manual lookup
**Endpoints:** `GET /public/check-in-lists/{id}`, `POST /public/check-in-lists/{id}/check-ins`
**Acceptance Criteria:**
- [ ] Staff can access check-in lists
- [ ] QR codes scan and validate attendees
- [ ] Manual lookup finds attendees by name/email
- [ ] Check-in status updates immediately
- [ ] Handle duplicate check-ins gracefully

**Test Steps:**
1. Staff can select event/check-in list
2. QR scanner reads attendee QR codes
3. Valid QR codes check in successfully
4. Invalid/used QR codes show appropriate errors
5. Manual search finds attendees
6. Check-in list updates in real-time

**Owner:** Mobile team  
**Estimate:** 3-4 days

### 4. Basic Profile Management
**Scope:** View and edit user profile
**Endpoints:** `GET /users/me`, `PUT /users/me`
**Acceptance Criteria:**
- [ ] Profile screen shows user data
- [ ] Can edit basic profile fields
- [ ] Changes save successfully
- [ ] Handle validation errors

**Test Steps:**
1. Profile screen loads current user data
2. Edit mode allows field changes
3. Save button updates profile
4. Validation errors display correctly
5. Success state shows updated data

**Owner:** Mobile team
**Estimate:** 1-2 days

## P2 (Next Sprint) - Minor Backend Changes

### 5. Event Discovery & Search
**Problem:** No unified public event discovery endpoint
**Backend Changes Needed:**
- Create `GET /public/events` endpoint with filtering
- Support query params: `city`, `category`, `date_range`, `search`
- Implement pagination
- Add event categories endpoint

**Acceptance Criteria:**
- [ ] Backend: New public events discovery endpoint
- [ ] Backend: Event categories lookup endpoint  
- [ ] Mobile: Update DiscoverScreen to use real API
- [ ] Mobile: Implement search and filtering
- [ ] Mobile: Handle empty states and pagination

**Test Steps:**
1. Discover screen loads events by city
2. Filters work (category, date, price)
3. Text search finds relevant events
4. Pagination loads more events
5. Empty states show when no results

**Owner:** Backend team → Mobile team
**Estimate:** Backend: 3-4 days, Mobile: 2-3 days

### 6. My Tickets/Orders Endpoint
**Problem:** No authenticated endpoint for user's orders/tickets
**Backend Changes Needed:**
- Create `GET /users/me/orders` endpoint
- Return orders with attendee/ticket details
- Support filtering by status (upcoming, past)
- Include QR codes and ticket display data

**Acceptance Criteria:**
- [ ] Backend: My orders endpoint with proper filtering
- [ ] Mobile: TicketsScreen uses real data
- [ ] Mobile: Display tickets with QR codes
- [ ] Mobile: Handle empty states (no tickets)
- [ ] Mobile: Navigate to individual ticket details

**Test Steps:**
1. Tickets screen loads user's orders
2. Upcoming/past filtering works
3. Individual tickets display correctly
4. QR codes render and are scannable
5. Ticket details show event info

**Owner:** Backend team → Mobile team  
**Estimate:** Backend: 2-3 days, Mobile: 2 days

### 7. Order Completion & Payment
**Scope:** Complete Stripe payment integration
**Endpoints:** `POST /public/events/{id}/order/{order_short_id}/stripe/payment_intent`
**Backend Changes Needed:**
- Ensure CORS headers for mobile app
- Test Stripe integration from mobile
- Handle payment webhooks properly

**Acceptance Criteria:**
- [ ] Backend: CORS configured for mobile app
- [ ] Mobile: Stripe payment sheet integration
- [ ] Mobile: Handle payment success/failure flows
- [ ] Mobile: Navigate to order confirmation
- [ ] Backend: Webhook processing completes orders

**Test Steps:**
1. Order creation returns payment_intent
2. Stripe payment sheet displays correctly
3. Test payment succeeds and completes order
4. Failed payment shows error and allows retry
5. Order confirmation shows purchase details

**Owner:** Backend team + Mobile team
**Estimate:** 3-4 days

## P3 (Future Iterations) - Complex Features

### 8. Advanced Event Management
**Scope:** Full organizer dashboard functionality
**Status:** Most endpoints exist, need UI polish
**Estimate:** 1-2 weeks

### 9. Promo Codes & Discounts  
**Scope:** Apply promo codes during checkout
**Status:** Backend ready, need checkout integration
**Estimate:** 2-3 days

### 10. Event Questions & Custom Fields
**Scope:** Registration questions during ticket purchase
**Status:** Backend ready, need checkout flow updates
**Estimate:** 3-4 days

### 11. Social Features (Out of Scope for Hi.Events)
**Status:** Would require separate microservice
**Recommendation:** Defer until post-MVP

## Implementation Strategy

### Week 1: Core Authentication & Event Details
- Implement JWT authentication flow
- Wire up event details and basic purchasing
- Set up proper API client with auth headers

### Week 2: Check-in System & Profile
- Complete QR scanning functionality
- Staff check-in workflows
- Basic profile management

### Week 3: Discovery & My Tickets
- Backend changes for event discovery
- User's tickets/orders endpoint
- Complete ticket wallet functionality

### Week 4: Payment Integration & Polish
- Stripe payment completion
- Error handling improvements
- End-to-end testing

## Technical Implementation Notes

### API Client Setup
```typescript
// Replace mock API with real Hi.Events client
const apiClient = axios.create({
  baseURL: 'https://your-hievents-domain.com/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling Strategy
- Network errors: Show retry UI
- Validation errors: Display field-specific messages  
- Auth errors: Redirect to login
- Payment errors: Allow retry with different method
- Server errors: Show generic error with support contact

### Testing Strategy
- Unit tests for API client integration
- Integration tests for critical flows
- Manual testing on both iOS and Android
- Test with real Stripe payment methods (test mode)
- Test offline/network failure scenarios

## Success Metrics

### Technical Metrics
- [ ] All P1 endpoints successfully integrated
- [ ] JWT authentication flow working
- [ ] Payment success rate > 95%
- [ ] QR check-in success rate > 98%
- [ ] App crash rate < 1%

### User Experience Metrics
- [ ] Event details load in < 2 seconds
- [ ] Checkout completion rate > 80%
- [ ] Staff check-in process < 10 seconds per attendee
- [ ] User can find and purchase tickets end-to-end

## Risk Mitigation

### High Risk Areas
1. **Payment Integration** - Test thoroughly with Stripe test mode
2. **Multi-tenant Auth** - Ensure account context is preserved
3. **QR Code Generation** - Verify compatibility between backend and mobile scanner
4. **CORS Configuration** - Must be set up correctly for mobile app

### Contingency Plans
1. **Payment Failures** - Implement offline payment flow as backup
2. **Auth Issues** - Maintain mock auth as fallback during development
3. **API Downtime** - Implement proper offline states and caching
4. **Backend Delays** - Prioritize most critical endpoints first