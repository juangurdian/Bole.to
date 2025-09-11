import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { NetworkManager } from './networkManager';
import { retryWithBackoff, RetryConfigs, isNetworkError } from '../utils/retryUtils';
import { securityLogger, SecurityEventType, SecuritySeverity } from '../security/securityLogger';
import { secureStorage } from '../security/secureStorage';
import { biometricSecurity, SensitiveOperation } from '../security/biometricSecurity';
import { deviceSecurity } from '../security/deviceSecurity';

// Hi.Events API Response Types
export interface HiEventsUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_verified_at: string | null;
  timezone: string;
  avatar_url?: string;
  phone?: string;
  phone_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HiEventsAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  is_personal: boolean;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface HiEventsLoginResponse {
  success: true;
  data: {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    expires_at: string;
    user: HiEventsUser;
    accounts: HiEventsAccount[];
    current_account?: HiEventsAccount;
  };
}

export interface HiEventsRefreshResponse {
  success: true;
  data: {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    expires_at: string;
  };
}

export interface HiEventsLogoutRequest {
  everywhere?: boolean; // Logout from all devices
}

export interface HiEventsTokenVerifyResponse {
  success: true;
  data: {
    valid: boolean;
    user?: HiEventsUser;
    expires_at: string;
  };
}

export interface HiEventsErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface HiEventsLoginRequest {
  email: string;
  password: string;
  account_id?: string;
  device_info: DeviceInfo;
}

export interface HiEventsSwitchAccountRequest {
  account_id: string;
}

export interface DeviceInfo {
  device_id: string;
  platform: 'ios' | 'android';
  app_version: string;
  os_version: string;
  device_name?: string;
}

export interface TokenMetadata {
  created_at: string;
  expires_at: string;
  expires_in: number;
}

// Custom error class for Hi.Events API errors
export class HiEventsError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'HiEventsError';
  }
}

// Hi.Events HTTP client
class HiEventsClient {
  private baseURL: string;
  
  constructor() {
    // Use environment variable or fallback to development
    this.baseURL = process.env.EXPO_PUBLIC_HIEVENTS_URL || 'http://localhost:8000';
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

    const token = await SecureStore.getItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY);
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

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new HiEventsError(
        responseData.error?.code || 'UNKNOWN_ERROR',
        responseData.error?.message || 'An unexpected error occurred',
        response.status,
        responseData.error?.details
      );
    }

    return responseData;
  }

  private getUserAgent(): string {
    const platform = Platform.OS.charAt(0).toUpperCase() + Platform.OS.slice(1);
    const version = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
    return `Bole.to-Mobile/${version} (${platform})`;
  }
}

// Main Hi.Events Authentication Service
export class HiEventsAuthClient {
  private static instance: HiEventsAuthClient;
  public client: HiEventsClient;
  private networkManager: NetworkManager;
  private refreshPromise: Promise<string> | null = null;

  // Hi.Events Secure storage keys
  public static readonly ACCESS_TOKEN_KEY = 'hiEvents_access_token';
  public static readonly USER_DATA_KEY = 'hiEvents_user_data';
  public static readonly CURRENT_ACCOUNT_KEY = 'hiEvents_current_account';
  public static readonly TOKEN_METADATA_KEY = 'hiEvents_token_metadata';
  public static readonly DEVICE_ID_KEY = 'device_id';

  private constructor() {
    this.client = new HiEventsClient();
    this.networkManager = NetworkManager.getInstance();
  }

  public static getInstance(): HiEventsAuthClient {
    if (!HiEventsAuthClient.instance) {
      HiEventsAuthClient.instance = new HiEventsAuthClient();
    }
    return HiEventsAuthClient.instance;
  }

  // Authentication Methods
  async login(credentials: {
    email: string;
    password: string;
    accountId?: string;
    rememberMe?: boolean;
  }): Promise<{
    user: HiEventsUser;
    accounts: HiEventsAccount[];
    currentAccount?: HiEventsAccount;
  }> {
    securityLogger.info('Attempting Hi.Events login', { email: credentials.email.replace(/(.{2}).*(@.*)/, '$1***$2') }, 'HiEventsAuth');
    
    // Check device security before login
    const deviceAssessment = await deviceSecurity.getSecurityAssessment();
    if (deviceAssessment.status === 'compromised') {
      securityLogger.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: SecuritySeverity.HIGH,
        message: 'Login attempt from compromised device blocked',
        metadata: { trustScore: deviceAssessment.trustScore }
      });
      throw new HiEventsError('DEVICE_COMPROMISED', 'Login not allowed from compromised device');
    }
    const deviceInfo = await this.getDeviceInfo();
    
    const loginRequest: HiEventsLoginRequest = {
      email: credentials.email,
      password: credentials.password,
      account_id: credentials.accountId,
      device_info: deviceInfo,
    };

    const response: HiEventsLoginResponse = await this.client.request('/api/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify(loginRequest),
    });

    const { access_token, token_type, expires_in, expires_at, user, accounts, current_account } = response.data;
    
    // Store tokens and metadata
    await this.storeToken(access_token);
    await this.storeTokenMetadata({
      created_at: new Date().toISOString(),
      expires_at,
      expires_in,
    });
    
    // Store user and account data
    await this.storeUser(user);
    if (current_account) {
      await this.storeCurrentAccount(current_account);
    }

    securityLogger.logSecurityEvent({
      type: SecurityEventType.AUTH_SUCCESS,
      severity: SecuritySeverity.INFO,
      message: 'Hi.Events login successful',
      metadata: { 
        userId: user.id,
        accountId: current_account?.id,
        deviceTrustScore: deviceAssessment.trustScore 
      }
    });
    return { user, accounts, currentAccount: current_account };
  }

  async logout(everywhere: boolean = false): Promise<void> {
    securityLogger.info(`Initiating logout${everywhere ? ' from all devices' : ''}`, {}, 'HiEventsAuth');
    
    // Require biometric authentication for logout from all devices
    if (everywhere) {
      const biometricResult = await biometricSecurity.authenticateForOperation(
        SensitiveOperation.LOGOUT_ALL_DEVICES,
        'Authenticate to logout from all devices'
      );
      
      if (!biometricResult.success) {
        securityLogger.logSecurityEvent({
          type: SecurityEventType.AUTH_FAILURE,
          severity: SecuritySeverity.MEDIUM,
          message: 'Biometric authentication failed for logout all devices',
          metadata: { reason: biometricResult.failureReason }
        });
        throw new HiEventsError('BIOMETRIC_REQUIRED', 'Biometric authentication required for this operation');
      }
    }
    
    // Prepare logout request
    const logoutRequest: HiEventsLogoutRequest = {
      everywhere
    };

    try {
      // Attempt server-side logout with retry logic
      const logoutOperation = async () => {
        return await this.client.request('/api/auth/mobile/logout', {
          method: 'POST',
          body: JSON.stringify(logoutRequest),
        });
      };

      // Use network-aware execution if connected
      if (this.networkManager.isConnected()) {
        await this.networkManager.executeWhenOnline(logoutOperation, {
          priority: 'high',
          timeout: 10000, // 10 second timeout for logout
          requireStable: false
        });
      } else {
        securityLogger.warn('Offline during logout - server-side logout skipped', {}, 'HiEventsAuth');
      }
    } catch (error) {
      securityLogger.error('Server-side logout failed', securityLogger.sanitizeError(error), 'HiEventsAuth');
      // Continue with local cleanup even if server logout fails
    }

    try {
      // Always perform comprehensive local cleanup
      await this.performComprehensiveCleanup();
      securityLogger.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        severity: SecuritySeverity.INFO,
        message: 'Logout completed successfully',
        metadata: { everywhere }
      });
    } catch (cleanupError) {
      securityLogger.error('Error during logout cleanup', securityLogger.sanitizeError(cleanupError), 'HiEventsAuth');
      // Still throw to indicate logout issues
      throw cleanupError;
    }
  }

  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.executeTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeTokenRefresh(): Promise<string> {
    const refreshOperation = async (): Promise<string> => {
      // Check network connectivity
      if (!this.networkManager.isConnected()) {
        throw new Error('Network connection required for token refresh');
      }

      securityLogger.debug('Executing token refresh', {}, 'HiEventsAuth');
      const response: HiEventsRefreshResponse = await this.client.request('/api/auth/mobile/refresh', {
        method: 'POST',
      });

      const { access_token, expires_in, expires_at } = response.data;
      
      await this.storeToken(access_token);
      await this.storeTokenMetadata({
        created_at: new Date().toISOString(),
        expires_at,
        expires_in,
      });
      
      securityLogger.logSecurityEvent({
        type: SecurityEventType.TOKEN_REFRESH,
        severity: SecuritySeverity.INFO,
        message: 'Token refreshed successfully',
        metadata: {}
      });
      return access_token;
    };

    // Execute with retry logic and circuit breaker
    return await this.networkManager.executeWithAuthCircuitBreaker(async () => {
      return await retryWithBackoff(refreshOperation, {
        ...RetryConfigs.auth,
        retryIf: (error: any) => {
          // Custom retry logic for token refresh
          if (error.status === 401 || error.status === 403) {
            // Don't retry on authentication errors
            return false;
          }
          return RetryConfigs.auth.retryIf?.(error) ?? false;
        }
      });
    });
  }

  async switchAccount(accountId: string): Promise<HiEventsAccount> {
    const switchRequest: HiEventsSwitchAccountRequest = {
      account_id: accountId,
    };

    securityLogger.info('Switching account', { accountId }, 'HiEventsAuth');
    
    // Require biometric authentication for account switching
    const biometricResult = await biometricSecurity.authenticateForOperation(
      SensitiveOperation.ACCOUNT_SWITCH,
      'Authenticate to switch accounts'
    );
    
    if (!biometricResult.success) {
      securityLogger.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: SecuritySeverity.MEDIUM,
        message: 'Biometric authentication failed for account switch',
        metadata: { targetAccountId: accountId, reason: biometricResult.failureReason }
      });
      throw new HiEventsError('BIOMETRIC_REQUIRED', 'Biometric authentication required for account switching');
    }

    // Use network-aware execution with retry
    const switchOperation = async () => {
      const response = await this.client.request('/api/auth/mobile/switch-account', {
        method: 'POST',
        body: JSON.stringify(switchRequest),
      });

      const account = response.data.account;
      await this.storeCurrentAccount(account);
      
      securityLogger.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        severity: SecuritySeverity.INFO,
        message: 'Account switch successful',
        metadata: { newAccountId: accountId }
      });
      return account;
    };

    return await retryWithBackoff(switchOperation, RetryConfigs.auth);
  }

  async getMe(): Promise<{ user: HiEventsUser; accounts: HiEventsAccount[]; currentAccount?: HiEventsAccount }> {
    // Use network-aware execution
    const getMeOperation = async () => {
      const response = await this.client.request('/api/auth/mobile/me', {
        method: 'GET',
      });
      
      const { user, accounts, current_account } = response.data;
      
      // Update stored data
      await this.storeUser(user);
      if (current_account) {
        await this.storeCurrentAccount(current_account);
      }
      
      return { user, accounts, currentAccount: current_account };
    };

    return await this.networkManager.executeWhenOnline(getMeOperation, {
      priority: 'normal',
      timeout: 15000,
      requireStable: false
    });
  }

  async verifyToken(): Promise<boolean> {
    try {
      // Use dedicated token verification endpoint if available
      const response: HiEventsTokenVerifyResponse = await this.client.request('/api/auth/mobile/verify', {
        method: 'GET',
      });
      
      return response.data.valid;
    } catch (error) {
      if (error instanceof HiEventsError && error.status === 401) {
        return false;
      }
      
      // Fallback to getMe() if verify endpoint is not available
      try {
        await this.getMe();
        return true;
      } catch (meError) {
        if (meError instanceof HiEventsError && meError.status === 401) {
          return false;
        }
        throw meError;
      }
    }
  }

  // Token Management
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY);
  }

  async isTokenValid(): Promise<boolean> {
    const token = await this.getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      // Check expiration from stored metadata first
      const metadata = await this.getTokenMetadata();
      if (metadata) {
        const now = new Date();
        const expiresAt = new Date(metadata.expires_at);
        // Consider token expired if less than 60 seconds remaining
        const bufferMs = 60 * 1000;
        const isValid = expiresAt.getTime() > (now.getTime() + bufferMs);
        
        // Handle potential clock skew
        if (!isValid) {
          const skew = Math.abs(now.getTime() - Date.now());
          const maxSkew = 5 * 60 * 1000; // 5 minutes
          
          if (skew > maxSkew) {
            securityLogger.warn('Potential clock skew detected, performing server validation', { skew }, 'HiEventsAuth');
            return await this.verifyTokenWithServer();
          }
        }
        
        return isValid;
      }

      // Fallback: Decode JWT payload to check expiry (without verification)
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );
      
      const now = Math.floor(Date.now() / 1000);
      const bufferSeconds = 60; // 60 second buffer
      const isValid = payload.exp > (now + bufferSeconds);
      
      // Handle potential clock skew for JWT as well
      if (!isValid && this.networkManager.isConnected()) {
        securityLogger.warn('JWT appears expired, verifying with server due to potential clock skew', {}, 'HiEventsAuth');
        return await this.verifyTokenWithServer();
      }
      
      return isValid;
    } catch (error) {
      securityLogger.warn('Token validation error', securityLogger.sanitizeError(error), 'HiEventsAuth');
      return false;
    }
  }

  private async verifyTokenWithServer(): Promise<boolean> {
    try {
      return await this.verifyToken();
    } catch (error) {
      securityLogger.warn('Server token verification failed', securityLogger.sanitizeError(error), 'HiEventsAuth');
      return false;
    }
  }

  async shouldRefreshToken(): Promise<boolean> {
    const token = await this.getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      // Check if token expires within the next 5 minutes
      const metadata = await this.getTokenMetadata();
      if (metadata) {
        const now = new Date();
        const expiresAt = new Date(metadata.expires_at);
        const fiveMinutesMs = 5 * 60 * 1000;
        return expiresAt.getTime() <= (now.getTime() + fiveMinutesMs);
      }

      // Fallback: Decode JWT payload
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );
      
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      return payload.exp <= (now + fiveMinutes);
    } catch {
      return false;
    }
  }

  // Storage Methods
  private async storeToken(token: string): Promise<void> {
    try {
      // Use encrypted storage for enhanced security
      await secureStorage.storeToken(HiEventsAuthClient.ACCESS_TOKEN_KEY, token);
      securityLogger.debug('Access token stored securely', {}, 'HiEventsAuth');
    } catch (error) {
      securityLogger.error('Failed to store token securely', securityLogger.sanitizeError(error), 'HiEventsAuth');
      // Fallback to basic SecureStore
      await SecureStore.setItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY, token);
    }
  }

  private async storeUser(user: HiEventsUser): Promise<void> {
    try {
      // Use encrypted storage for user data
      await secureStorage.storeEncrypted(HiEventsAuthClient.USER_DATA_KEY, JSON.stringify(user));
      securityLogger.debug('User data stored securely', { userId: user.id }, 'HiEventsAuth');
    } catch (error) {
      securityLogger.error('Failed to store user data securely', securityLogger.sanitizeError(error), 'HiEventsAuth');
      // Fallback to basic SecureStore
      await SecureStore.setItemAsync(HiEventsAuthClient.USER_DATA_KEY, JSON.stringify(user));
    }
  }

  private async storeCurrentAccount(account: HiEventsAccount): Promise<void> {
    try {
      // Use encrypted storage for account data
      await secureStorage.storeEncrypted(HiEventsAuthClient.CURRENT_ACCOUNT_KEY, JSON.stringify(account));
      securityLogger.debug('Account data stored securely', { accountId: account.id }, 'HiEventsAuth');
    } catch (error) {
      securityLogger.error('Failed to store account data securely', securityLogger.sanitizeError(error), 'HiEventsAuth');
      // Fallback to basic SecureStore
      await SecureStore.setItemAsync(HiEventsAuthClient.CURRENT_ACCOUNT_KEY, JSON.stringify(account));
    }
  }

  private async storeTokenMetadata(metadata: TokenMetadata): Promise<void> {
    try {
      // Use encrypted storage for token metadata
      await secureStorage.storeEncrypted(HiEventsAuthClient.TOKEN_METADATA_KEY, JSON.stringify(metadata));
      securityLogger.debug('Token metadata stored securely', {}, 'HiEventsAuth');
    } catch (error) {
      securityLogger.error('Failed to store token metadata securely', securityLogger.sanitizeError(error), 'HiEventsAuth');
      // Fallback to basic SecureStore
      await SecureStore.setItemAsync(HiEventsAuthClient.TOKEN_METADATA_KEY, JSON.stringify(metadata));
    }
  }

  async getStoredUser(): Promise<HiEventsUser | null> {
    const userData = await SecureStore.getItemAsync(HiEventsAuthClient.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  async getStoredCurrentAccount(): Promise<HiEventsAccount | null> {
    const accountData = await SecureStore.getItemAsync(HiEventsAuthClient.CURRENT_ACCOUNT_KEY);
    return accountData ? JSON.parse(accountData) : null;
  }

  async getTokenMetadata(): Promise<TokenMetadata | null> {
    const metadataStr = await SecureStore.getItemAsync(HiEventsAuthClient.TOKEN_METADATA_KEY);
    return metadataStr ? JSON.parse(metadataStr) : null;
  }

  private async clearStoredData(): Promise<void> {
    const promises = [
      SecureStore.deleteItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(HiEventsAuthClient.USER_DATA_KEY),
      SecureStore.deleteItemAsync(HiEventsAuthClient.CURRENT_ACCOUNT_KEY),
      SecureStore.deleteItemAsync(HiEventsAuthClient.TOKEN_METADATA_KEY)
    ];

    await Promise.allSettled(promises);
  }

  private async performComprehensiveCleanup(): Promise<void> {
    securityLogger.info('Performing comprehensive auth cleanup', {}, 'HiEventsAuth');
    
    try {
      // Clear all stored authentication data
      await this.clearStoredData();
      
      // Clear any pending refresh promises
      this.refreshPromise = null;
      
      // Note: TokenLifecycleManager cleanup is handled separately
      // to avoid circular dependencies
      
      securityLogger.info('Comprehensive auth cleanup completed', {}, 'HiEventsAuth');
    } catch (error) {
      securityLogger.error('Error during comprehensive cleanup', securityLogger.sanitizeError(error), 'HiEventsAuth');
      throw error;
    }
  }

  // Utility Methods
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const platform = Platform.OS as 'ios' | 'android';
    
    return {
      device_id: await this.getOrCreateDeviceId(),
      platform,
      app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      os_version: Platform.Version.toString(),
      device_name: await this.getDeviceName(),
    };
  }

  private async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(HiEventsAuthClient.DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a unique device ID
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      deviceId = Array.from(randomBytes, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('');
      
      await SecureStore.setItemAsync(HiEventsAuthClient.DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  }

  private async getDeviceName(): Promise<string> {
    // This could be enhanced with device-specific APIs
    return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
  }

  // Biometric authentication support (inherited from original implementation)
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      securityLogger.warn('Biometric authentication not available', securityLogger.sanitizeError(error), 'HiEventsAuth');
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
      securityLogger.warn('Biometric authentication failed', securityLogger.sanitizeError(error), 'HiEventsAuth');
      return false;
    }
  }
}