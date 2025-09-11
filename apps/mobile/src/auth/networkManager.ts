/**
 * Network manager for handling online/offline states and network-aware authentication
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { CircuitBreaker, CircuitBreakerConfigs, isNetworkError } from '../utils/retryUtils';

export interface NetworkState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  connectionQuality: 'poor' | 'good' | 'excellent' | 'unknown';
}

export interface NetworkManagerEvents {
  online: () => void;
  offline: () => void;
  connectionChanged: (state: NetworkState) => void;
  appStateChanged: (state: AppStateStatus) => void;
}

/**
 * NetworkManager handles network state monitoring and provides network-aware functionality
 */
export class NetworkManager {
  private static instance: NetworkManager;
  private isOnline: boolean = true;
  private connectionState: NetworkState = {
    isConnected: true,
    type: null,
    isInternetReachable: null,
    connectionQuality: 'unknown'
  };
  
  private eventListeners: Partial<NetworkManagerEvents> = {};
  private netInfoUnsubscribe: (() => void) | null = null;
  private appStateListener: any = null;
  private connectionHistory: boolean[] = [];
  private lastConnectionCheck: number = 0;
  
  // Circuit breakers for network operations
  private authCircuitBreaker = new CircuitBreaker(CircuitBreakerConfigs.auth);
  private apiCircuitBreaker = new CircuitBreaker(CircuitBreakerConfigs.api);
  
  // Queue for operations to retry when back online
  private pendingOperations: Array<{
    id: string;
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: 'high' | 'normal' | 'low';
    createdAt: number;
    retryCount: number;
  }> = [];

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private async initialize(): Promise<void> {
    // Get initial network state
    const netInfoState = await NetInfo.fetch();
    this.updateConnectionState(netInfoState);

    // Set up network state monitoring
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      this.updateConnectionState(state);
    });

    // Set up app state monitoring
    this.appStateListener = AppState.addEventListener('change', (nextAppState) => {
      this.handleAppStateChange(nextAppState);
    });

    console.log('NetworkManager initialized');
  }

  private updateConnectionState(netInfoState: NetInfoState): void {
    const wasOnline = this.isOnline;
    const isCurrentlyOnline = Boolean(netInfoState.isConnected && netInfoState.isInternetReachable !== false);
    
    this.isOnline = isCurrentlyOnline;
    this.connectionState = {
      isConnected: Boolean(netInfoState.isConnected),
      type: netInfoState.type,
      isInternetReachable: netInfoState.isInternetReachable,
      connectionQuality: this.determineConnectionQuality(netInfoState)
    };

    // Update connection history for stability detection
    this.connectionHistory.push(isCurrentlyOnline);
    if (this.connectionHistory.length > 10) {
      this.connectionHistory.shift();
    }

    // Notify listeners of connection change
    this.eventListeners.connectionChanged?.(this.connectionState);

    // Handle online/offline transitions
    if (!wasOnline && isCurrentlyOnline) {
      this.handleComingOnline();
    } else if (wasOnline && !isCurrentlyOnline) {
      this.handleGoingOffline();
    }

    console.log('Network state updated:', this.connectionState);
  }

  private determineConnectionQuality(netInfoState: NetInfoState): 'poor' | 'good' | 'excellent' | 'unknown' {
    if (!netInfoState.isConnected) return 'poor';
    
    // For cellular connections, use signal strength if available
    if (netInfoState.type === 'cellular' && netInfoState.details) {
      const details = netInfoState.details as any;
      if (details.cellularGeneration === '4g' || details.cellularGeneration === '5g') {
        return 'excellent';
      }
      if (details.cellularGeneration === '3g') {
        return 'good';
      }
      return 'poor';
    }

    // For WiFi, assume good quality unless we detect issues
    if (netInfoState.type === 'wifi') {
      return 'good';
    }

    return 'unknown';
  }

  private handleComingOnline(): void {
    console.log('Device came online, processing pending operations');
    this.eventListeners.online?.();
    
    // Reset circuit breakers when coming back online
    this.authCircuitBreaker.reset();
    this.apiCircuitBreaker.reset();
    
    // Process pending operations
    this.processPendingOperations();
  }

  private handleGoingOffline(): void {
    console.log('Device went offline');
    this.eventListeners.offline?.();
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    this.eventListeners.appStateChanged?.(nextAppState);
    
    if (nextAppState === 'active') {
      // Refresh network state when app becomes active
      NetInfo.refresh().then(state => {
        this.updateConnectionState(state);
      });
    }
  }

  // Public methods for network state
  public isConnected(): boolean {
    return this.isOnline;
  }

  public getConnectionState(): NetworkState {
    return { ...this.connectionState };
  }

  public isConnectionStable(): boolean {
    if (this.connectionHistory.length < 5) return this.isOnline;
    
    // Connection is stable if at least 80% of recent checks were successful
    const successRate = this.connectionHistory.filter(Boolean).length / this.connectionHistory.length;
    return successRate >= 0.8;
  }

  public getConnectionQuality(): 'poor' | 'good' | 'excellent' | 'unknown' {
    return this.connectionState.connectionQuality;
  }

  // Event listeners
  public on<K extends keyof NetworkManagerEvents>(event: K, listener: NetworkManagerEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  public off<K extends keyof NetworkManagerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  // Network-aware operation execution
  public async executeWhenOnline<T>(
    operation: () => Promise<T>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
      requireStable?: boolean;
    } = {}
  ): Promise<T> {
    const { priority = 'normal', timeout = 30000, requireStable = false } = options;

    // If we're online and connection is stable (if required), execute immediately
    if (this.isOnline && (!requireStable || this.isConnectionStable())) {
      try {
        return await operation();
      } catch (error) {
        if (isNetworkError(error)) {
          // Network error while supposedly online, queue for retry
          return this.queueOperation(operation, { priority, timeout });
        }
        throw error;
      }
    }

    // Queue the operation for when we're back online
    return this.queueOperation(operation, { priority, timeout });
  }

  private async queueOperation<T>(
    operation: () => Promise<T>,
    options: { priority: 'high' | 'normal' | 'low'; timeout: number }
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timed out waiting for network connection'));
      }, options.timeout);

      const wrappedResolve = (value: T) => {
        clearTimeout(timeoutId);
        resolve(value);
      };

      const wrappedReject = (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      this.pendingOperations.push({
        id: Math.random().toString(36),
        operation,
        resolve: wrappedResolve,
        reject: wrappedReject,
        priority: options.priority,
        createdAt: Date.now(),
        retryCount: 0
      });

      // Sort by priority and creation time
      this.pendingOperations.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt - b.createdAt;
      });
    });
  }

  private async processPendingOperations(): Promise<void> {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    console.log(`Processing ${this.pendingOperations.length} pending operations`);

    // Process operations in batches to avoid overwhelming the network
    const batchSize = 3;
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (op) => {
          try {
            const result = await op.operation();
            op.resolve(result);
          } catch (error) {
            op.retryCount++;
            
            if (isNetworkError(error) && op.retryCount < 3) {
              // Re-queue for retry if it's a network error and we haven't exceeded retry limit
              this.pendingOperations.push(op);
            } else {
              op.reject(error);
            }
          }
        })
      );

      // Small delay between batches to avoid overwhelming
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // If there are still pending operations, try again after a delay
    if (this.pendingOperations.length > 0) {
      setTimeout(() => this.processPendingOperations(), 2000);
    }
  }

  // Circuit breaker methods
  public async executeWithAuthCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    return this.authCircuitBreaker.execute(operation);
  }

  public async executeWithApiCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    return this.apiCircuitBreaker.execute(operation);
  }

  public getAuthCircuitBreakerState(): string {
    return this.authCircuitBreaker.getState();
  }

  public getApiCircuitBreakerState(): string {
    return this.apiCircuitBreaker.getState();
  }

  // Connection testing
  public async testConnection(): Promise<boolean> {
    const now = Date.now();
    
    // Don't test too frequently
    if (now - this.lastConnectionCheck < 5000) {
      return this.isOnline;
    }

    this.lastConnectionCheck = now;

    try {
      // Test connection by making a simple HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const isConnected = response.ok;
      
      if (isConnected !== this.isOnline) {
        // Update connection state if it has changed
        await NetInfo.refresh();
      }

      return isConnected;
    } catch (error) {
      console.warn('Connection test failed:', error);
      return false;
    }
  }

  // Cleanup
  public cleanup(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    // Reject all pending operations
    this.pendingOperations.forEach(op => {
      op.reject(new Error('NetworkManager cleanup: operation cancelled'));
    });
    this.pendingOperations = [];

    console.log('NetworkManager cleaned up');
  }
}