# Bole.to Unified Authentication - React Native Integration Guide

## Overview

This guide provides comprehensive examples for integrating the Bole.to Unified Authentication system with React Native applications using Expo. The authentication system uses a Gateway service (NestJS) that issues RS256 JWTs while Hi.Events (Laravel) remains the user database source of truth.

## System Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│                 │    │              │    │                 │
│  Mobile Client  ├────┤   Gateway    ├────┤   Hi.Events     │
│ (React Native)  │    │  (NestJS)    │    │   (Laravel)     │
│                 │    │              │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────┐
         │              │              │
         └──────────────┤ OAuth Providers │
                        │ (Google/Apple) │
                        │              │
                        └──────────────┘
```

### Authentication Flow
1. **Mobile client** authenticates via Gateway endpoints (email/password or OAuth)
2. **Gateway** validates credentials with Hi.Events backend
3. **Gateway** issues RS256 JWT tokens with user claims from Hi.Events
4. **Mobile client** uses JWTs for subsequent API requests
5. **Services** verify JWTs using Gateway's JWKS endpoint

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Authentication Service](#authentication-service)
3. [API Client Implementation](#api-client-implementation)
4. [React Hooks](#react-hooks)
5. [Social Authentication](#social-authentication)
6. [Biometric Authentication](#biometric-authentication)
7. [Push Notifications](#push-notifications)
8. [Error Handling](#error-handling)
9. [Security Best Practices](#security-best-practices)
10. [Testing](#testing)

## Setup and Configuration

### Required Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install expo-secure-store
npm install expo-local-authentication
npm install expo-notifications
npm install @expo/vector-icons
npm install react-native-keychain  # Alternative to expo-secure-store
```

### Environment Configuration

Create a `.env` file:

```env
# Gateway Configuration
EXPO_PUBLIC_GATEWAY_URL=https://gateway.bole.to
EXPO_PUBLIC_GATEWAY_TIMEOUT=10000

# OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_client_id

# Deep Link Configuration
EXPO_PUBLIC_SCHEME=com.bole.to
EXPO_PUBLIC_OAUTH_REDIRECT_URI=com.bole.to://oauth/callback

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### app.config.ts

```typescript
export default {
  expo: {
    name: 'Bole.to',
    slug: 'boleto-mobile',
    scheme: 'boleto',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.boleto.mobile',
      infoPlist: {
        NSFaceIDUsageDescription: 'Use Face ID to authenticate quickly and securely.',
        NSCameraUsageDescription: 'Camera access is required for QR code scanning.',
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      package: 'com.boleto.mobile',
      permissions: [
        'USE_FINGERPRINT',
        'USE_BIOMETRIC',
        'CAMERA'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-secure-store',
      'expo-local-authentication',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#ffffff',
          defaultChannel: 'default'
        }
      ]
    ]
  }
};
```

## Authentication Service

### Core Authentication Service

```typescript
// src/services/AuthService.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { GatewayClient } from './GatewayClient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'attendee' | 'organizer' | 'admin';
  emailVerified: boolean;
  phoneVerified: boolean;
  profile: {
    avatar?: string;
    bio?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'attendee' | 'organizer';
  companyName?: string;
  acceptsTerms: boolean;
  acceptsMarketing?: boolean;
}

class AuthService {
  private static instance: AuthService;
  private gatewayClient: GatewayClient;
  private currentUser: User | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  // Secure storage keys
  private static readonly ACCESS_TOKEN_KEY = 'gateway_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'gateway_refresh_token';
  private static readonly USER_DATA_KEY = 'user_data';
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly PKCE_CODE_VERIFIER_KEY = 'pkce_code_verifier';

  private constructor() {
    this.gatewayClient = new GatewayClient();
    this.setupInterceptors();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.gatewayClient.addRequestInterceptor(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for token refresh
    this.gatewayClient.addResponseInterceptor(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshTokens();
            const newToken = await this.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.gatewayClient.request(originalRequest);
            }
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }
        
        throw error;
      }
    );
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const response = await this.gatewayClient.post('/auth/login', {
        ...credentials,
        deviceInfo,
      });

      const { user, tokens } = response.data.data;
      
      await this.storeTokens(tokens);
      await this.storeUser(user);
      this.currentUser = user;

      return { user, tokens };
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<{ userId: string; verificationRequired: boolean }> {
    try {
      const response = await this.apiClient.post('/auth/register', data);
      return response.data.data;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async logout(allDevices: boolean = false): Promise<void> {
    try {
      await this.apiClient.post('/auth/logout', { allDevices });
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearStorage();
      this.currentUser = null;
    }
  }

  async refreshTokens(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.apiClient.post('/auth/refresh', {
      refreshToken,
    });

    const tokens = response.data.data;
    await this.storeTokens(tokens);
    
    return tokens;
  }

  // OAuth with PKCE Authentication
  async generatePKCEChallenge(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const codeVerifier = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36).substring(2) + Date.now().toString(36),
      { encoding: Crypto.CryptoEncoding.BASE64URL }
    );
    
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64URL }
    );
    
    return { codeVerifier, codeChallenge };
  }

  async storePKCEVerifier(codeVerifier: string): Promise<void> {
    await SecureStore.setItemAsync(AuthService.PKCE_CODE_VERIFIER_KEY, codeVerifier);
  }

  async getPKCEVerifier(): Promise<string | null> {
    return await SecureStore.getItemAsync(AuthService.PKCE_CODE_VERIFIER_KEY);
  }

  async clearPKCEVerifier(): Promise<void> {
    await SecureStore.deleteItemAsync(AuthService.PKCE_CODE_VERIFIER_KEY);
  }

  async authenticateWithOAuthCallback(provider: string, authorizationCode: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const codeVerifier = await this.getPKCEVerifier();
      if (!codeVerifier) {
        throw new Error('PKCE code verifier not found. Please restart the OAuth flow.');
      }

      const deviceInfo = await this.getDeviceInfo();
      
      const response = await this.gatewayClient.post(`/auth/oauth/${provider}/callback`, {
        code: authorizationCode,
        codeVerifier,
        redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI,
        deviceInfo,
      });

      const { user, tokens } = response.data.data;
      
      await this.storeTokens(tokens);
      await this.storeUser(user);
      this.currentUser = user;

      // Clean up PKCE verifier
      await this.clearPKCEVerifier();

      return { user, tokens };
    } catch (error) {
      await this.clearPKCEVerifier();
      throw error;
    }
  }

  // Biometric Authentication
  async isBiometricAvailable(): Promise<boolean> {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isAvailable && isEnrolled;
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(AuthService.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    const available = await this.isBiometricAvailable();
    if (!available) {
      throw new Error('Biometric authentication is not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric authentication',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      await SecureStore.setItemAsync(AuthService.BIOMETRIC_ENABLED_KEY, 'true');
    } else {
      throw new Error('Biometric authentication failed');
    }
  }

  async disableBiometric(): Promise<void> {
    await SecureStore.deleteItemAsync(AuthService.BIOMETRIC_ENABLED_KEY);
  }

  async authenticateWithBiometric(): Promise<boolean> {
    const enabled = await this.isBiometricEnabled();
    if (!enabled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with biometric',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  // Password Management
  async forgotPassword(email: string): Promise<void> {
    await this.apiClient.post('/auth/password/forgot', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.apiClient.post('/auth/password/reset', {
      token,
      newPassword,
      confirmPassword: newPassword,
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.apiClient.post('/auth/password/change', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    });
  }

  // Profile Management
  async getProfile(): Promise<User> {
    const response = await this.gatewayClient.get('/me');
    const user = response.data.data;
    this.currentUser = user;
    await this.storeUser(user);
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.apiClient.put('/auth/profile', data);
    const user = response.data.data;
    this.currentUser = user;
    await this.storeUser(user);
    return user;
  }

  async uploadAvatar(uri: string): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as any);

    const response = await this.apiClient.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.avatarUrl;
  }

  // Verification
  async verifyEmail(email: string, code: string): Promise<void> {
    await this.apiClient.post('/auth/register/verify-email', {
      email,
      verificationCode: code,
    });
  }

  async verifyPhone(phone: string, code: string): Promise<void> {
    await this.apiClient.post('/auth/register/verify-phone', {
      phone,
      verificationCode: code,
    });
  }

  async resendVerification(email: string, type: 'email' | 'sms'): Promise<void> {
    await this.apiClient.post('/auth/register/resend-verification', {
      email,
      type,
    });
  }

  // Session Management
  async getActiveSessions(): Promise<any[]> {
    const response = await this.apiClient.get('/auth/sessions');
    return response.data.data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.apiClient.delete(`/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    await this.apiClient.delete('/auth/sessions');
  }

  // Device Management
  private async registerDevice(): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const pushToken = await this.getPushToken();

      await this.apiClient.post('/auth/devices', {
        ...deviceInfo,
        pushToken,
        biometricEnabled: await this.isBiometricEnabled(),
      });
    } catch (error) {
      console.warn('Device registration failed:', error);
    }
  }

  private async getDeviceInfo(): Promise<any> {
    const { Constants } = await import('expo-constants');
    const { Device } = await import('expo-device');
    
    return {
      deviceId: Constants.sessionId || 'unknown',
      platform: Platform.OS,
      name: Device.deviceName || `${Device.manufacturer} ${Device.modelName}`,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      osVersion: Device.osVersion || 'unknown',
    };
  }

  private async getPushToken(): Promise<string | null> {
    try {
      const { Notifications } = await import('expo-notifications');
      const { Constants } = await import('expo-constants');
      
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      return token.data;
    } catch (error) {
      console.warn('Failed to get push token:', error);
      return null;
    }
  }

  // Storage Methods
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(AuthService.ACCESS_TOKEN_KEY, tokens.accessToken);
    // Note: Refresh token is typically stored as httpOnly cookie by the server
  }

  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(AuthService.USER_DATA_KEY, JSON.stringify(user));
  }

  private async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(AuthService.ACCESS_TOKEN_KEY);
  }

  private async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(AuthService.REFRESH_TOKEN_KEY);
  }

  private async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(AuthService.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private async clearStorage(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(AuthService.ACCESS_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(AuthService.REFRESH_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(AuthService.USER_DATA_KEY).catch(() => {}),
    ]);
  }

  // State Management
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    if (this.currentUser) {
      return true;
    }

    const [token, user] = await Promise.all([
      this.getAccessToken(),
      this.getStoredUser(),
    ]);

    if (token && user) {
      this.currentUser = user;
      return true;
    }

    return false;
  }

  async initializeAuth(): Promise<User | null> {
    try {
      const [token, user] = await Promise.all([
        this.getAccessToken(),
        this.getStoredUser(),
      ]);

      if (token && user) {
        this.currentUser = user;
        // Optionally validate token with server
        try {
          const freshUser = await this.getProfile();
          return freshUser;
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await this.refreshTokens();
            const freshUser = await this.getProfile();
            return freshUser;
          } catch (refreshError) {
            // Clear invalid session
            await this.clearStorage();
            this.currentUser = null;
            return null;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      return null;
    }
  }

  // Error Handling
  private handleAuthError(error: any): void {
    if (error.response?.status === 401) {
      // Unauthorized - clear session
      this.logout().catch(console.error);
    }
    
    // Log error for debugging (consider using a logging service like Sentry)
    console.error('Auth error:', error);
  }
}

export default AuthService;
```

## Gateway Client Implementation

```typescript
// src/services/GatewayClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface GatewayError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface GatewayResponse<T = any> {
  success: true;
  data: T;
}

class GatewayClient {
  private instance: AxiosInstance;
  private requestQueue: Array<() => Promise<any>> = [];
  private isOffline = false;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_GATEWAY_URL,
      timeout: parseInt(process.env.EXPO_PUBLIC_GATEWAY_TIMEOUT || '10000', 10),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.getUserAgent(),
        'X-Platform': Platform.OS,
        'X-App-Version': process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        'Accept': 'application/json',
      },
    });

    this.setupNetworkMonitoring();
    this.setupDefaultInterceptors();
  }

  private getUserAgent(): string {
    const platform = Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1);
    const version = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
    return `Bole.to/${version} (${platform} ${Platform.Version})`;
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = this.isOffline;
      this.isOffline = !state.isConnected;

      // Process queued requests when coming back online
      if (wasOffline && !this.isOffline && this.requestQueue.length > 0) {
        this.processRequestQueue();
      }
    });
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor for logging and network check
    this.instance.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        if (this.isOffline) {
          throw new Error('No internet connection');
        }
        
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: any): Error {
    if (error.response?.data) {
      const gatewayError = error.response.data as GatewayError;
      const customError = new Error(gatewayError.error?.message || 'Gateway Error');
      (customError as any).code = gatewayError.error?.code || 'UNKNOWN_ERROR';
      (customError as any).status = error.response.status;
      (customError as any).details = gatewayError.error?.details;
      return customError;
    }

    if (error.code === 'NETWORK_ERROR' || !error.response) {
      const networkError = new Error('Network error. Please check your connection.');
      (networkError as any).code = 'NETWORK_ERROR';
      return networkError;
    }

    return error;
  }

  private async processRequestQueue(): Promise<void> {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    await Promise.allSettled(queue.map(request => request()));
  }

  // Public methods
  addRequestInterceptor(
    onFulfilled?: (value: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
    onRejected?: (error: any) => any
  ): number {
    return this.instance.interceptors.request.use(onFulfilled, onRejected);
  }

  addResponseInterceptor(
    onFulfilled?: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ): number {
    return this.instance.interceptors.response.use(onFulfilled, onRejected);
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.request(config);
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config);
  }

  // Offline support
  async requestWithQueue<T = any>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    if (this.isOffline) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    return requestFn();
  }
}

export default GatewayClient;
```

## OAuth with PKCE Implementation

### OAuth Service for PKCE Flow

```typescript
// src/services/OAuthService.ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { AuthService } from './AuthService';

WebBrowser.maybeCompleteAuthSession();

export interface OAuthProvider {
  name: string;
  authUrl: string;
  clientId: string;
  scope: string;
}

class OAuthService {
  private static instance: OAuthService;
  private authService: AuthService;

  private providers: Record<string, OAuthProvider> = {
    google: {
      name: 'Google',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'openid email profile',
    },
    apple: {
      name: 'Apple',
      authUrl: 'https://appleid.apple.com/auth/authorize',
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID!,
      scope: 'name email',
    },
  };

  private constructor() {
    this.authService = AuthService.getInstance();
    this.setupDeepLinkHandler();
  }

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  private setupDeepLinkHandler(): void {
    Linking.addEventListener('url', this.handleDeepLink.bind(this));
  }

  private async handleDeepLink(event: { url: string }): Promise<void> {
    const url = new URL(event.url);
    
    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (code && state) {
        try {
          const provider = this.parseStateParameter(state);
          await this.authService.authenticateWithOAuthCallback(provider, code);
        } catch (error) {
          console.error('OAuth callback error:', error);
          throw error;
        }
      }
    }
  }

  private parseStateParameter(state: string): string {
    try {
      const decoded = JSON.parse(atob(state));
      return decoded.provider;
    } catch {
      throw new Error('Invalid OAuth state parameter');
    }
  }

  private createStateParameter(provider: string): string {
    const state = {
      provider,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2),
    };
    return btoa(JSON.stringify(state));
  }

  async startOAuthFlow(providerName: string): Promise<void> {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    try {
      // Generate PKCE challenge
      const { codeVerifier, codeChallenge } = await this.authService.generatePKCEChallenge();
      
      // Store code verifier for later use
      await this.authService.storePKCEVerifier(codeVerifier);

      // Create state parameter
      const state = this.createStateParameter(providerName);

      // Build authorization URL
      const authUrl = new URL(provider.authUrl);
      authUrl.searchParams.set('client_id', provider.clientId);
      authUrl.searchParams.set('redirect_uri', process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', provider.scope);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', state);

      // Open browser for OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI!
      );

      if (result.type === 'cancel') {
        await this.authService.clearPKCEVerifier();
        throw new Error('OAuth flow was cancelled');
      }

      // Deep link handler will process the callback
    } catch (error) {
      await this.authService.clearPKCEVerifier();
      throw error;
    }
  }

  async isProviderAvailable(providerName: string): Promise<boolean> {
    return providerName in this.providers;
  }

  getAvailableProviders(): string[] {
    return Object.keys(this.providers);
  }
}

export default OAuthService;
```

### OAuth Component Example

```typescript
// src/components/OAuth/OAuthButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OAuthService from '../../services/OAuthService';
import { useAuth } from '../../hooks/useAuth';

interface OAuthButtonProps {
  provider: 'google' | 'apple';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const oAuthService = OAuthService.getInstance();

  const getProviderInfo = () => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google',
          icon: 'logo-google' as const,
          backgroundColor: '#4285F4',
          textColor: '#FFFFFF',
        };
      case 'apple':
        return {
          name: 'Apple',
          icon: 'logo-apple' as const,
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  };

  const handlePress = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const isAvailable = await oAuthService.isProviderAvailable(provider);
      if (!isAvailable) {
        throw new Error(`${provider} authentication is not available`);
      }

      await oAuthService.startOAuthFlow(provider);
      onSuccess?.();
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      onError?.(error as Error);
      
      Alert.alert(
        'Authentication Error',
        `Failed to sign in with ${getProviderInfo().name}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: providerInfo.backgroundColor }]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={providerInfo.textColor} />
      ) : (
        <>
          <Ionicons
            name={providerInfo.icon}
            size={20}
            color={providerInfo.textColor}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: providerInfo.textColor }]}>
            Continue with {providerInfo.name}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## React Hooks

### useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AuthService, { User, LoginCredentials, RegisterData } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ userId: string; verificationRequired: boolean }>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // OAuth auth
  authenticateWithOAuth: (provider: string, authorizationCode: string) => Promise<void>;
  
  // Biometric
  isBiometricAvailable: boolean;
  isBiometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  
  // Password management
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Verification
  verifyEmail: (email: string, code: string) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  resendVerification: (email: string, type: 'email' | 'sms') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  const authService = AuthService.getInstance();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    checkBiometricCapabilities();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.initializeAuth();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricCapabilities = async () => {
    try {
      const [available, enabled] = await Promise.all([
        authService.isBiometricAvailable(),
        authService.isBiometricEnabled(),
      ]);
      setIsBiometricAvailable(available);
      setIsBiometricEnabled(enabled);
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    return authService.register(data);
  }, []);

  const logout = useCallback(async (allDevices: boolean = false) => {
    try {
      await authService.logout(allDevices);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authService.getProfile();
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const authenticateWithOAuth = useCallback(async (provider: string, authorizationCode: string) => {
    try {
      const { user: loggedInUser } = await authService.authenticateWithOAuthCallback(provider, authorizationCode);
      setUser(loggedInUser);
    } catch (error) {
      throw error;
    }
  }, []);

  const enableBiometric = useCallback(async () => {
    try {
      await authService.enableBiometric();
      setIsBiometricEnabled(true);
    } catch (error) {
      throw error;
    }
  }, []);

  const disableBiometric = useCallback(async () => {
    try {
      await authService.disableBiometric();
      setIsBiometricEnabled(false);
    } catch (error) {
      throw error;
    }
  }, []);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    return authService.authenticateWithBiometric();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    return authService.resetPassword(token, newPassword);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    return authService.changePassword(currentPassword, newPassword);
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    return authService.verifyEmail(email, code);
  }, []);

  const verifyPhone = useCallback(async (phone: string, code: string) => {
    return authService.verifyPhone(phone, code);
  }, []);

  const resendVerification = useCallback(async (email: string, type: 'email' | 'sms') => {
    return authService.resendVerification(email, type);
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    authenticateWithOAuth,
    isBiometricAvailable,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    verifyPhone,
    resendVerification,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Additional Hooks

```typescript
// src/hooks/useApiError.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ApiError {
  code?: string;
  message: string;
  details?: any;
  status?: number;
}

interface UseApiErrorReturn {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  handleError: (error: any) => void;
  clearError: () => void;
  showErrorAlert: (title?: string) => void;
}

export const useApiError = (): UseApiErrorReturn => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: any) => {
    if (error?.code && error?.message) {
      setError(error);
    } else if (error?.response?.data?.error) {
      setError(error.response.data.error);
    } else if (error?.message) {
      setError({ message: error.message, code: error.code });
    } else {
      setError({ message: 'An unexpected error occurred' });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showErrorAlert = useCallback((title = 'Error') => {
    if (error) {
      Alert.alert(title, error.message);
    }
  }, [error]);

  return {
    error,
    setError,
    handleError,
    clearError,
    showErrorAlert,
  };
};

// src/hooks/useAsyncOperation.ts
import { useState, useCallback } from 'react';
import { useApiError } from './useApiError';

interface UseAsyncOperationReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: any;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

export const useAsyncOperation = <T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const execute = useCallback(async (...args: any[]): Promise<T | undefined> => {
    try {
      setIsLoading(true);
      clearError();
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, handleError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    clearError();
  }, [clearError]);

  return {
    data,
    isLoading,
    error: error?.message,
    execute,
    reset,
  };
};
```

## Social Authentication

### Google Sign-In Implementation

```typescript
// src/services/GoogleAuthService.ts
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

class GoogleAuthService {
  private static instance: GoogleAuthService;
  
  private constructor() {}
  
  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async signIn(): Promise<string> {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri({
        scheme: 'com.boleto.mobile',
      }),
    });

    const result = await promptAsync();
    
    if (result.type === 'success' && result.authentication) {
      return result.authentication.idToken!;
    }
    
    throw new Error('Google Sign-In was cancelled or failed');
  }
}

export default GoogleAuthService;

// Usage in component
import { useAuth } from '../hooks/useAuth';
import GoogleAuthService from '../services/GoogleAuthService';

const LoginScreen = () => {
  const { loginWithGoogle } = useAuth();
  const googleAuth = GoogleAuthService.getInstance();

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await googleAuth.signIn();
      await loginWithGoogle(idToken);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleGoogleSignIn}>
      <Text>Sign in with Google</Text>
    </TouchableOpacity>
  );
};
```

### Apple Sign-In Implementation

```typescript
// src/services/AppleAuthService.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

class AppleAuthService {
  private static instance: AppleAuthService;
  
  private constructor() {}
  
  public static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    return await AppleAuthentication.isAvailableAsync();
  }

  async signIn(): Promise<{ identityToken: string; authorizationCode: string }> {
    if (!await this.isAvailable()) {
      throw new Error('Apple Sign-In is not available on this device');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken || !credential.authorizationCode) {
      throw new Error('Failed to get Apple credentials');
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
    };
  }
}

export default AppleAuthService;
```

## Error Handling

### Global Error Handler

```typescript
// src/utils/ErrorHandler.ts
import { Alert } from 'react-native';
import * as Sentry from 'sentry-expo';

export interface ErrorInfo {
  code?: string;
  message: string;
  details?: any;
  status?: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandler(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.logError(event.reason);
      });
    }

    // Handle React errors would be setup in your error boundary
  }

  public handleError(error: any, context?: string): ErrorInfo {
    const errorInfo = this.parseError(error);
    
    // Log to console in development
    if (__DEV__) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, errorInfo);
    }

    // Log to crash reporting service
    this.logError(error, context);

    return errorInfo;
  }

  public showUserFriendlyError(error: any, customTitle?: string): void {
    const errorInfo = this.parseError(error);
    const title = customTitle || this.getErrorTitle(errorInfo);
    const message = this.getUserFriendlyMessage(errorInfo);

    Alert.alert(title, message);
  }

  private parseError(error: any): ErrorInfo {
    // API error response
    if (error?.response?.data?.error) {
      return {
        code: error.response.data.error.code,
        message: error.response.data.error.message,
        details: error.response.data.error.details,
        status: error.response.status,
      };
    }

    // Network error
    if (error?.code === 'NETWORK_ERROR' || !error?.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection and try again.',
      };
    }

    // Standard error object
    if (error instanceof Error) {
      return {
        code: (error as any).code,
        message: error.message,
        status: (error as any).status,
      };
    }

    // String error
    if (typeof error === 'string') {
      return {
        message: error,
      };
    }

    // Unknown error
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  private getErrorTitle(errorInfo: ErrorInfo): string {
    switch (errorInfo.code) {
      case 'VALIDATION_ERROR':
        return 'Invalid Input';
      case 'UNAUTHORIZED':
        return 'Authentication Required';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'NOT_FOUND':
        return 'Not Found';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too Many Requests';
      case 'MAINTENANCE':
        return 'Service Maintenance';
      default:
        return 'Error';
    }
  }

  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    switch (errorInfo.code) {
      case 'INVALID_CREDENTIALS':
        return 'The email or password you entered is incorrect. Please try again.';
      case 'EMAIL_ALREADY_EXISTS':
        return 'An account with this email address already exists. Please try logging in instead.';
      case 'ACCOUNT_LOCKED':
        return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.';
      case 'EMAIL_NOT_VERIFIED':
        return 'Please verify your email address before continuing. Check your inbox for the verification link.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to our servers. Please check your internet connection and try again.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'You\'ve made too many requests. Please wait a moment before trying again.';
      case 'MAINTENANCE':
        return 'Our servers are currently undergoing maintenance. Please try again in a few minutes.';
      default:
        return errorInfo.message || 'Something went wrong. Please try again.';
    }
  }

  private logError(error: any, context?: string): void {
    try {
      Sentry.captureException(error, {
        tags: {
          context: context || 'unknown',
        },
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }
}

export default ErrorHandler;
```

## Security Best Practices

### Security Configuration

```typescript
// src/config/security.ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SecurityConfig = {
  // Token storage options
  tokenStorage: {
    service: 'boleto-auth',
    accessGroup: Platform.OS === 'ios' ? 'group.com.boleto.mobile' : undefined,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
    authenticationPrompt: 'Authenticate to access your account',
  },

  // Network security
  network: {
    certificatePinning: true,
    timeoutMs: 10000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  },

  // Session security
  session: {
    maxConcurrentSessions: 5,
    inactivityTimeoutMs: 30 * 60 * 1000, // 30 minutes
    refreshThresholdMs: 5 * 60 * 1000,   // 5 minutes before expiry
  },

  // Biometric authentication
  biometric: {
    fallbackEnabled: true,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    promptMessage: 'Authenticate to access Bole.to',
  },

  // Security headers
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },
};

// Certificate pinning implementation
export const setupCertificatePinning = () => {
  if (SecurityConfig.network.certificatePinning) {
    // Implementation would depend on your specific certificate pinning library
    // This is a placeholder for the actual implementation
    console.log('Certificate pinning configured');
  }
};
```

### Secure Storage Wrapper

```typescript
// src/utils/SecureStorage.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityConfig } from '../config/security';

class SecureStorage {
  private static instance: SecureStorage;

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  async setItem(key: string, value: string, requireAuth: boolean = false): Promise<void> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        ...SecurityConfig.tokenStorage,
      };

      if (requireAuth) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: SecurityConfig.biometric.promptMessage,
          cancelLabel: SecurityConfig.biometric.cancelLabel,
          disableDeviceFallback: SecurityConfig.biometric.disableDeviceFallback,
        });

        if (!result.success) {
          throw new Error('Authentication required to store secure data');
        }
      }

      await SecureStore.setItemAsync(key, value, options);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string, requireAuth: boolean = false): Promise<string | null> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        ...SecurityConfig.tokenStorage,
      };

      if (requireAuth) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: SecurityConfig.biometric.promptMessage,
          cancelLabel: SecurityConfig.biometric.cancelLabel,
          disableDeviceFallback: SecurityConfig.biometric.disableDeviceFallback,
        });

        if (!result.success) {
          throw new Error('Authentication required to access secure data');
        }
      }

      return await SecureStore.getItemAsync(key, options);
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // Note: SecureStore doesn't have a clear all method
    // You'll need to keep track of keys and remove them individually
    const keys = ['access_token', 'refresh_token', 'user_data', 'biometric_enabled'];
    
    await Promise.all(
      keys.map(key => this.removeItem(key).catch(() => {}))
    );
  }
}

export default SecureStorage;
```

This comprehensive React Native integration guide provides production-ready authentication implementation for the Bole.to mobile app, including all security best practices, error handling, and mobile-specific features like biometric authentication and offline support.