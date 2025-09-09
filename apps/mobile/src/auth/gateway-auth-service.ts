import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Gateway client for API requests
class GatewayClient {
  private baseURL: string;
  
  constructor() {
    // Use environment variable or fallback to production
    this.baseURL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'https://gateway.bole.to';
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': this.getUserAgent(),
      'X-Platform': Platform.OS,
      'X-App-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    };

    const token = await SecureStore.getItemAsync('gateway_access_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GatewayError(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'An unexpected error occurred',
        response.status,
        errorData.error?.details
      );
    }

    return response.json();
  }

  private getUserAgent(): string {
    const platform = Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1);
    const version = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
    return `Bole.to-Mobile/${version} (${platform})`;
  }
}

// Custom error class for Gateway API errors
export class GatewayError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// Interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile?: {
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    location?: string;
    preferences?: {
      notifications: boolean;
      marketing: boolean;
      language: string;
      timezone: string;
    };
  };
  socialAccounts?: Array<{
    provider: string;
    linkedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  osVersion: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  permissions: string[];
}

export interface OAuthResponse {
  user: User;
  tokens: AuthTokens;
  isNewUser: boolean;
  linkedProvider: string;
}

// Main Gateway Authentication Service
export class GatewayAuthService {
  private static instance: GatewayAuthService;
  public client: GatewayClient;

  // Secure storage keys
  private static readonly ACCESS_TOKEN_KEY = 'gateway_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'gateway_refresh_token';
  private static readonly USER_DATA_KEY = 'user_data';

  private constructor() {
    this.client = new GatewayClient();
  }

  public static getInstance(): GatewayAuthService {
    if (!GatewayAuthService.instance) {
      GatewayAuthService.instance = new GatewayAuthService();
    }
    return GatewayAuthService.instance;
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const deviceInfo = await this.getDeviceInfo();
    
    const response = await this.client.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        deviceInfo,
      }),
    });

    const { user, tokens, permissions } = response.data;
    
    await this.storeTokens(tokens);
    await this.storeUser(user);

    return { user, tokens, permissions };
  }

  async logout(allDevices: boolean = false): Promise<void> {
    try {
      await this.client.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ allDevices }),
      });
    } finally {
      // Always clear local storage regardless of API response
      await this.clearStoredData();
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await SecureStore.getItemAsync(GatewayAuthService.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new GatewayError('NO_REFRESH_TOKEN', 'No refresh token available', 401);
    }

    const response = await this.client.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const tokens = response.data;
    await this.storeTokens(tokens);
    
    return tokens;
  }

  // Native OAuth Authentication
  // Uses native SDKs (Google Sign-In, Apple Sign-In) to get ID tokens
  // and exchange them with Gateway's /auth/oauth/:provider/mobile endpoint

  async authenticateWithOAuth(provider: 'google' | 'apple', idToken: string): Promise<OAuthResponse> {
    const deviceInfo = await this.getDeviceInfo();
    
    try {
      const response = await this.client.request(`/auth/oauth/${provider}/mobile`, {
        method: 'POST',
        body: JSON.stringify({
          idToken,
          deviceInfo,
        }),
      });

      const { user, tokens, isNewUser, linkedProvider } = response.data;
      
      await this.storeTokens(tokens);
      await this.storeUser(user);

      return { user, tokens, isNewUser, linkedProvider };
    } catch (error) {
      console.error(`OAuth authentication failed for ${provider}:`, error);
      throw error;
    }
  }



  // Profile Management
  async getProfile(): Promise<User> {
    const response = await this.client.request('/me', {
      method: 'GET',
    });
    
    const user = response.data;
    await this.storeUser(user);
    
    return user;
  }

  // Social Account Management
  async linkSocialAccount(provider: string, idToken: string): Promise<{ provider: string; linkedAt: string }> {
    const response = await this.client.request(`/auth/link/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    return response.data;
  }

  async unlinkSocialAccount(provider: string): Promise<void> {
    await this.client.request(`/auth/link/${provider}`, {
      method: 'DELETE',
    });
  }

  // Session Management
  async getSessions(): Promise<any[]> {
    const response = await this.client.request('/auth/sessions', {
      method: 'GET',
    });
    
    return response.data || [];
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.client.request(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async revokeAllSessions(): Promise<void> {
    await this.client.request('/auth/sessions', {
      method: 'DELETE',
    });
  }

  // Manifest Management for Offline QR Validation
  async getEventManifest(eventId: string): Promise<any> {
    const response = await this.client.request(`/events/${eventId}/manifest`, {
      method: 'GET',
    });
    
    return response.data;
  }

  async getDeltaManifest(eventId: string, etag: string): Promise<any> {
    const response = await this.client.request(`/events/${eventId}/manifest/delta`, {
      method: 'GET',
      headers: {
        'If-None-Match': etag,
      },
    });
    
    return response.data;
  }

  // Utility Methods
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const platform = Platform.OS as 'ios' | 'android';
    
    return {
      deviceId: await this.getOrCreateDeviceId(),
      platform,
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      osVersion: Platform.Version.toString(),
    };
  }

  private async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync('device_id');
    
    if (!deviceId) {
      // Generate a unique device ID
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      deviceId = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      await SecureStore.setItemAsync('device_id', deviceId);
    }
    
    return deviceId;
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(GatewayAuthService.ACCESS_TOKEN_KEY, tokens.accessToken);
    
    // Note: Refresh tokens are typically handled via httpOnly cookies
    // But we can store them locally for mobile if needed
    if (tokens.refreshExpiresIn) {
      // This would be uncommon for httpOnly cookie setup
      // await SecureStore.setItemAsync(GatewayAuthService.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(GatewayAuthService.USER_DATA_KEY, JSON.stringify(user));
  }

  private async clearStoredData(): Promise<void> {
    await SecureStore.deleteItemAsync(GatewayAuthService.ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(GatewayAuthService.REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(GatewayAuthService.USER_DATA_KEY);
  }

  // Token management for other parts of the app
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(GatewayAuthService.ACCESS_TOKEN_KEY);
  }

  async isTokenValid(): Promise<boolean> {
    const token = await this.getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      // Decode JWT payload to check expiry (without verification)
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Biometric authentication support
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.warn('Biometric authentication not available:', error);
      return false;
    }
  }

  async authenticateWithBiometrics(reason: string): Promise<boolean> {
    try {
      if (!(await this.isBiometricAvailable())) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
      });
      
      return result.success;
    } catch (error) {
      console.warn('Biometric authentication failed:', error);
      return false;
    }
  }
}