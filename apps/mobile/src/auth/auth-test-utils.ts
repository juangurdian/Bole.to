import { GatewayAuthService } from './gateway-auth-service';
import { deepLinkHandler } from './deep-link-handler';
import { googleProvider, appleProvider } from './oauth-providers';

/**
 * Utility functions for testing OAuth integration
 */

export interface TestResults {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export class AuthTestSuite {
  private gatewayAuth = GatewayAuthService.getInstance();
  private results: TestResults[] = [];

  /**
   * Run comprehensive OAuth integration tests
   */
  async runFullTestSuite(): Promise<TestResults[]> {
    this.results = [];
    
    await this.testGatewayConnection();
    await this.testOAuthProviderAvailability();
    await this.testTokenValidation();
    await this.testSessionManagement();
    
    return this.results;
  }

  private async testGatewayConnection(): Promise<void> {
    try {
      // Test Gateway API connectivity
      const response = await fetch(`${process.env.EXPO_PUBLIC_GATEWAY_URL}/health`);
      
      if (response.ok) {
        this.addResult(true, 'Gateway API connection successful');
      } else {
        this.addResult(false, `Gateway API returned ${response.status}`);
      }
    } catch (error) {
      this.addResult(false, 'Gateway API connection failed', error);
    }
  }

  private async testOAuthProviderAvailability(): Promise<void> {
    try {
      // Test Google provider
      const googleAvailable = await googleProvider.isAvailable();
      this.addResult(googleAvailable, `Google Sign-In ${googleAvailable ? 'available' : 'not available'}`);
      
      // Test Apple provider
      const appleAvailable = await appleProvider.isAvailable();
      this.addResult(appleAvailable, `Apple Sign-In ${appleAvailable ? 'available' : 'not available'}`);
      
    } catch (error) {
      this.addResult(false, 'OAuth provider availability test failed', error);
    }
  }



  private async testTokenValidation(): Promise<void> {
    try {
      // Test token validation logic
      const isValid = await this.gatewayAuth.isTokenValid();
      
      // This will be false if no token exists, which is expected in fresh install
      this.addResult(true, `Token validation check completed (valid: ${isValid})`);
      
    } catch (error) {
      this.addResult(false, 'Token validation test failed', error);
    }
  }

  private async testSessionManagement(): Promise<void> {
    try {
      // Test device info access (getDeviceInfo is private, so we test what we can)
      const hasAccessToken = await this.gatewayAuth.getAccessToken();
      const isBiometricAvailable = await this.gatewayAuth.isBiometricAvailable();
      
      this.addResult(true, 'Session management components accessible', {
        hasStoredToken: !!hasAccessToken,
        biometricSupport: isBiometricAvailable,
      });
    } catch (error) {
      this.addResult(false, 'Session management test failed', error);
    }
  }

  private addResult(success: boolean, message: string, details?: any): void {
    this.results.push({
      success,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    let report = `OAuth Integration Test Report\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}\n`;
    report += `Failed: ${failedTests}\n`;
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;
    
    report += `Detailed Results:\n`;
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      report += `${index + 1}. ${status} ${result.message}\n`;
      if (result.details && !result.success) {
        report += `   Error: ${JSON.stringify(result.details)}\n`;
      }
    });
    
    return report;
  }
}

/**
 * Mock OAuth flow for testing
 */
export const mockOAuthFlow = {
  async simulateGoogleLogin(): Promise<{ success: boolean; error?: string }> {
    try {
      const mockIdToken = 'mock_google_id_token_' + Date.now();
      // This would normally call the real OAuth flow
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async simulateAppleLogin(): Promise<{ success: boolean; error?: string }> {
    try {
      const mockIdToken = 'mock_apple_id_token_' + Date.now();
      // This would normally call the real OAuth flow
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  generateMockDeepLink(provider: string, code: string, state: string): string {
    return `https://app.bole.to/auth/callback?provider=${provider}&code=${code}&state=${state}`;
  },
};

/**
 * Development utilities
 */
export const devUtils = {
  async clearAllAuthData(): Promise<void> {
    const auth = GatewayAuthService.getInstance();
    try {
      await auth.logout(true);
      console.log('✅ All auth data cleared');
    } catch (error) {
      console.log('❌ Failed to clear auth data:', error);
    }
  },

  async logCurrentAuthState(): Promise<void> {
    const auth = GatewayAuthService.getInstance();
    try {
      const token = await auth.getAccessToken();
      const isValid = await auth.isTokenValid();
      
      console.log('Current Auth State:', {
        hasToken: !!token,
        tokenValid: isValid,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      });
    } catch (error) {
      console.log('❌ Failed to log auth state:', error);
    }
  },

  async testNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};