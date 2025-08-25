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
    
    const defaultHeaders = {
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
  private client: GatewayClient;

  // Secure storage keys
  private static readonly ACCESS_TOKEN_KEY = 'gateway_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'gateway_refresh_token';
  private static readonly USER_DATA_KEY = 'user_data';
  private static readonly PKCE_CODE_VERIFIER_KEY = 'pkce_code_verifier';

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

  // OAuth with PKCE Methods
  async generatePKCEChallenge(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    // Generate code verifier (random string)
    const array = new Uint8Array(32);
    await Crypto.getRandomBytesAsync(32, array);
    const codeVerifier = Array.from(array, byte => 
      String.fromCharCode(byte)
    ).join('').replace(/[^a-zA-Z0-9\-._~]/g, '').substring(0, 128);
    
    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    const codeChallenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64URL }
    );
    
    return { codeVerifier, codeChallenge };
  }

  async storePKCEVerifier(codeVerifier: string): Promise<void> {
    await SecureStore.setItemAsync(GatewayAuthService.PKCE_CODE_VERIFIER_KEY, codeVerifier);
  }

  async getPKCEVerifier(): Promise<string | null> {
    return await SecureStore.getItemAsync(GatewayAuthService.PKCE_CODE_VERIFIER_KEY);
  }

  async clearPKCEVerifier(): Promise<void> {
    await SecureStore.deleteItemAsync(GatewayAuthService.PKCE_CODE_VERIFIER_KEY);
  }

  async authenticateWithOAuthCallback(provider: string, authorizationCode: string): Promise<OAuthResponse> {
    const codeVerifier = await this.getPKCEVerifier();
    if (!codeVerifier) {
      throw new GatewayError('PKCE_VERIFIER_MISSING', 'PKCE code verifier not found', 400);
    }

    const deviceInfo = await this.getDeviceInfo();
    
    try {
      const response = await this.client.request(`/auth/oauth/${provider}/callback`, {
        method: 'POST',
        body: JSON.stringify({
          code: authorizationCode,
          codeVerifier,
          redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI || 'com.bole.to://oauth/callback',
          deviceInfo,
        }),
      });

      const { user, tokens, isNewUser, linkedProvider } = response.data;
      
      await this.storeTokens(tokens);
      await this.storeUser(user);
      await this.clearPKCEVerifier();

      return { user, tokens, isNewUser, linkedProvider };
    } catch (error) {
      await this.clearPKCEVerifier();
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
      const randomBytes = new Uint8Array(16);
      await Crypto.getRandomBytesAsync(16, randomBytes);
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
    await this.clearPKCEVerifier();
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
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async authenticateWithBiometrics(reason: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
    });
    
    return result.success;
  }
}