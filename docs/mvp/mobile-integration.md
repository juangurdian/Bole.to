# Bole.to Mobile App Integration Guide

This guide shows how to integrate the React Native/Expo mobile app with the staging API infrastructure.

## Overview

The mobile app integration involves:
1. Updating API configuration to use staging endpoints
2. Implementing proper authentication handling
3. Setting up network request handling
4. Configuring CORS for development environments
5. Testing the complete integration

## API Configuration

### Update Base URL

Replace the mock API base URL with the staging gateway URL:

```typescript
// src/api/index.tsx - Update base URL
const API_BASE_URL = 'https://staging-api.bole.to';

// For development, you might want to use environment variables
const API_BASE_URL = __DEV__ 
  ? process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.bole.to'
  : 'https://api.bole.to';
```

### Environment Configuration

Create environment-specific configuration files:

**app.config.ts**:
```typescript
export default {
  expo: {
    name: "Bole.to",
    slug: "bole-to",
    // ... other config
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.bole.to',
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'staging',
    },
  },
};
```

**.env.staging**:
```env
EXPO_PUBLIC_API_URL=https://staging-api.bole.to
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_DEBUG=true
```

**.env.production**:
```env
EXPO_PUBLIC_API_URL=https://api.bole.to
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG=false
```

## Authentication Implementation

### Update Auth Service

Replace the mock authentication with real JWT handling:

```typescript
// src/auth/gateway-auth-service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://staging-api.bole.to';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  timezone?: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  data: {
    token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

class GatewayAuthService {
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const result: AuthResponse = await response.json();
    
    // Store token
    this.token = result.data.token;
    await AsyncStorage.setItem('auth_token', result.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(result.data.user));

    return result;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    // Add timezone if not provided
    if (!userData.timezone) {
      userData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const result: AuthResponse = await response.json();
    
    // Store token
    this.token = result.data.token;
    await AsyncStorage.setItem('auth_token', result.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(result.data.user));

    return result;
  }

  async logout(): Promise<void> {
    const token = await this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
    }

    // Clear local storage
    this.token = null;
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);
  }

  async refreshToken(): Promise<string> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('No token available for refresh');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Token refresh failed, user needs to login again
      await this.logout();
      throw new Error('Token refresh failed');
    }

    const result: AuthResponse = await response.json();
    
    this.token = result.data.token;
    await AsyncStorage.setItem('auth_token', result.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(result.data.user));

    return result.data.token;
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }

    this.token = await AsyncStorage.getItem('auth_token');
    return this.token;
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async fetchCurrentUser(): Promise<User> {
    const token = await this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.logout();
        throw new Error('Token expired');
      }
      throw new Error('Failed to fetch user data');
    }

    const result = await response.json();
    await AsyncStorage.setItem('user_data', JSON.stringify(result.data));
    
    return result.data;
  }
}

export const gatewayAuthService = new GatewayAuthService();
```

### Update Auth Context

Update the useAuth hook to use the real authentication service:

```typescript
// src/auth/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { gatewayAuthService, User, LoginCredentials, RegisterData } from './gateway-auth-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      const isAuthenticated = await gatewayAuthService.isAuthenticated();
      if (isAuthenticated) {
        // Try to get cached user data first
        const cachedUser = await gatewayAuthService.getCurrentUser();
        if (cachedUser) {
          setUser(cachedUser);
        }
        
        // Then fetch fresh user data in background
        try {
          const freshUser = await gatewayAuthService.fetchCurrentUser();
          setUser(freshUser);
        } catch (error) {
          console.warn('Failed to refresh user data:', error);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await gatewayAuthService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await gatewayAuthService.login(credentials);
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await gatewayAuthService.register(userData);
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await gatewayAuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state anyway
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await gatewayAuthService.fetchCurrentUser();
      setUser(freshUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## API Client Implementation

### Create API Client

Create a centralized API client with authentication and error handling:

```typescript
// src/api/client.ts
import Constants from 'expo-constants';
import { gatewayAuthService } from '../auth/gateway-auth-service';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://staging-api.bole.to';

export interface APIResponse<T = any> {
  data: T;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface APIError {
  success: false;
  error: {
    message: string;
    code: string;
    requestId: string;
    details?: any;
  };
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add authentication header if available
    const token = await gatewayAuthService.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        try {
          const newToken = await gatewayAuthService.refreshToken();
          // Retry request with new token
          headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }
          
          return await retryResponse.json();
        } catch (refreshError) {
          // Token refresh failed, user needs to login
          await gatewayAuthService.logout();
          throw new Error('Authentication expired');
        }
      }

      if (!response.ok) {
        const errorData: APIError = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Network request failed') {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = await gatewayAuthService.getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData: APIError = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

export const apiClient = new APIClient(API_BASE_URL);
```

### API Service Examples

Create service classes for different API endpoints:

```typescript
// src/api/events.ts
import { apiClient, APIResponse } from './client';

export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  timezone: string;
  status: string;
  currency: string;
  settings: {
    location_details: {
      venue_name: string;
      address_line_1: string;
      city: string;
      state_or_region: string;
      zip_or_postal_code: string;
      country: string;
    };
  };
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  is_available: boolean;
}

class EventsService {
  // Get public event
  async getPublicEvent(eventId: number): Promise<Event> {
    const response = await apiClient.get<APIResponse<Event>>(`/api/public/events/${eventId}`);
    return response.data;
  }

  // Get event products (tickets)
  async getEventProducts(eventId: number): Promise<Product[]> {
    const response = await apiClient.get<APIResponse<Product[]>>(`/api/public/events/${eventId}/products`);
    return response.data;
  }

  // Get user's events (authenticated)
  async getMyEvents(page = 1, perPage = 15): Promise<{ events: Event[]; meta: any }> {
    const response = await apiClient.get<APIResponse<Event[]>>('/api/events', {
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return { events: response.data, meta: response.meta };
  }

  // Create event (authenticated)
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const response = await apiClient.post<APIResponse<Event>>('/api/events', eventData);
    return response.data;
  }
}

export const eventsService = new EventsService();
```

## Error Handling

### Global Error Handler

Create a global error handler for API errors:

```typescript
// src/utils/errorHandler.ts
import { Alert } from 'react-native';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export const handleAPIError = (error: any): AppError => {
  console.error('API Error:', error);

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error.message) {
    // Handle specific error types
    if (error.message.includes('Network error')) {
      return {
        message: 'Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
      };
    }

    if (error.message.includes('Authentication expired')) {
      return {
        message: 'Your session has expired. Please log in again.',
        code: 'AUTH_EXPIRED',
      };
    }

    return { message: error.message };
  }

  return { message: 'An unexpected error occurred. Please try again.' };
};

export const showErrorAlert = (error: AppError) => {
  Alert.alert(
    'Error',
    error.message,
    [{ text: 'OK', style: 'default' }],
    { cancelable: true }
  );
};
```

## Testing Integration

### Development Testing

1. **Start Expo Development Server**:
   ```bash
   cd apps/mobile
   npm start
   ```

2. **Test with Physical Device**:
   - Install Expo Go app
   - Scan QR code
   - Test login/registration flows
   - Verify API calls in network inspector

3. **Test with Simulator**:
   ```bash
   npm run ios  # or npm run android
   ```

### Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Registration creates new account
- [ ] Token refresh works automatically
- [ ] Logout clears authentication state
- [ ] Protected routes require authentication
- [ ] Network errors are handled gracefully
- [ ] App works offline (cached data)

## Network Configuration for Development

### Expo Configuration

Update your Expo configuration to handle development networking:

```typescript
// app.config.ts
export default {
  expo: {
    name: "Bole.to",
    slug: "bole-to",
    scheme: "boleto",
    platforms: ["ios", "android"],
    version: "1.0.0",
    
    // Network configuration for development
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.bole.to',
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'staging',
    },
    
    // iOS configuration
    ios: {
      bundleIdentifier: "com.boleto.app",
      buildNumber: "1",
    },
    
    // Android configuration
    android: {
      package: "com.boleto.app",
      versionCode: 1,
      // Allow HTTP traffic for development
      usesCleartextTraffic: true,
    },
  },
};
```

### Network Security (iOS)

For iOS development, you may need to allow HTTP traffic in development:

Create `ios/boleto/Info.plist` additions:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- Or more specific for staging only -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>staging-api.bole.to</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
        </dict>
    </dict>
</dict>
```

## Performance Optimization

### Caching Strategy

Implement basic caching for API responses:

```typescript
// src/utils/cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private prefix = 'api_cache_';

  async set<T>(key: string, data: T, ttlMinutes = 5): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    
    await AsyncStorage.setItem(
      `${this.prefix}${key}`,
      JSON.stringify(cacheItem)
    );
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() > (cacheItem.timestamp + cacheItem.ttl);
      
      if (isExpired) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.prefix}${key}`);
  }

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
    await AsyncStorage.multiRemove(cacheKeys);
  }
}

export const cache = new SimpleCache();
```

## Deployment Configuration

### Update App Configuration for Production

```typescript
// src/config/environment.ts
import Constants from 'expo-constants';

interface Environment {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
}

const getEnvironment = (): Environment => {
  const env = Constants.expoConfig?.extra?.environment || 'staging';
  
  switch (env) {
    case 'production':
      return {
        apiUrl: 'https://api.bole.to',
        environment: 'production',
        debug: false,
      };
    case 'staging':
      return {
        apiUrl: 'https://staging-api.bole.to',
        environment: 'staging',
        debug: true,
      };
    default:
      return {
        apiUrl: Constants.expoConfig?.extra?.apiUrl || 'https://staging-api.bole.to',
        environment: 'development',
        debug: true,
      };
  }
};

export const config = getEnvironment();
```

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure your development environment is included in gateway CORS configuration
   - Check that requests include proper headers

2. **Authentication Issues**:
   - Verify token storage and retrieval
   - Check token expiration handling
   - Ensure refresh token logic works

3. **Network Issues**:
   - Test API endpoints with curl/Postman first
   - Check device network permissions
   - Verify staging API is accessible

### Debug Tips

1. **Enable Network Logging**:
   ```typescript
   // Add to your API client for debugging
   console.log('API Request:', { url, options });
   console.log('API Response:', response);
   ```

2. **Check AsyncStorage**:
   ```typescript
   // Debug storage contents
   AsyncStorage.getAllKeys().then(keys => {
     console.log('Stored keys:', keys);
   });
   ```

3. **Monitor Health Endpoint**:
   ```bash
   # Check if staging API is healthy
   curl https://staging-api.bole.to/healthz
   ```

---

*This completes the mobile app integration with the staging infrastructure. The app should now be able to authenticate users and make API calls to the real Hi.Events backend through the gateway service.*