import React, { createContext, useContext } from "react";
import { mockApi } from "./mockAdapter";
import { HiEventsAuthClient, HiEventsError } from "../auth/hiEventsAuthClient";
import { NetworkManager } from "../auth/networkManager";
import { TokenLifecycleManager } from "../auth/tokenLifecycleManager";
import { retryWithBackoff, RetryConfigs, isNetworkError, isAuthError } from "../utils/retryUtils";
import { securityLogger, SecurityEventType, SecuritySeverity } from "../security/securityLogger";
import { networkSecurity } from "../security/networkSecurity";

// Hi.Events API Client with automatic authentication
class HiEventsApiClient {
  private authClient: HiEventsAuthClient;
  private networkManager: NetworkManager;
  private tokenManager: TokenLifecycleManager;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.authClient = HiEventsAuthClient.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.tokenManager = TokenLifecycleManager.getInstance();
  }

  async request(endpoint: string, options: RequestInit & { 
    requiresOnline?: boolean;
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
    requireSigning?: boolean;
  } = {}): Promise<any> {
    const { requiresOnline = true, priority = 'high', timeout = 30000, requireSigning = true, ...fetchOptions } = options;
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    // Log request (with sanitization)
    securityLogger.debug('API request initiated', {
      endpoint: endpoint.split('?')[0], // Remove query parameters
      method: fetchOptions.method || 'GET',
      priority
    }, 'ApiClient');
    
    // Define the request operation
    const requestOperation = async (): Promise<any> => {
      // Check network connectivity if required
      if (requiresOnline && !this.networkManager.isConnected()) {
        throw new Error('Network connection required for this operation');
      }

      // Use secure request with certificate pinning and request signing
      try {
        return await networkSecurity.secureRequest(url, {
          ...fetchOptions,
          requirePinning: true,
          signRequest: requireSigning,
          validateHeaders: true
        });
      } catch (secureError) {
        securityLogger.warn('Secure request failed, falling back to standard request', 
          securityLogger.sanitizeError(secureError), 'ApiClient');
        
        // Fallback to standard request for compatibility
        const token = await this.tokenManager.ensureValidToken();
        
        const defaultHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        let response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers: {
            ...defaultHeaders,
            ...fetchOptions.headers,
          },
        }, timeout);

      // Handle authentication errors
      if (response.status === 401) {
        console.log('Received 401, attempting token refresh');
        
        try {
          // Attempt token refresh
          const newToken = await this.tokenManager.performTokenRefresh();
          
          // Retry the request with the new token
          const retryHeaders = {
            ...defaultHeaders,
            'Authorization': `Bearer ${newToken}`,
            ...fetchOptions.headers,
          };
          
          response = await this.fetchWithTimeout(url, {
            ...fetchOptions,
            headers: retryHeaders,
          }, timeout);
        } catch (refreshError) {
          securityLogger.error('Token refresh failed during API request', 
            securityLogger.sanitizeError(refreshError), 'ApiClient');
          
          // Log security event for authentication failure
          securityLogger.logSecurityEvent({
            type: SecurityEventType.AUTH_FAILURE,
            severity: SecuritySeverity.HIGH,
            message: 'Token refresh failed during API request',
            metadata: { endpoint: endpoint.split('?')[0] }
          });
          
          // If refresh fails, perform logout and throw auth error
          await this.authClient.logout();
          throw new HiEventsError(
            'AUTH_EXPIRED',
            'Authentication expired. Please sign in again.',
            401
          );
        }
      }
      
      return response.json();
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Log API error (sanitized)
        securityLogger.warn('API request failed', {
          endpoint: endpoint.split('?')[0],
          status: response.status,
          statusText: response.statusText
        }, 'ApiClient');
        
        throw new HiEventsError(
          errorData.error?.code || 'HTTP_ERROR',
          errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.error?.details
        );
      }

      return response.json();
    };

    // Execute with network-aware handling and retry logic
    if (requiresOnline) {
      return await this.networkManager.executeWhenOnline(async () => {
        return await this.networkManager.executeWithApiCircuitBreaker(async () => {
          return await retryWithBackoff(requestOperation, {
            ...RetryConfigs.network,
            retryIf: (error: any) => {
              // Don't retry auth errors or client errors
              if (isAuthError(error) || (error.status >= 400 && error.status < 500)) {
                return false;
              }
              return isNetworkError(error) || (error.status >= 500);
            }
          });
        });
      }, { priority, timeout, requireStable: false });
    } else {
      // For offline-capable requests, execute directly
      return await retryWithBackoff(requestOperation, RetryConfigs.network);
    }
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        securityLogger.warn('Request timeout occurred', { timeout: timeoutMs }, 'ApiClient');
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Network status methods
  public isOnline(): boolean {
    return this.networkManager.isConnected();
  }

  public getConnectionState() {
    return this.networkManager.getConnectionState();
  }

  private getBaseUrl(): string {
    return process.env.EXPO_PUBLIC_HIEVENTS_URL || 'http://localhost:8000';
  }
}

// Create API client instances
const hiEventsApi = new HiEventsApiClient();

// API implementation that bridges Hi.Events client with the existing mockApi interface
const hiEventsApiAdapter = {
  // Events
  async listEvents() {
    return hiEventsApi.request('/api/events', { priority: 'high' });
  },

  async getEvent(id: string) {
    return hiEventsApi.request(`/api/events/${id}`, { priority: 'high' });
  },

  async searchEvents(query: string) {
    return hiEventsApi.request('/api/events/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
      priority: 'high'
    });
  },

  async getEventQRCode(eventId: string) {
    return hiEventsApi.request(`/api/events/${eventId}/qr-code`, { priority: 'high' });
  },

  // Authentication
  async getMe() {
    return hiEventsApi.request('/api/auth/mobile/me', { 
      priority: 'high',
      requireSigning: true
    });
  },

  async refreshToken() {
    return hiEventsApi.request('/api/auth/mobile/refresh', { 
      method: 'POST',
      priority: 'high',
      timeout: 10000,
      requireSigning: true
    });
  },

  async verifyToken() {
    return hiEventsApi.request('/api/auth/mobile/verify', { 
      priority: 'high',
      timeout: 5000
    });
  },

  async logout(everywhere: boolean = false) {
    return hiEventsApi.request('/api/auth/mobile/logout', {
      method: 'POST',
      body: JSON.stringify({ everywhere }),
      priority: 'high',
      timeout: 10000,
      requireSigning: true
    });
  },

  // Tickets
  async listMyTickets() {
    return hiEventsApi.request('/api/tickets', { priority: 'high' });
  },

  async getTicket(id: string) {
    return hiEventsApi.request(`/api/tickets/${id}`, { priority: 'high' });
  },

  async getTicketQRCode(ticketId: string) {
    return hiEventsApi.request(`/api/tickets/${ticketId}/qr-code`, { priority: 'high' });
  },

  // Orders
  async getOrder(orderId: string) {
    return hiEventsApi.request(`/api/orders/${orderId}`, { priority: 'high' });
  },

  async createOrder(orderData: any) {
    return hiEventsApi.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
      priority: 'high',
      timeout: 30000
    });
  },

  async getOrderPayment(orderId: string) {
    return hiEventsApi.request(`/api/orders/${orderId}/payment`, { priority: 'high' });
  },

  async processPayment(orderId: string, paymentData: any) {
    return hiEventsApi.request(`/api/orders/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
      priority: 'high',
      timeout: 45000,
      requireSigning: true // Critical payment operation
    });
  },

  // Posts & Social
  async listPosts(eventId?: string) {
    const endpoint = eventId ? `/api/events/${eventId}/posts` : '/api/posts';
    return hiEventsApi.request(endpoint, { priority: 'high' });
  },

  async createPost(eventId: string, content: string) {
    return hiEventsApi.request(`/api/events/${eventId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      priority: 'high'
    });
  },

  async likePost(postId: string) {
    return hiEventsApi.request(`/api/posts/${postId}/like`, {
      method: 'POST',
      priority: 'low'
    });
  },

  async unlikePost(postId: string) {
    return hiEventsApi.request(`/api/posts/${postId}/unlike`, {
      method: 'POST',
      priority: 'low'
    });
  },

  // Check-in & Staff
  async getStaffEvents() {
    return hiEventsApi.request('/api/staff/events', { priority: 'high' });
  },

  async getEventCheckInLists(eventId: string) {
    return hiEventsApi.request(`/api/events/${eventId}/check-in-lists`, { priority: 'high' });
  },

  async getCheckInListAttendees(checkInListId: string) {
    return hiEventsApi.request(`/api/check-in-lists/${checkInListId}/attendees`, { priority: 'high' });
  },

  async createCheckIn(checkInListId: string, attendeeShortId: string) {
    return hiEventsApi.request(`/api/check-in-lists/${checkInListId}/check-ins`, {
      method: 'POST',
      body: JSON.stringify({ attendee_short_id: attendeeShortId }),
      priority: 'high',
      timeout: 10000,
      requireSigning: true
    });
  },

  async undoCheckIn(checkInId: string) {
    return hiEventsApi.request(`/api/check-ins/${checkInId}`, {
      method: 'DELETE',
      priority: 'high',
      timeout: 10000,
      requireSigning: true
    });
  },

  async getCheckInStats(eventId: string) {
    return hiEventsApi.request(`/api/events/${eventId}/check-in-stats`, { priority: 'high' });
  },

  // Fallback methods that still use mockApi for development
  async getHomePayload() {
    return mockApi.getHomePayload();
  },

  async discover(query?: any) {
    return mockApi.discover(query);
  },

  async getFeedPayload(scope?: "all" | "following" | "nearby" | "trending") {
    return mockApi.getFeedPayload(scope);
  },

  async getTicketsPayload() {
    return mockApi.getTicketsPayload();
  },

  async getProfilePayload() {
    return mockApi.getProfilePayload();
  },

  // Add more Hi.Events API methods as needed...
};

// Determine which API to use based on environment or feature flag
const shouldUseHiEventsApi = process.env.EXPO_PUBLIC_USE_HIEVENTS_API === 'true';

type Api = typeof mockApi;
const api = shouldUseHiEventsApi ? 
  { ...mockApi, ...hiEventsApiAdapter } as Api : 
  mockApi;

const ApiCtx = createContext<Api>(api);

export const ApiProvider = ({ children }: {children: React.ReactNode}) => {
  return <ApiCtx.Provider value={api}>{children}</ApiCtx.Provider>;
};

export const useApi = () => useContext(ApiCtx);

// Export the Hi.Events API client for direct use if needed
export { hiEventsApi, HiEventsApiClient };