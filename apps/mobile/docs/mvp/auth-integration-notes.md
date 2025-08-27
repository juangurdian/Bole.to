# Auth Integration Notes

## JWT Authentication Flow

### Hi.Events JWT Implementation
Hi.Events uses JWT tokens via the `auth:api` middleware with the following characteristics:

**Login Endpoint:** `POST /auth/login`
**Token Refresh:** `POST /auth/refresh` 
**User Info:** `GET /users/me`

### Token Structure & Claims
Based on Laravel JWT implementation, tokens likely contain:
```json
{
  "iss": "hi-events",
  "sub": "user_id", 
  "aud": "api",
  "exp": 1234567890,
  "iat": 1234567890,
  "account_id": 123,
  "role": "user|organizer|admin"
}
```

### Multi-Tenant Architecture
Hi.Events implements multi-tenancy via `account_id`:
- Users can belong to multiple accounts
- Login response includes available accounts
- Account context is required for protected endpoints
- Account switching may require re-authentication

## Mobile App Integration Strategy

### Recommended Architecture: Direct API Calls
**Decision:** Call Hi.Events API directly (no Gateway initially)

**Rationale:**
1. Simpler implementation for MVP
2. Fewer moving parts and points of failure
3. Hi.Events API is designed for direct consumption
4. Gateway can be added later for aggregation/caching

### Token Storage & Management

```typescript
// Secure token storage
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'hievents_jwt_token';
const ACCOUNT_KEY = 'hievents_account_id';

// Store token after login
await SecureStore.setItemAsync(TOKEN_KEY, jwt_token);
await SecureStore.setItemAsync(ACCOUNT_KEY, account_id.toString());

// Retrieve token for API calls  
const token = await SecureStore.getItemAsync(TOKEN_KEY);
const accountId = await SecureStore.getItemAsync(ACCOUNT_KEY);
```

### API Client Configuration

```typescript
// API client with automatic token attachment
const apiClient = axios.create({
  baseURL: process.env.HIEVENTS_API_URL,
  timeout: 10000,
});

// Request interceptor for authentication
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const accountId = await SecureStore.getItemAsync(ACCOUNT_KEY);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add account context for protected endpoints
  if (accountId && config.url?.includes('/events')) {
    config.headers['X-Account-ID'] = accountId;
  }
  
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      try {
        const refreshResponse = await apiClient.post('/auth/refresh');
        const newToken = refreshResponse.data.access_token;
        
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await clearAuthTokens();
        // Navigate to login screen
      }
    }
    return Promise.reject(error);
  }
);
```

## Authentication Context Provider

```typescript
interface AuthContextType {
  user: User | null;
  account: Account | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, accountId?: number) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (accountId: number) => Promise<void>;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  
  const login = async (email: string, password: string, accountId?: number) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      account_id: accountId
    });
    
    const { access_token, user, accounts } = response.data;
    
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    
    // Handle multiple accounts
    if (accounts.length > 1 && !accountId) {
      // Show account selection UI
      setAvailableAccounts(accounts);
      return;
    }
    
    const selectedAccount = accountId 
      ? accounts.find(a => a.id === accountId)
      : accounts[0];
      
    await SecureStore.setItemAsync(ACCOUNT_KEY, selectedAccount.id.toString());
    
    setUser(user);
    setAccount(selectedAccount);
  };
  
  // ... other auth methods
};
```

## Endpoint-Specific Auth Requirements

### Public Endpoints (No Auth Required)
```
GET  /public/events/{id}
GET  /public/organizers/{id}
POST /public/events/{id}/order
POST /public/organizers/{id}/contact
GET  /public/check-in-lists/{id}
POST /public/check-in-lists/{id}/check-ins
```

### User Endpoints (User Role+)
```
GET  /users/me
PUT  /users/me  
POST /auth/refresh
GET  /auth/logout
```

### Organizer Endpoints (Organizer Role+)
```
GET  /events
POST /events
PUT  /events/{id}
GET  /events/{id}/attendees
GET  /events/{id}/orders
POST /events/{id}/products
```

### Account-Scoped Endpoints
Most protected endpoints are scoped to the authenticated user's account:
- Events are filtered by account_id
- Orders and attendees are account-specific
- User can only access data within their account context

## Roles & Permissions Matrix

| Feature | Anonymous | User | Organizer | Admin |
|---------|-----------|------|-----------|-------|
| Browse Events | ✅ | ✅ | ✅ | ✅ |
| Purchase Tickets | ✅ | ✅ | ✅ | ✅ |
| View My Profile | ❌ | ✅ | ✅ | ✅ |
| My Tickets | ❌ | ✅ | ✅ | ✅ |
| Create Events | ❌ | ❌ | ✅ | ✅ |
| Manage Events | ❌ | ❌ | ✅ | ✅ |
| Check-in Attendees | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |

## Error Handling Patterns

### Authentication Errors
```typescript
// 401 Unauthorized - Token expired/invalid
if (error.response?.status === 401) {
  if (error.config.url?.includes('/auth/refresh')) {
    // Refresh failed, logout user
    await logout();
  } else {
    // Try to refresh token
    await refreshToken();
  }
}

// 403 Forbidden - Insufficient permissions
if (error.response?.status === 403) {
  showError('You do not have permission for this action');
}
```

### Account Context Errors
```typescript
// Handle account switching
const switchAccount = async (accountId: number) => {
  await SecureStore.setItemAsync(ACCOUNT_KEY, accountId.toString());
  
  // Refresh user context with new account
  const userResponse = await apiClient.get('/users/me');
  setUser(userResponse.data);
  
  // Clear any cached data that's account-specific
  queryClient.invalidateQueries(['events']);
  queryClient.invalidateQueries(['orders']);
};
```

## Security Considerations

### Token Security
- Store tokens in secure storage only (no AsyncStorage)
- Clear tokens completely on logout
- Implement token refresh before expiration
- Don't log tokens in development

### API Security  
- Implement certificate pinning for production
- Validate SSL certificates
- Set appropriate timeout values
- Rate limiting awareness

### Account Security
- Verify account access on sensitive operations
- Clear account context on user switch
- Validate account permissions client-side (UX only)

## CORS Configuration

Backend CORS setup needed for mobile app:

```php
// config/cors.php
'allowed_origins' => [
    'exp://*',      // Expo development
    'http://localhost:*', 
    'https://your-app-domain.com',
],

'allowed_headers' => [
    'Content-Type',
    'Authorization', 
    'X-Account-ID',
    'Accept',
],

'supports_credentials' => false,
```

## Testing Strategy

### Authentication Testing
- [ ] Login with valid credentials
- [ ] Login with invalid credentials  
- [ ] Multi-account selection flow
- [ ] Token refresh functionality
- [ ] Logout clears all tokens
- [ ] Account switching works correctly

### Authorization Testing
- [ ] Protected endpoints require auth
- [ ] Role-based access works
- [ ] Account-scoped data isolation
- [ ] Proper error messages for unauthorized access

### Edge Cases
- [ ] Network failure during auth
- [ ] Token expiry during app usage
- [ ] Multiple login attempts
- [ ] Account deletion while logged in
- [ ] Password reset flow