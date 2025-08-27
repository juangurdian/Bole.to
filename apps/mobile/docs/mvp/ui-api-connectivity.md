# UI ↔ API Connectivity Matrix

## Authentication & User Profile

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **LoginScreen** | User logs in with email/password | `POST /auth/login` | N | Invalid credentials, network errors | **Yes** | Need to handle multi-tenant `account_id` |
| **Profile/NewProfileScreen** | User views their profile | `GET /users/me` | Y (JWT) | Unauthenticated, load errors | **Yes** | Direct mapping available |
| **SignupScreen** | User creates account | `POST /auth/register` | N | Validation errors, email exists | **Partial** | Need account creation flow vs user-only |

## Event Discovery & Browse

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **DiscoverScreen** | Browse public events with filters | `GET /public/organizers/{id}/events` | N | No events, network error | **Partial** | Need unified event discovery endpoint |
| **Home/EventsNearYouSection** | See events near user location | Custom endpoint needed | N | No nearby events | **No** | Missing public event search/filter API |
| **Discover/EventCard** | View event summary in list | Part of event list response | N | Image load failures | **Yes** | Map response to UI expectations |
| **DiscoverHeader** | Search events by text/filters | Search endpoint needed | N | No results | **No** | Missing text search endpoint |

## Event Details & Purchase

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **EventScreen** | View event details & tickets | `GET /public/events/{id}` | N | Event not found, private | **Yes** | Direct mapping available |
| **EventScreen (Products)** | See available ticket types | Included in event response | N | Sold out, no tickets | **Yes** | Products included in EventResourcePublic |
| **CheckoutScreen** | Purchase tickets | `POST /public/events/{id}/order` | N | Validation, payment errors | **Yes** | Order creation ready |
| **CheckoutScreen (Payment)** | Complete payment | `PUT /public/events/{id}/order/{order_short_id}` + Stripe | N | Payment failures | **Yes** | Stripe integration available |

## Ticket Wallet & Management

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **TicketsScreen** | View my purchased tickets | Need authenticated endpoint | Y | No tickets | **No** | Missing "my orders/tickets" endpoint |
| **Wallet/TicketScreen** | View individual ticket with QR | `GET /public/events/{id}/attendees/{attendee_short_id}` | N | Invalid ticket | **Yes** | Public attendee endpoint available |
| **TicketsScreen (Past/Upcoming)** | Filter tickets by date | Client-side filtering | Y | Empty sections | **Partial** | Need my tickets endpoint first |

## QR Check-in & Scanning

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **Staff/ScannerScreen** | Scan QR codes to check in attendees | `POST /public/check-in-lists/{short_id}/check-ins` | N | Invalid QR, already checked in | **Yes** | Public check-in endpoint available |
| **Staff/ManualLookupScreen** | Manual attendee lookup | `GET /public/check-in-lists/{short_id}/attendees` | N | Not found | **Yes** | Attendee search available |
| **Staff/EventPickerScreen** | Select event for check-in | `GET /public/check-in-lists/{short_id}` | N | No access | **Partial** | Need to get check-in lists for event |

## Social & Communication  

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **Feed/NewFeedScreen** | View social feed for events | Social endpoints needed | Y? | No posts | **No** | Hi.Events doesn't include social features |
| **Social/PostComposer** | Create posts for events | Social endpoints needed | Y | Post failed | **No** | Not available in Hi.Events |
| **Messages/MessagesListScreen** | Contact event organizers | `POST /public/organizers/{id}/contact` | N | Send failed | **Yes** | Organizer contact available |

## Event Management (Organizer)

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **MyEvents/MyEventsScreen** | Organizer views their events | `GET /events` | Y (Organizer) | No events | **Yes** | Organizer events endpoint ready |
| **MyEvents/EventEditorWizard** | Create/edit events | `POST /events`, `PUT /events/{id}` | Y (Organizer) | Validation errors | **Yes** | Full CRUD available |
| **MyEvents/ProductEditorScreen** | Manage ticket types | `GET/POST/PUT /events/{id}/products` | Y (Organizer) | Save failed | **Yes** | Product CRUD available |

## Payment Methods

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **Payment/PaymentMethodsScreen** | View saved payment methods | User payment methods needed | Y | No methods | **No** | Hi.Events doesn't store user payment methods |
| **Payment/AddPaymentMethodScreen** | Add new payment method | User payment methods needed | Y | Add failed | **No** | Not available in Hi.Events |

## Settings & Configuration

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **Settings/SettingsScreen** | Manage app preferences | `GET/PUT /users/me` | Y | Load/save failed | **Yes** | User preferences in profile |
| **Settings/NotificationsScreen** | Configure notifications | User preferences needed | Y | Save failed | **Partial** | May need custom notification settings |

## Key Integration Patterns in Current UI

### Mock API Usage
```typescript
const api = useApi(); // Currently uses mockApi
const { data } = useQuery({
  queryKey: ["event", id],
  queryFn: () => api.getEvent(id)
});
```

### Authentication Context
```typescript
const { user, isAuthenticated } = useAuth();
// Currently using MockAuthProvider
```

### Error Handling Patterns
- Network errors via React Query
- Empty states for no data
- Loading skeletons
- Retry mechanisms

## Priority Wiring Assessment

### P1 (Immediate - This Week)
- **Login/Auth** - Direct mapping to Hi.Events auth
- **Event Details** - Public event endpoint ready
- **Ticket Purchase** - Order creation flow ready
- **QR Check-in** - Public check-in endpoints ready

### P2 (Minor Changes Needed)
- **Event Discovery** - Need unified public search endpoint
- **My Tickets** - Need authenticated tickets endpoint
- **Profile Management** - Map user fields correctly

### P3 (Deferred/Complex)
- **Social Features** - Not in Hi.Events, may need separate service
- **Payment Methods Storage** - Not in Hi.Events core
- **Advanced Search** - May need elasticsearch integration

## Authentication Strategy

**Recommended Approach:**
1. **Direct Hi.Events Auth** for MVP - Use JWT tokens from `/auth/login`
2. **Store JWT** in secure storage (expo-secure-store)
3. **Account Context** - Handle multi-tenant account_id in auth flow
4. **Token Refresh** - Use `/auth/refresh` endpoint

No Gateway service needed initially - mobile app can call Hi.Events API directly with proper CORS configuration.