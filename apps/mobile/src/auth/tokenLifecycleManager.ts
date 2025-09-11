/**
 * Token Lifecycle Manager
 * Handles proactive token refresh, background scheduling, and lifecycle management
 */

import { AppState, AppStateStatus } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { HiEventsAuthClient, TokenMetadata } from './hiEventsAuthClient';
import { NetworkManager } from './networkManager';
import { retryWithBackoff, RetryConfigs, CircuitBreakerError } from '../utils/retryUtils';

// Background task identifier
const TOKEN_REFRESH_TASK = 'token-refresh-background-task';

export interface TokenLifecycleConfig {
  // Proactive refresh timing
  refreshBufferMinutes: number; // How many minutes before expiry to refresh
  backgroundRefreshInterval: number; // Background check interval in minutes
  
  // App state handling
  refreshOnForeground: boolean; // Refresh when app comes to foreground
  refreshOnLogin: boolean; // Immediate refresh after login
  
  // Network handling
  requireNetwork: boolean; // Whether token operations require network
  offlineGracePeriod: number; // How long to allow offline usage (minutes)
  
  // Health checks
  healthCheckInterval: number; // Periodic health check interval (minutes)
  enableHealthChecks: boolean;
  
  // Clock skew handling
  maxClockSkewMinutes: number; // Maximum allowed clock skew
}

export interface TokenHealthStatus {
  isValid: boolean;
  expiresAt: Date | null;
  timeToExpiry: number | null; // milliseconds
  needsRefresh: boolean;
  lastRefresh: Date | null;
  refreshCount: number;
  errors: string[];
}

/**
 * TokenLifecycleManager handles all aspects of token lifecycle management
 */
export class TokenLifecycleManager {
  private static instance: TokenLifecycleManager;
  private authClient: HiEventsAuthClient;
  private networkManager: NetworkManager;
  
  // Timers and intervals
  private refreshTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private backgroundTaskRegistered: boolean = false;
  
  // State tracking
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;
  private lastRefreshAttempt: number = 0;
  private refreshCount: number = 0;
  private appStateListener: any = null;
  
  // Configuration
  private config: TokenLifecycleConfig = {
    refreshBufferMinutes: 5, // Refresh 5 minutes before expiry
    backgroundRefreshInterval: 15, // Check every 15 minutes in background
    refreshOnForeground: true,
    refreshOnLogin: true,
    requireNetwork: true,
    offlineGracePeriod: 60, // 1 hour offline grace period
    healthCheckInterval: 30, // Health check every 30 minutes
    enableHealthChecks: true,
    maxClockSkewMinutes: 5 // 5 minutes clock skew tolerance
  };
  
  private constructor() {
    this.authClient = HiEventsAuthClient.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.initialize();
  }

  public static getInstance(): TokenLifecycleManager {
    if (!TokenLifecycleManager.instance) {
      TokenLifecycleManager.instance = new TokenLifecycleManager();
    }
    return TokenLifecycleManager.instance;
  }

  private async initialize(): Promise<void> {
    // Set up app state monitoring
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      this.handleAppStateChange(nextAppState);
    });

    // Set up network state monitoring
    this.networkManager.on('online', () => {
      this.handleNetworkOnline();
    });

    this.networkManager.on('offline', () => {
      this.handleNetworkOffline();
    });

    // Register background task
    await this.registerBackgroundTask();
    
    // Start health checks if enabled
    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    // Schedule initial refresh check
    this.scheduleNextRefresh();

    console.log('TokenLifecycleManager initialized');
  }

  // Configuration methods
  public updateConfig(config: Partial<TokenLifecycleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart health checks if interval changed
    if (config.healthCheckInterval !== undefined && this.config.enableHealthChecks) {
      this.stopHealthChecks();
      this.startHealthChecks();
    }
    
    // Reschedule refresh if buffer changed
    if (config.refreshBufferMinutes !== undefined) {
      this.scheduleNextRefresh();
    }
  }

  public getConfig(): TokenLifecycleConfig {
    return { ...this.config };
  }

  // Main token management methods
  public async ensureValidToken(): Promise<string> {
    const token = await this.authClient.getAccessToken();
    
    if (!token) {
      throw new Error('No token available');
    }

    // Check if token is still valid
    const isValid = await this.authClient.isTokenValid();
    const shouldRefresh = await this.authClient.shouldRefreshToken();

    if (!isValid) {
      throw new Error('Token is expired and cannot be refreshed');
    }

    if (shouldRefresh) {
      return await this.performTokenRefresh();
    }

    return token;
  }

  public async performTokenRefresh(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.lastRefreshAttempt = Date.now();

    this.refreshPromise = this.executeTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      this.refreshCount++;
      
      // Schedule next refresh
      this.scheduleNextRefresh();
      
      console.log('Token refresh successful');
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async executeTokenRefresh(): Promise<string> {
    const refreshOperation = async (): Promise<string> => {
      // Check network connectivity if required
      if (this.config.requireNetwork && !this.networkManager.isConnected()) {
        throw new Error('Network connection required for token refresh');
      }

      // Use network manager's circuit breaker for auth operations
      return await this.networkManager.executeWithAuthCircuitBreaker(async () => {
        return await this.authClient.refreshToken();
      });
    };

    // Execute with retry logic
    return await retryWithBackoff(refreshOperation, RetryConfigs.auth);
  }

  // Proactive refresh scheduling
  public scheduleNextRefresh(): void {
    this.clearRefreshTimer();

    this.scheduleRefreshAsync().catch(error => {
      console.error('Failed to schedule next refresh:', error);
      // Fallback: schedule a check in 5 minutes
      this.refreshTimer = setTimeout(() => {
        this.checkAndRefreshIfNeeded();
      }, 5 * 60 * 1000);
    });
  }

  private async scheduleRefreshAsync(): Promise<void> {
    const metadata = await this.authClient.getTokenMetadata();
    
    if (!metadata) {
      console.log('No token metadata available, cannot schedule refresh');
      return;
    }

    const expiresAt = new Date(metadata.expires_at);
    const now = new Date();
    const timeToExpiry = expiresAt.getTime() - now.getTime();
    const refreshBuffer = this.config.refreshBufferMinutes * 60 * 1000;
    const timeToRefresh = Math.max(timeToExpiry - refreshBuffer, 0);

    console.log(`Scheduling token refresh in ${Math.round(timeToRefresh / 1000 / 60)} minutes`);

    this.refreshTimer = setTimeout(() => {
      this.checkAndRefreshIfNeeded();
    }, timeToRefresh);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public async checkAndRefreshIfNeeded(): Promise<boolean> {
    try {
      const shouldRefresh = await this.authClient.shouldRefreshToken();
      
      if (shouldRefresh) {
        await this.performTokenRefresh();
        return true;
      }
      
      // Schedule next check
      this.scheduleNextRefresh();
      return false;
    } catch (error) {
      console.error('Error checking/refreshing token:', error);
      return false;
    }
  }

  // App state handling
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === 'active') {
      console.log('App became active, checking token status');
      
      if (this.config.refreshOnForeground) {
        // Check if we need to refresh when app comes to foreground
        await this.checkAndRefreshIfNeeded();
      }
      
      // Restart health checks if they were stopped
      if (this.config.enableHealthChecks && !this.healthCheckTimer) {
        this.startHealthChecks();
      }
    } else if (nextAppState === 'background') {
      console.log('App went to background');
      
      // Stop health checks in background to save battery
      this.stopHealthChecks();
    }
  }

  // Network state handling
  private async handleNetworkOnline(): Promise<void> {
    console.log('Network came online, checking token status');
    
    // When network comes back, check if we need to refresh
    await this.checkAndRefreshIfNeeded();
  }

  private handleNetworkOffline(): void {
    console.log('Network went offline');
    
    // Clear any pending refresh timers since we can't refresh without network
    if (this.config.requireNetwork) {
      this.clearRefreshTimer();
    }
  }

  // Token health checks
  public async getTokenHealth(): Promise<TokenHealthStatus> {
    const token = await this.authClient.getAccessToken();
    const metadata = await this.authClient.getTokenMetadata();
    const errors: string[] = [];

    if (!token) {
      return {
        isValid: false,
        expiresAt: null,
        timeToExpiry: null,
        needsRefresh: false,
        lastRefresh: null,
        refreshCount: this.refreshCount,
        errors: ['No token available']
      };
    }

    let isValid = false;
    let needsRefresh = false;
    let expiresAt: Date | null = null;
    let timeToExpiry: number | null = null;

    try {
      isValid = await this.authClient.isTokenValid();
      needsRefresh = await this.authClient.shouldRefreshToken();
      
      if (metadata) {
        expiresAt = new Date(metadata.expires_at);
        timeToExpiry = expiresAt.getTime() - Date.now();
        
        // Check for clock skew
        const maxSkew = this.config.maxClockSkewMinutes * 60 * 1000;
        if (Math.abs(timeToExpiry) > maxSkew && timeToExpiry < 0) {
          errors.push('Possible clock skew detected');
        }
      }
    } catch (error) {
      errors.push(`Token validation failed: ${error}`);
    }

    return {
      isValid,
      expiresAt,
      timeToExpiry,
      needsRefresh,
      lastRefresh: this.lastRefreshAttempt ? new Date(this.lastRefreshAttempt) : null,
      refreshCount: this.refreshCount,
      errors
    };
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return; // Already running
    }

    const intervalMs = this.config.healthCheckInterval * 60 * 1000;
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    console.log(`Started token health checks every ${this.config.healthCheckInterval} minutes`);
  }

  private stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('Stopped token health checks');
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getTokenHealth();
      
      if (!health.isValid) {
        console.warn('Health check failed: token is invalid');
      } else if (health.needsRefresh) {
        console.log('Health check: token needs refresh');
        await this.performTokenRefresh();
      }
      
      if (health.errors.length > 0) {
        console.warn('Health check warnings:', health.errors);
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  // Background task management
  private async registerBackgroundTask(): Promise<void> {
    if (this.backgroundTaskRegistered) {
      return;
    }

    try {
      // Define the background task
      TaskManager.defineTask(TOKEN_REFRESH_TASK, async ({ data, error, executionInfo }) => {
        if (error) {
          console.error('Background token refresh error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        try {
          const manager = TokenLifecycleManager.getInstance();
          const refreshed = await manager.checkAndRefreshIfNeeded();
          
          console.log(`Background token refresh: ${refreshed ? 'refreshed' : 'no refresh needed'}`);
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background token refresh failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the background task
      await BackgroundFetch.registerTaskAsync(TOKEN_REFRESH_TASK, {
        minimumInterval: this.config.backgroundRefreshInterval * 60, // Convert to seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.backgroundTaskRegistered = true;
      console.log('Background token refresh task registered');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  // Post-login refresh
  public async performPostLoginRefresh(): Promise<string> {
    if (!this.config.refreshOnLogin) {
      const token = await this.authClient.getAccessToken();
      return token || '';
    }

    console.log('Performing post-login token refresh');
    return await this.performTokenRefresh();
  }

  // Comprehensive cleanup
  public async performFullCleanup(): Promise<void> {
    console.log('Performing full token lifecycle cleanup');
    
    // Clear all timers
    this.clearRefreshTimer();
    this.stopHealthChecks();
    
    // Unregister background task
    if (this.backgroundTaskRegistered) {
      try {
        await BackgroundFetch.unregisterTaskAsync(TOKEN_REFRESH_TASK);
        this.backgroundTaskRegistered = false;
      } catch (error) {
        console.warn('Failed to unregister background task:', error);
      }
    }
    
    // Clear state
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.refreshCount = 0;
    this.lastRefreshAttempt = 0;
    
    // Remove app state listener
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    console.log('Token lifecycle cleanup completed');
  }

  // Utility methods
  public isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  public getRefreshCount(): number {
    return this.refreshCount;
  }

  public getLastRefreshAttempt(): Date | null {
    return this.lastRefreshAttempt ? new Date(this.lastRefreshAttempt) : null;
  }

  // Cleanup method
  public cleanup(): void {
    this.performFullCleanup().catch(error => {
      console.error('Error during cleanup:', error);
    });
  }
}