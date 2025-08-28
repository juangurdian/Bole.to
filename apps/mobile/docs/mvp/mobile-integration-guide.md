# Mobile Integration Guide - Bole.to Phase 1 MVP

## Overview

This guide provides comprehensive instructions for integrating with the Bole.to API in React Native mobile applications. The Phase 1 MVP includes complete authentication, event discovery, ticket purchasing, and payment processing capabilities.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Authentication Integration](#authentication-integration)
3. [API Client Setup](#api-client-setup)
4. [Event Discovery](#event-discovery)
5. [Ticket Purchase Flow](#ticket-purchase-flow)
6. [Payment Integration](#payment-integration)
7. [User Ticket Management](#user-ticket-management)
8. [Error Handling](#error-handling)
9. [Testing Guide](#testing-guide)
10. [Deployment Checklist](#deployment-checklist)

## Setup & Configuration

### Dependencies

Install the required packages for API integration:

```bash
npm install axios @stripe/stripe-react-native @react-native-async-storage/async-storage expo-secure-store react-query
```

### Environment Configuration

Create environment-specific configuration files:

**config/staging.ts:**
```typescript
export const config = {
  API_BASE_URL: 'https://staging-api.bole.to',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_...' // Your Stripe test key
};
```

**config/production.ts:**
```typescript
export const config = {
  API_BASE_URL: 'https://api.bole.to',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_...' // Your Stripe live key
};
```

## Authentication Integration

### Token Storage

Implement secure token storage using Expo SecureStore:

**auth/token.ts:**
```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const ACCOUNT_KEY = 'selected_account';

export const storeToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const storeUser = async (user: any): Promise<void> => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const removeUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_KEY);
};
```

### Authentication Service

Create a service to handle authentication logic:

**auth/authService.ts:**
```typescript
import { httpClient } from '../api/httpClient';
import { storeToken, storeUser, getToken, getUser } from './token';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  accounts: Account[];
}

export interface Account {
  id: number;
  name: string;
  slug: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  accounts: Account[];
}

export interface TokenResponse {
  token: string;
  account: Account;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/api/auth/login', {
      email,
      password
    });

    // Store token and user data
    await storeToken(response.token);
    await storeUser(response.user);

    return response;
  }

  async selectAccount(accountId: number): Promise<TokenResponse> {
    const response = await httpClient.post<TokenResponse>('/api/auth/select-account', {
      account_id: accountId
    });

    // Update stored token
    await storeToken(response.token);

    return response;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }

    // Clear stored data
    await this.clearAuthData();
  }

  async getCurrentUser(): Promise<AuthUser> {
    return await httpClient.get<AuthUser>('/api/users/me');
  }

  async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    return await httpClient.put<AuthUser>('/api/users/me', data);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await getToken();
    const user = await getUser();
    return !!(token && user);
  }

  async clearAuthData(): Promise<void> {
    await Promise.all([
      removeToken(),
      removeUser()
    ]);
  }

  async refreshToken(): Promise<string | null> {
    try {
      const response = await httpClient.post<{ token: string }>('/api/auth/refresh');
      await storeToken(response.token);
      return response.token;
    } catch (error) {
      await this.clearAuthData();
      return null;
    }
  }
}

export const authService = new AuthService();
```

### Authentication Provider

Create a React context for authentication state management:

**auth/AuthProvider.tsx:**
```typescript
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, AuthUser, Account } from './authService';

interface AuthState {
  user: AuthUser | null;
  selectedAccount: Account | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  selectAccount: (accountId: number) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const authReducer = (state: AuthState, action: any): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false 
      };
    case 'SET_ACCOUNT':
      return { ...state, selectedAccount: action.payload };
    case 'LOGOUT':
      return { 
        user: null, 
        selectedAccount: null, 
        isLoading: false, 
        isAuthenticated: false 
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    selectedAccount: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      await authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authService.login(email, password);
      dispatch({ type: 'SET_USER', payload: response.user });
      
      // Auto-select account if only one available
      if (response.accounts.length === 1) {
        await selectAccount(response.accounts[0].id);
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const selectAccount = async (accountId: number) => {
    const response = await authService.selectAccount(accountId);
    dispatch({ type: 'SET_ACCOUNT', payload: response.account });
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data: Partial<AuthUser>) => {
    const updatedUser = await authService.updateProfile(data);
    dispatch({ type: 'SET_USER', payload: updatedUser });
  };

  const refreshAuth = async () => {
    await initializeAuth();
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      selectAccount,
      logout,
      updateProfile,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## API Client Setup

### HTTP Client with Interceptors

Create a centralized HTTP client with authentication and error handling:

**api/httpClient.ts:**
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, removeToken, removeUser } from '../auth/token';
import { config } from '../config';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

interface PaginatedResponse<T = any> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
  };
}

class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth data
          await removeToken();
          await removeUser();
          // Trigger app-wide logout
          // You can emit an event or use a global state manager here
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return response.data.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return response.data.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return response.data.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return response.data.data;
  }

  async getPaginated<T = any>(url: string, config?: AxiosRequestConfig): Promise<PaginatedResponse<T>> {
    const response: AxiosResponse<PaginatedResponse<T>> = await this.client.get(url, config);
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/healthz');
      return true;
    } catch {
      return false;
    }
  }
}

export const httpClient = new HttpClient();
export type { ApiResponse, PaginatedResponse };
```

## Event Discovery

### Event Service

Create a service for event-related API calls:

**api/eventService.ts:**
```typescript
import { httpClient, PaginatedResponse } from './httpClient';

export interface EventFilters {
  query?: string;
  category_ids?: number[];
  city?: string;
  start_date?: string;
  end_date?: string;
  price_min?: number;
  price_max?: number;
  is_free?: boolean;
  page?: number;
  per_page?: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  is_free: boolean;
  price_from: number;
  currency: string;
  images: Array<{
    id: number;
    url: string;
    alt: string;
  }>;
  venue: {
    name: string;
    city: string;
    state: string;
    country: string;
    address_line_1: string;
    postal_code: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  organizer: {
    id: number;
    name: string;
    email: string;
  };
}

export interface EventDetail extends Event {
  tickets: Array<{
    id: number;
    title: string;
    description: string;
    price: number;
    currency: string;
    quantity_available: number;
    max_per_order: number;
    is_sold_out: boolean;
    sale_start_date: string;
    sale_end_date: string;
  }>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export class EventService {
  async getEvents(filters: EventFilters = {}): Promise<PaginatedResponse<Event>> {
    const params = new URLSearchParams();
    
    // Handle search query
    if (filters.query) params.append('query', filters.query);
    
    // Handle category filters
    if (filters.category_ids?.length) {
      filters.category_ids.forEach(id => params.append('category_ids[]', id.toString()));
    }
    
    // Handle location filter
    if (filters.city) params.append('city', filters.city);
    
    // Handle date filters
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    // Handle price filters
    if (filters.price_min !== undefined) params.append('price_min', filters.price_min.toString());
    if (filters.price_max !== undefined) params.append('price_max', filters.price_max.toString());
    if (filters.is_free !== undefined) params.append('is_free', filters.is_free.toString());
    
    // Handle pagination
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const url = `/api/public/events${queryString ? `?${queryString}` : ''}`;
    
    return await httpClient.getPaginated<Event>(url);
  }

  async getEvent(eventId: number): Promise<EventDetail> {
    return await httpClient.get<EventDetail>(`/api/public/events/${eventId}`);
  }

  async getCategories(): Promise<Category[]> {
    return await httpClient.get<Category[]>('/api/public/categories');
  }
}

export const eventService = new EventService();
```

### React Hook for Events

Create a React hook using React Query for event data management:

**hooks/useEvents.ts:**
```typescript
import { useQuery, useInfiniteQuery } from 'react-query';
import { eventService, EventFilters } from '../api/eventService';

export const useEvents = (filters: EventFilters = {}) => {
  return useQuery(
    ['events', filters],
    () => eventService.getEvents(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useInfiniteEvents = (filters: EventFilters = {}) => {
  return useInfiniteQuery(
    ['events-infinite', filters],
    ({ pageParam = 1 }) => 
      eventService.getEvents({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage) => 
        lastPage.meta.has_more ? lastPage.meta.current_page + 1 : undefined,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useEvent = (eventId: number) => {
  return useQuery(
    ['event', eventId],
    () => eventService.getEvent(eventId),
    {
      enabled: !!eventId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCategories = () => {
  return useQuery(
    ['categories'],
    () => eventService.getCategories(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );
};
```

## Ticket Purchase Flow

### Order Service

Create a service for order management:

**api/orderService.ts:**
```typescript
import { httpClient } from './httpClient';

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  promo_code?: string;
  affiliate_code?: string;
}

export interface Order {
  id: number;
  short_id: string;
  status: string;
  total_gross: number;
  currency: string;
  payment_status?: string;
  payment_id?: string;
  items: Array<{
    id: number;
    product_id: number;
    product_title: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  event: {
    id: number;
    title: string;
    start_date: string;
    venue?: {
      name: string;
      city: string;
    };
  };
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export class OrderService {
  async createOrder(eventId: number, orderData: CreateOrderRequest): Promise<Order> {
    return await httpClient.post<Order>(`/api/public/events/${eventId}/order`, orderData);
  }

  async getOrder(eventId: number, orderShortId: string): Promise<Order> {
    return await httpClient.get<Order>(`/api/public/events/${eventId}/order/${orderShortId}`);
  }

  async getUserOrders(status: 'upcoming' | 'past' | 'all' = 'all', page = 1, per_page = 20) {
    const params = new URLSearchParams({ status, page: page.toString(), per_page: per_page.toString() });
    return await httpClient.getPaginated<Order>(`/api/users/me/orders?${params}`);
  }
}

export const orderService = new OrderService();
```

### Checkout Hook

Create a React hook for managing checkout state:

**hooks/useCheckout.ts:**
```typescript
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { orderService, CreateOrderRequest, Order } from '../api/orderService';

export interface CheckoutItem {
  productId: number;
  productTitle: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

export const useCheckout = (eventId: number) => {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation(
    (orderData: CreateOrderRequest) => orderService.createOrder(eventId, orderData),
    {
      onSuccess: (order) => {
        // Invalidate and refetch user orders
        queryClient.invalidateQueries(['user-orders']);
      }
    }
  );

  const addItem = (item: CheckoutItem) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.productId === item.productId);
      
      if (existingIndex >= 0) {
        const newItems = [...prevItems];
        const existing = newItems[existingIndex];
        const newQuantity = Math.min(existing.quantity + item.quantity, existing.maxQuantity);
        newItems[existingIndex] = { ...existing, quantity: newQuantity };
        return newItems;
      } else {
        return [...prevItems, item];
      }
    });
  };

  const removeItem = (productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const clearCart = () => {
    setItems([]);
  };

  const createOrder = async (promoCode?: string) => {
    const orderData: CreateOrderRequest = {
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      })),
      promo_code: promoCode
    };

    const order = await createOrderMutation.mutateAsync(orderData);
    clearCart();
    return order;
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getItemCount,
    clearCart,
    createOrder,
    isCreatingOrder: createOrderMutation.isLoading
  };
};
```

## Payment Integration

### Stripe Setup

Configure Stripe in your App.tsx:

**App.tsx:**
```typescript
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { config } from './config';
import { AuthProvider } from './auth/AuthProvider';

export default function App() {
  return (
    <StripeProvider publishableKey={config.STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        {/* Your app content */}
      </AuthProvider>
    </StripeProvider>
  );
}
```

### Payment Service

Create a service for payment processing:

**api/paymentService.ts:**
```typescript
import { httpClient } from './httpClient';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: {
    type: string;
    last4?: string;
    brand?: string;
  };
}

export interface CreatePaymentIntentRequest {
  return_url?: string;
}

export class PaymentService {
  async createPaymentIntent(
    eventId: number, 
    orderShortId: string, 
    data: CreatePaymentIntentRequest = {}
  ): Promise<PaymentIntent> {
    return await httpClient.post<PaymentIntent>(
      `/api/public/events/${eventId}/order/${orderShortId}/stripe/payment_intent`,
      data
    );
  }

  async getPaymentIntent(eventId: number, orderShortId: string): Promise<PaymentIntent> {
    return await httpClient.get<PaymentIntent>(
      `/api/public/events/${eventId}/order/${orderShortId}/stripe/payment_intent`
    );
  }
}

export const paymentService = new PaymentService();
```

### Payment Hook with Stripe

Create a hook for handling payments with Stripe:

**hooks/usePayment.ts:**
```typescript
import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '../api/paymentService';
import { Alert } from 'react-native';

export const usePayment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (
    eventId: number,
    orderShortId: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ) => {
    setIsProcessing(true);

    try {
      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(eventId, orderShortId);

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Bole.to',
        paymentIntentClientSecret: paymentIntent.client_secret,
        allowsDelayedPaymentMethods: false,
        returnURL: 'boletomobile://payment-return',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User cancelled payment
          return;
        }
        throw new Error(presentError.message);
      }

      // Payment successful
      onSuccess();

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing
  };
};
```

## User Ticket Management

### Ticket Service

Create a service for ticket-related operations:

**api/ticketService.ts:**
```typescript
import { httpClient } from './httpClient';

export interface UserTicket {
  id: string;
  uuid: string;
  order_id: number;
  event_id: number;
  product_id: number;
  product_title: string;
  qr_code: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  attendee_first_name?: string;
  attendee_last_name?: string;
  attendee_email?: string;
  created_at: string;
  event: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    venue?: {
      name: string;
      city: string;
    };
    images?: Array<{
      url: string;
    }>;
  };
}

export class TicketService {
  async getUserTickets(): Promise<UserTicket[]> {
    // Get user orders and extract tickets
    const orders = await httpClient.get<any[]>('/api/users/me/orders');
    const tickets: UserTicket[] = [];

    orders.forEach(order => {
      order.items.forEach((item: any) => {
        if (item.attendees) {
          item.attendees.forEach((attendee: any) => {
            tickets.push({
              id: attendee.id,
              uuid: attendee.uuid || `uuid_${attendee.id}`,
              order_id: order.id,
              event_id: order.event.id,
              product_id: item.product_id,
              product_title: item.product_title,
              qr_code: attendee.qr_code || `qr_${attendee.id}`,
              status: attendee.status || 'ACTIVE',
              attendee_first_name: attendee.first_name,
              attendee_last_name: attendee.last_name,
              attendee_email: attendee.email,
              created_at: order.created_at,
              event: {
                id: order.event.id,
                title: order.event.title,
                start_date: order.event.start_date,
                end_date: order.event.end_date,
                venue: order.event.venue,
                images: order.event.images
              }
            });
          });
        }
      });
    });

    return tickets;
  }

  async getTicket(ticketId: string): Promise<UserTicket> {
    const tickets = await this.getUserTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.uuid === ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  }
}

export const ticketService = new TicketService();
```

### Ticket Management Hook

Create a hook for managing user tickets:

**hooks/useTickets.ts:**
```typescript
import { useQuery } from 'react-query';
import { ticketService } from '../api/ticketService';

export const useUserTickets = () => {
  return useQuery(
    ['user-tickets'],
    () => ticketService.getUserTickets(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useTicket = (ticketId: string) => {
  return useQuery(
    ['ticket', ticketId],
    () => ticketService.getTicket(ticketId),
    {
      enabled: !!ticketId,
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useUserOrders = (status: 'upcoming' | 'past' | 'all' = 'all') => {
  return useQuery(
    ['user-orders', status],
    () => orderService.getUserOrders(status),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};
```

## Error Handling

### Error Types

Define common error types and handling:

**types/errors.ts:**
```typescript
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface NetworkError {
  message: string;
  isNetworkError: true;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'payment_error';
}

export type AppError = ApiError | NetworkError | PaymentError;
```

### Error Handling Utility

Create utilities for consistent error handling:

**utils/errorHandling.ts:**
```typescript
import { ApiError, NetworkError, PaymentError, AppError } from '../types/errors';

export const handleApiError = (error: any): AppError => {
  // Network error
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      isNetworkError: true
    } as NetworkError;
  }

  // API error response
  const { status, data } = error.response;
  
  return {
    message: data?.message || 'An error occurred',
    status,
    errors: data?.errors
  } as ApiError;
};

export const handlePaymentError = (error: any): PaymentError => {
  const paymentErrorMessages: Record<string, string> = {
    'Canceled': 'Payment was cancelled',
    'Failed': 'Payment failed. Please try again.',
    'PaymentMethodRequired': 'Please select a payment method',
    'Incomplete': 'Payment incomplete. Please try again.',
    'InsufficientFunds': 'Insufficient funds on your card',
    'CardDeclined': 'Your card was declined',
    'ExpiredCard': 'Your card has expired',
    'IncorrectCvc': 'Incorrect CVC code',
    'ProcessingError': 'Payment processing error',
    'AuthenticationRequired': '3D Secure authentication failed'
  };

  return {
    code: error.code || 'Unknown',
    message: paymentErrorMessages[error.code] || error.message || 'Payment error occurred',
    type: 'payment_error'
  };
};

export const getErrorMessage = (error: AppError): string => {
  if ('isNetworkError' in error) {
    return error.message;
  }
  
  if ('type' in error && error.type === 'payment_error') {
    return error.message;
  }

  // API error
  const apiError = error as ApiError;
  if (apiError.errors) {
    // Return first validation error
    const firstField = Object.keys(apiError.errors)[0];
    return apiError.errors[firstField][0];
  }

  return apiError.message;
};
```

### Error Boundary Component

Create an error boundary for React error handling:

**components/ErrorBoundary.tsx:**
```typescript
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // You can log this to a crash reporting service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Testing Guide

### Unit Testing Setup

Install testing dependencies:

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
};
```

### API Service Tests

**__tests__/eventService.test.ts:**
```typescript
import { eventService } from '../api/eventService';
import { httpClient } from '../api/httpClient';

// Mock the httpClient
jest.mock('../api/httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch events with filters', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            title: 'Test Event',
            start_date: '2025-09-15T18:00:00Z'
          }
        ],
        meta: {
          current_page: 1,
          per_page: 12,
          total: 1,
          last_page: 1,
          has_more: false
        }
      };

      mockedHttpClient.getPaginated.mockResolvedValue(mockResponse);

      const filters = { query: 'test', city: 'New York' };
      const result = await eventService.getEvents(filters);

      expect(mockedHttpClient.getPaginated).toHaveBeenCalledWith(
        '/api/public/events?query=test&city=New+York'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getEvent', () => {
    it('should fetch single event', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        tickets: []
      };

      mockedHttpClient.get.mockResolvedValue(mockEvent);

      const result = await eventService.getEvent(1);

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/api/public/events/1');
      expect(result).toEqual(mockEvent);
    });
  });
});
```

### Integration Testing

**__tests__/integration/checkout.test.tsx:**
```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from 'react-query';
import { CheckoutScreen } from '../screens/CheckoutScreen';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Checkout Integration', () => {
  it('should complete order creation flow', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <CheckoutScreen route={{ params: { eventId: 1 } }} />
    );

    // Add item to cart
    fireEvent.press(getByTestId('add-item-button'));

    // Proceed to checkout
    fireEvent.press(getByText('Proceed to Payment'));

    // Wait for order creation
    await waitFor(() => {
      expect(getByText('Payment')).toBeTruthy();
    });
  });
});
```

### E2E Testing with Detox

Install and configure Detox for end-to-end testing:

```bash
npm install --save-dev detox
```

**e2e/checkout.e2e.js:**
```javascript
describe('Checkout Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full purchase flow', async () => {
    // Navigate to event
    await element(by.id('event-card-1')).tap();
    
    // Add tickets to cart
    await element(by.id('add-ticket-button')).tap();
    
    // Go to checkout
    await element(by.text('Buy Tickets')).tap();
    
    // Complete payment (with mock)
    await element(by.id('pay-button')).tap();
    
    // Verify success
    await expect(element(by.text('Order Confirmed'))).toBeVisible();
  });
});
```

## Deployment Checklist

### Pre-Production Checklist

**Environment Configuration:**
- [ ] Update API base URL to production endpoint
- [ ] Replace Stripe test keys with live keys
- [ ] Configure proper error reporting (Sentry, Bugsnag)
- [ ] Set up analytics tracking
- [ ] Configure app-specific URL schemes

**Security:**
- [ ] Verify secure token storage implementation
- [ ] Ensure no sensitive data in logs
- [ ] Test SSL pinning if implemented
- [ ] Verify payment data handling compliance

**Testing:**
- [ ] Run full test suite
- [ ] Test payment flows with real cards (small amounts)
- [ ] Verify offline behavior
- [ ] Test on physical devices (iOS/Android)
- [ ] Performance testing with large datasets

**App Store Requirements:**
- [ ] Update app metadata and descriptions
- [ ] Prepare screenshots for app stores
- [ ] Configure deep linking
- [ ] Test push notifications if implemented
- [ ] Verify app permissions

### Production Configuration

**config/production.ts:**
```typescript
export const config = {
  API_BASE_URL: 'https://api.bole.to',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_...', // Your live Stripe key
  SENTRY_DSN: 'https://...', // Error reporting
  ANALYTICS_KEY: '...', // Analytics service
};
```

### Monitoring & Analytics

Set up monitoring for production:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: config.SENTRY_DSN,
});

// Track API errors
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500) {
      Sentry.captureException(error);
    }
    return Promise.reject(error);
  }
);
```

This integration guide provides a complete foundation for implementing the Bole.to API in React Native applications. All components are production-ready and follow best practices for security, error handling, and user experience.