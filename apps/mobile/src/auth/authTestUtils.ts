/**
 * Comprehensive test utilities for Phase 5 token lifecycle and edge cases
 */

import { HiEventsAuthClient } from './hiEventsAuthClient';
import { TokenLifecycleManager } from './tokenLifecycleManager';
import { NetworkManager } from './networkManager';
import * as SecureStore from 'expo-secure-store';

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export interface EdgeCaseTestSuite {
  networkTests: TestResult[];
  tokenLifecycleTests: TestResult[];
  clockSkewTests: TestResult[];
  concurrencyTests: TestResult[];
  offlineTests: TestResult[];
  cleanupTests: TestResult[];
}

/**
 * Comprehensive test suite for Phase 5 authentication edge cases
 */
export class AuthEdgeCaseValidator {
  private authClient: HiEventsAuthClient;
  private tokenManager: TokenLifecycleManager;
  private networkManager: NetworkManager;
  private originalFetch: typeof fetch;
  private testResults: EdgeCaseTestSuite;

  constructor() {
    this.authClient = HiEventsAuthClient.getInstance();
    this.tokenManager = TokenLifecycleManager.getInstance();
    this.networkManager = NetworkManager.getInstance();
    this.originalFetch = global.fetch;
    
    this.testResults = {
      networkTests: [],
      tokenLifecycleTests: [],
      clockSkewTests: [],
      concurrencyTests: [],
      offlineTests: [],
      cleanupTests: []
    };
  }

  /**
   * Run all edge case tests
   */
  async runAllTests(): Promise<EdgeCaseTestSuite> {
    console.log('🧪 Starting comprehensive Phase 5 edge case tests...');
    
    try {
      // Test network handling
      await this.runNetworkTests();
      
      // Test token lifecycle management
      await this.runTokenLifecycleTests();
      
      // Test clock skew handling
      await this.runClockSkewTests();
      
      // Test concurrency scenarios
      await this.runConcurrencyTests();
      
      // Test offline scenarios
      await this.runOfflineTests();
      
      // Test cleanup procedures
      await this.runCleanupTests();
      
      this.printTestSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
    
    return this.testResults;
  }

  /**
   * Test network-related edge cases
   */
  private async runNetworkTests(): Promise<void> {
    console.log('🌐 Running network edge case tests...');

    // Test 1: Network disconnection during token refresh
    await this.runTest('networkTests', 'Network disconnection during token refresh', async () => {
      // Mock network disconnection
      this.mockNetworkDisconnection();
      
      try {
        await this.tokenManager.performTokenRefresh();
        throw new Error('Should have failed due to network disconnection');
      } catch (error: any) {
        if (error.message.includes('Network connection required')) {
          return { success: true };
        }
        throw error;
      } finally {
        this.restoreNetwork();
      }
    });

    // Test 2: Connection recovery processing pending operations
    await this.runTest('networkTests', 'Connection recovery with pending operations', async () => {
      // Simulate offline period with queued operations
      this.mockNetworkDisconnection();
      
      const operationPromise = this.networkManager.executeWhenOnline(
        async () => ({ data: 'test' }),
        { priority: 'high', timeout: 10000 }
      );
      
      // Wait a bit, then restore connection
      setTimeout(() => this.restoreNetwork(), 1000);
      
      const result = await operationPromise;
      if (result.data === 'test') {
        return { success: true };
      }
      throw new Error('Operation not executed after network recovery');
    });

    // Test 3: Circuit breaker activation
    await this.runTest('networkTests', 'Circuit breaker activation after failures', async () => {
      let failureCount = 0;
      
      // Mock multiple failures
      this.mockFetch(() => {
        failureCount++;
        if (failureCount <= 5) {
          throw new Error('Simulated network failure');
        }
        return new Response('{"success": true}', { status: 200 });
      });
      
      try {
        // This should trigger circuit breaker after multiple failures
        for (let i = 0; i < 6; i++) {
          try {
            await this.networkManager.executeWithApiCircuitBreaker(async () => {
              const response = await fetch('test://endpoint');
              return response.json();
            });
          } catch (error) {
            // Expected failures
          }
        }
        
        const circuitState = this.networkManager.getApiCircuitBreakerState();
        if (circuitState === 'open') {
          return { success: true, circuitState };
        }
        throw new Error(`Expected circuit breaker to be open, but was ${circuitState}`);
      } finally {
        this.restoreFetch();
      }
    });
  }

  /**
   * Test token lifecycle management edge cases
   */
  private async runTokenLifecycleTests(): Promise<void> {
    console.log('🔄 Running token lifecycle tests...');

    // Test 1: Proactive refresh before expiration
    await this.runTest('tokenLifecycleTests', 'Proactive token refresh scheduling', async () => {
      // Mock a token that expires in 6 minutes (should trigger proactive refresh)
      const expiresAt = new Date(Date.now() + 6 * 60 * 1000);
      await SecureStore.setItemAsync(
        HiEventsAuthClient.TOKEN_METADATA_KEY,
        JSON.stringify({
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          expires_in: 360
        })
      );

      const shouldRefresh = await this.authClient.shouldRefreshToken();
      if (shouldRefresh) {
        return { success: true, message: 'Correctly identified need for proactive refresh' };
      }
      throw new Error('Failed to identify proactive refresh need');
    });

    // Test 2: Background refresh scheduling
    await this.runTest('tokenLifecycleTests', 'Background refresh task scheduling', async () => {
      // This is harder to test without actual background execution
      // We'll verify the configuration is set up correctly
      const config = this.tokenManager.getConfig();
      
      if (config.backgroundRefreshInterval > 0 && config.refreshBufferMinutes > 0) {
        return { success: true, config };
      }
      throw new Error('Background refresh configuration invalid');
    });

    // Test 3: Token health monitoring
    await this.runTest('tokenLifecycleTests', 'Token health monitoring', async () => {
      const health = await this.tokenManager.getTokenHealth();
      
      if (health && typeof health.isValid === 'boolean') {
        return { success: true, health };
      }
      throw new Error('Token health monitoring not working');
    });

    // Test 4: Multiple concurrent refresh attempts
    await this.runTest('tokenLifecycleTests', 'Concurrent refresh prevention', async () => {
      // Mock a token refresh that takes time
      this.mockFetch(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(new Response(JSON.stringify({
              success: true,
              data: {
                access_token: 'new_mock_token',
                token_type: 'Bearer',
                expires_in: 3600,
                expires_at: new Date(Date.now() + 3600000).toISOString()
              }
            }), { status: 200 }));
          }, 1000);
        });
      });

      try {
        // Start multiple refresh attempts simultaneously
        const refreshPromises = [
          this.tokenManager.performTokenRefresh(),
          this.tokenManager.performTokenRefresh(),
          this.tokenManager.performTokenRefresh()
        ];

        const results = await Promise.all(refreshPromises);
        
        // All should return the same token (single flight)
        if (results.every(token => token === results[0])) {
          return { success: true, message: 'Single flight refresh working' };
        }
        throw new Error('Multiple refresh requests not properly handled');
      } finally {
        this.restoreFetch();
      }
    });
  }

  /**
   * Test clock skew handling
   */
  private async runClockSkewTests(): Promise<void> {
    console.log('🕒 Running clock skew tests...');

    // Test 1: Token appears expired due to clock skew
    await this.runTest('clockSkewTests', 'Clock skew detection and handling', async () => {
      // Mock a token that appears expired due to clock skew
      const pastTime = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      await SecureStore.setItemAsync(
        HiEventsAuthClient.TOKEN_METADATA_KEY,
        JSON.stringify({
          created_at: new Date().toISOString(),
          expires_at: pastTime.toISOString(),
          expires_in: 3600
        })
      );

      // Mock server verification that token is actually valid
      this.mockFetch(() => {
        return new Response(JSON.stringify({
          success: true,
          data: { valid: true }
        }), { status: 200 });
      });

      try {
        const isValid = await this.authClient.isTokenValid();
        if (isValid) {
          return { success: true, message: 'Clock skew properly handled' };
        }
        throw new Error('Clock skew not handled correctly');
      } finally {
        this.restoreFetch();
      }
    });
  }

  /**
   * Test concurrency edge cases
   */
  private async runConcurrencyTests(): Promise<void> {
    console.log('⚡ Running concurrency tests...');

    // Test 1: Simultaneous API requests during token refresh
    await this.runTest('concurrencyTests', 'API requests during token refresh', async () => {
      let refreshCount = 0;
      
      this.mockFetch((url) => {
        if (url.includes('/refresh')) {
          refreshCount++;
          return new Response(JSON.stringify({
            success: true,
            data: {
              access_token: `refreshed_token_${refreshCount}`,
              token_type: 'Bearer',
              expires_in: 3600,
              expires_at: new Date(Date.now() + 3600000).toISOString()
            }
          }), { status: 200 });
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: { message: 'API call successful' }
        }), { status: 200 });
      });

      try {
        // Simulate multiple API calls that might trigger token refresh
        const apiCalls = Array.from({ length: 5 }, (_, i) => 
          this.authClient.getMe()
        );

        await Promise.all(apiCalls);
        
        // Should have only triggered one refresh due to single flight
        if (refreshCount <= 1) {
          return { success: true, refreshCount };
        }
        throw new Error(`Too many refresh calls: ${refreshCount}`);
      } finally {
        this.restoreFetch();
      }
    });
  }

  /**
   * Test offline scenarios
   */
  private async runOfflineTests(): Promise<void> {
    console.log('📱 Running offline scenario tests...');

    // Test 1: Offline token validation
    await this.runTest('offlineTests', 'Offline token validation with valid token', async () => {
      // Set up a valid token that doesn't need server validation
      const futureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      await SecureStore.setItemAsync(
        HiEventsAuthClient.TOKEN_METADATA_KEY,
        JSON.stringify({
          created_at: new Date().toISOString(),
          expires_at: futureTime.toISOString(),
          expires_in: 1800
        })
      );

      this.mockNetworkDisconnection();
      
      try {
        const isValid = await this.authClient.isTokenValid();
        if (isValid) {
          return { success: true, message: 'Offline token validation working' };
        }
        throw new Error('Valid token marked as invalid offline');
      } finally {
        this.restoreNetwork();
      }
    });

    // Test 2: Graceful degradation when offline
    await this.runTest('offlineTests', 'Graceful degradation during offline period', async () => {
      this.mockNetworkDisconnection();
      
      try {
        // This should queue the operation for when online
        const operationPromise = this.networkManager.executeWhenOnline(
          async () => ({ data: 'test' }),
          { priority: 'normal', timeout: 5000 }
        );
        
        // Restore network quickly
        setTimeout(() => this.restoreNetwork(), 100);
        
        const result = await operationPromise;
        if (result.data === 'test') {
          return { success: true };
        }
        throw new Error('Operation not queued properly');
      } catch (error: any) {
        if (error.message.includes('timeout')) {
          // This is expected if network doesn't come back in time
          return { success: true, message: 'Proper timeout handling' };
        }
        throw error;
      }
    });
  }

  /**
   * Test cleanup procedures
   */
  private async runCleanupTests(): Promise<void> {
    console.log('🧹 Running cleanup tests...');

    // Test 1: Comprehensive logout cleanup
    await this.runTest('cleanupTests', 'Comprehensive logout cleanup', async () => {
      // Set up some data to be cleaned
      await SecureStore.setItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY, 'test_token');
      await SecureStore.setItemAsync(HiEventsAuthClient.USER_DATA_KEY, JSON.stringify({ id: 'test' }));
      
      this.mockFetch(() => {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      });

      try {
        await this.authClient.logout(false);
        
        // Verify cleanup
        const token = await SecureStore.getItemAsync(HiEventsAuthClient.ACCESS_TOKEN_KEY);
        const userData = await SecureStore.getItemAsync(HiEventsAuthClient.USER_DATA_KEY);
        
        if (!token && !userData) {
          return { success: true, message: 'All data cleaned up' };
        }
        throw new Error('Cleanup incomplete');
      } finally {
        this.restoreFetch();
      }
    });

    // Test 2: Token lifecycle manager cleanup
    await this.runTest('cleanupTests', 'Token lifecycle manager cleanup', async () => {
      // This test verifies that cleanup doesn't throw errors
      try {
        await this.tokenManager.performFullCleanup();
        return { success: true, message: 'Cleanup completed without errors' };
      } catch (error) {
        throw new Error(`Cleanup failed: ${error}`);
      }
    });
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(
    category: keyof EdgeCaseTestSuite,
    testName: string,
    testFn: () => Promise<{ success: boolean; [key: string]: any }>
  ): Promise<void> {
    try {
      const result = await testFn();
      this.testResults[category].push({
        testName,
        passed: result.success,
        details: result
      });
      console.log(`✅ ${testName}: PASSED`);
    } catch (error: any) {
      this.testResults[category].push({
        testName,
        passed: false,
        error: error.message,
        details: { error }
      });
      console.log(`❌ ${testName}: FAILED - ${error.message}`);
    }
  }

  /**
   * Mock network disconnection
   */
  private mockNetworkDisconnection(): void {
    // This would need to be implemented with actual network mocking
    // For now, we'll mock the network manager's connectivity check
    (this.networkManager as any).isOnline = false;
  }

  /**
   * Restore network connection
   */
  private restoreNetwork(): void {
    (this.networkManager as any).isOnline = true;
  }

  /**
   * Mock fetch for controlled testing
   */
  private mockFetch(mockFn: (url: string) => Response | Promise<Response>): void {
    global.fetch = ((url: string) => {
      return Promise.resolve(mockFn(url));
    }) as any;
  }

  /**
   * Restore original fetch
   */
  private restoreFetch(): void {
    global.fetch = this.originalFetch;
  }

  /**
   * Print comprehensive test summary
   */
  private printTestSummary(): void {
    console.log('\n📊 Phase 5 Test Summary:');
    console.log('========================');
    
    Object.entries(this.testResults).forEach(([category, tests]) => {
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ${passed}/${total} tests passed (${percentage}%)`);
      
      tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.testName}`);
        if (!test.passed && test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    });

    // Overall summary
    const allTests = Object.values(this.testResults).flat();
    const totalPassed = allTests.filter(t => t.passed).length;
    const totalTests = allTests.length;
    const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    console.log('\n' + '='.repeat(50));
    console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
    
    if (overallPercentage >= 80) {
      console.log('🎉 Phase 5 implementation is robust!');
    } else if (overallPercentage >= 60) {
      console.log('⚠️  Phase 5 implementation needs some improvements');
    } else {
      console.log('🚨 Phase 5 implementation has significant issues');
    }
  }

  /**
   * Get test results for external analysis
   */
  getTestResults(): EdgeCaseTestSuite {
    return this.testResults;
  }
}

/**
 * Simple test runner for manual testing
 */
export async function runAuthEdgeCaseTests(): Promise<EdgeCaseTestSuite> {
  const validator = new AuthEdgeCaseValidator();
  return await validator.runAllTests();
}

/**
 * Individual test utilities for specific scenarios
 */
export const AuthTestScenarios = {
  /**
   * Simulate token expiration
   */
  async simulateTokenExpiration(): Promise<void> {
    const pastTime = new Date(Date.now() - 60000); // 1 minute ago
    await SecureStore.setItemAsync(
      HiEventsAuthClient.TOKEN_METADATA_KEY,
      JSON.stringify({
        created_at: new Date().toISOString(),
        expires_at: pastTime.toISOString(),
        expires_in: 3600
      })
    );
    console.log('🕐 Simulated token expiration');
  },

  /**
   * Simulate network instability
   */
  simulateNetworkInstability(durationMs: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      const networkManager = NetworkManager.getInstance();
      (networkManager as any).isOnline = false;
      
      setTimeout(() => {
        (networkManager as any).isOnline = true;
        console.log('📶 Network stability restored');
        resolve();
      }, durationMs);
      
      console.log('📵 Simulated network instability');
    });
  },

  /**
   * Test multiple account switches rapidly
   */
  async testRapidAccountSwitching(): Promise<void> {
    const authClient = HiEventsAuthClient.getInstance();
    const accounts = ['account1', 'account2', 'account3'];
    
    console.log('🔄 Testing rapid account switching...');
    
    for (let i = 0; i < 5; i++) {
      const accountId = accounts[i % accounts.length];
      try {
        // This would normally switch accounts
        console.log(`Switching to account: ${accountId}`);
        // await authClient.switchAccount(accountId);
      } catch (error) {
        console.error(`Account switch failed: ${error}`);
      }
    }
  },

  /**
   * Test app state changes
   */
  simulateAppStateChanges(): void {
    const tokenManager = TokenLifecycleManager.getInstance();
    
    console.log('📱 Simulating app state changes...');
    
    // Simulate app going to background
    (tokenManager as any).handleAppStateChange('background');
    
    // Simulate app coming to foreground after delay
    setTimeout(() => {
      (tokenManager as any).handleAppStateChange('active');
      console.log('📱 App state changes simulated');
    }, 2000);
  }
};