# UI ↔ API Connectivity Matrix

## Authentication & User Profile

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **LoginScreen** | User logs in with email/password | `POST /auth/login` | N | Invalid credentials, network errors | ✅ **Implemented** | Multi-tenant account selection working |
| **Profile/NewProfileScreen** | User views their profile | `GET /users/me` | Y (JWT) | Unauthenticated, load errors | ✅ **Implemented** | Profile screen fully integrated |
| **SignupScreen** | User creates account | `POST /auth/register` | N | Validation errors, email exists | **Ready** | Account creation flow available |

## Event Discovery & Browse

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **DiscoverScreen** | Browse public events with filters | `GET /public/events` | N | No events, network error | ✅ **Implemented** | Event discovery with filters working |
| **Home/EventsNearYouSection** | See events near user location | `GET /public/events?city={city}` | N | No nearby events | ✅ **Implemented** | Location-based event filtering |
| **Discover/EventCard** | View event summary in list | Part of event list response | N | Image load failures | ✅ **Implemented** | Event cards rendering properly |
| **DiscoverHeader** | Search events by text/filters | `GET /public/events?query={query}` | N | No results | ✅ **Implemented** | Text search and filters working |

## Event Details & Purchase

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **EventScreen** | View event details & tickets | `GET /public/events/{id}` | N | Event not found, private | ✅ **Implemented** | Event details fully working |
| **EventScreen (Products)** | See available ticket types | Included in event response | N | Sold out, no tickets | ✅ **Implemented** | Ticket types displaying correctly |
| **CheckoutScreen** | Purchase tickets | `POST /public/events/{id}/order` | N | Validation, payment errors | ✅ **Implemented** | Order creation and validation working |
| **CheckoutScreen (Payment)** | Complete payment | Stripe Payment Intent API | N | Payment failures | ✅ **Implemented** | Full Stripe integration with native UI |

## Ticket Wallet & Management

| UI Screen/Component | User Story | API Call(s) | Auth Needed | Error/Empty States | Immediate Wiring | Gaps & Fixes |
|---------------------|------------|-------------|-------------|-------------------|------------------|--------------|
| **TicketsScreen** | View my purchased tickets | `GET /users/me/orders` | Y | No tickets | ✅ **Implemented** | Ticket wallet fully functional |
| **Wallet/TicketScreen** | View individual ticket with QR | From user orders response | Y | Invalid ticket | ✅ **Implemented** | Individual ticket display working |
| **TicketsScreen (Past/Upcoming)** | Filter tickets by date | Client-side filtering | Y | Empty sections | ✅ **Implemented** | Date-based filtering implemented |

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
const api = useApi(); // Now uses realApiService with staging-api.bole.to
const { data } = useQuery({
  queryKey: ["event", id],
  queryFn: () => api.getEvent(id)
});
```

### Authentication Context
```typescript
const { user, isAuthenticated } = useAuth();
// Now using RealAuthProvider with JWT authentication
```

### Error Handling Patterns
- Network errors via React Query
- Empty states for no data
- Loading skeletons
- Retry mechanisms

## Priority Wiring Assessment

### ✅ P1 (Completed - Phase 1 MVP)
- ✅ **Login/Auth** - JWT authentication with account selection working
- ✅ **Event Details** - Event details screen fully integrated
- ✅ **Ticket Purchase** - Complete order creation and Stripe payment flow
- ✅ **Event Discovery** - Unified public events endpoint with search and filters
- ✅ **My Tickets** - User orders endpoint integrated with ticket wallet
- ✅ **Profile Management** - User profile viewing and editing working

### Ready for P2 (Next Phase)
- **QR Check-in** - Backend endpoints ready, mobile integration pending
- **Advanced Event Management** - Organizer features available
- **Promo Codes** - Backend support ready for checkout integration

### P3 (Future Enhancements)
- **Social Features** - Requires separate microservice
- **Payment Methods Storage** - Enhanced payment management
- **Advanced Analytics** - Event and sales reporting features

## Authentication Strategy

**Recommended Approach:**
1. **Direct Hi.Events Auth** for MVP - Use JWT tokens from `/auth/login`
2. **Store JWT** in secure storage (expo-secure-store)
3. **Account Context** - Handle multi-tenant account_id in auth flow
4. **Token Refresh** - Use `/auth/refresh` endpoint

Gateway service at `https://staging-api.bole.to` is operational and handling all mobile API requests with proper CORS configuration.