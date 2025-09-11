# Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting procedures for the unified authentication system, covering common issues, debugging steps, and resolution procedures for both development and production environments.

## Common Issues

### Authentication Issues

#### Issue: Users Cannot Login
**Symptoms:**
- Login form shows "Invalid credentials" error
- Successful login attempts fail with 401 errors
- Authentication requests timeout

**Diagnostic Steps:**
1. **Check API Connectivity**
   ```bash
   # Test Hi.Events API health
   curl -X GET https://api.bole.to/api/auth/mobile/health
   
   # Expected response
   {
     "success": true,
     "data": {
       "status": "healthy",
       "timestamp": "2024-09-11T14:30:00Z"
     }
   }
   ```

2. **Verify User Credentials**
   ```bash
   # Test with known working credentials
   curl -X POST https://api.bole.to/api/auth/mobile/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "testPassword123",
       "device_info": {
         "device_id": "test-device",
         "platform": "ios",
         "app_version": "1.0.0",
         "os_version": "17.0"
       }
     }'
   ```

3. **Check Device Security Status**
   ```typescript
   // In mobile app debug mode
   const assessment = await deviceSecurity.getSecurityAssessment();
   console.log('Device Security Assessment:', assessment);
   
   // Look for:
   // - isJailbroken: false
   // - trustScore: > 0.7
   // - status: 'trusted'
   ```

**Common Solutions:**

**Solution A: Invalid Credentials**
```typescript
// Verify email format and password requirements
const validateCredentials = (email: string, password: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email) && 
         password.length >= 8 && 
         password.length <= 128;
};
```

**Solution B: Device Security Blocking**
```typescript
// Temporarily reduce security requirements for troubleshooting
const debugSecurityConfig = {
  minimumTrustScore: 0.3,        // Reduced from 0.7
  jailbreakDetectionEnabled: false,  // Temporary disable
  debugDetectionEnabled: false       // Allow debugging
};

// Apply debug config
await securityManager.updateConfig(debugSecurityConfig);
```

**Solution C: Network Connectivity Issues**
```typescript
// Check network status and retry
const networkStatus = await NetworkManager.getInstance().getStatus();
if (!networkStatus.isConnected) {
  await NetworkManager.getInstance().waitForConnection();
  // Retry login after connection restored
}
```

#### Issue: Token Refresh Failures
**Symptoms:**
- Users get logged out unexpectedly
- API requests return 401 errors
- Token refresh endpoint returns errors

**Diagnostic Steps:**
1. **Check Token Validity**
   ```typescript
   // Check stored token
   const token = await hiEventsAuth.getAccessToken();
   console.log('Token exists:', !!token);
   
   if (token) {
     try {
       // Decode JWT payload (client-side only)
       const payload = JSON.parse(atob(token.split('.')[1]));
       console.log('Token expires at:', new Date(payload.exp * 1000));
       console.log('Token is expired:', payload.exp < Date.now() / 1000);
     } catch (error) {
       console.log('Token is malformed:', error);
     }
   }
   ```

2. **Test Token Refresh Endpoint**
   ```bash
   # Test refresh endpoint
   curl -X POST https://api.bole.to/api/auth/mobile/refresh \
     -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

3. **Check Clock Synchronization**
   ```typescript
   // Check for clock skew issues
   const serverTime = await getServerTime(); // From API response
   const localTime = Date.now();
   const timeDiff = Math.abs(serverTime - localTime);
   
   if (timeDiff > 5 * 60 * 1000) { // 5 minutes
     console.warn('Clock skew detected:', timeDiff / 1000, 'seconds');
   }
   ```

**Common Solutions:**

**Solution A: Malformed Tokens**
```typescript
// Clear corrupted tokens and force re-authentication
await hiEventsAuth.logout();
await secureStorage.clearAll();

// Show re-authentication UI
navigation.navigate('Login');
```

**Solution B: Clock Skew Issues**
```typescript
// Implement server time synchronization
class ClockSync {
  private serverTimeOffset = 0;
  
  async synchronizeWithServer(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/time');
      const endTime = Date.now();
      const serverTime = (await response.json()).timestamp;
      
      // Calculate offset accounting for network latency
      const networkDelay = (endTime - startTime) / 2;
      this.serverTimeOffset = serverTime - (endTime - networkDelay);
      
      console.log('Clock synchronized, offset:', this.serverTimeOffset);
    } catch (error) {
      console.error('Clock sync failed:', error);
    }
  }
  
  getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }
}
```

**Solution C: Token Lifecycle Issues**
```typescript
// Reset token lifecycle manager
const tokenManager = TokenLifecycleManager.getInstance();
await tokenManager.performFullCleanup();
await tokenManager.initialize();

// Force immediate token refresh
if (await hiEventsAuth.isTokenValid()) {
  await hiEventsAuth.refreshToken();
}
```

### Network Issues

#### Issue: Certificate Pinning Failures
**Symptoms:**
- Network requests fail with SSL errors
- Certificate pinning violation alerts
- Man-in-the-middle attack warnings

**Diagnostic Steps:**
1. **Check Certificate Configuration**
   ```typescript
   // Verify pinned certificates are current
   const pinnedCerts = networkSecurity.getPinnedCertificates('api.bole.to');
   console.log('Pinned certificates:', pinnedCerts);
   
   // Test certificate validation
   const isValid = await networkSecurity.validateCertificate(
     'api.bole.to', 
     currentCertificate
   );
   console.log('Certificate validation:', isValid);
   ```

2. **Test Network Connectivity**
   ```bash
   # Test direct connectivity
   curl -v https://api.bole.to/api/auth/mobile/health
   
   # Check certificate chain
   openssl s_client -connect api.bole.to:443 -servername api.bole.to
   ```

**Solutions:**

**Solution A: Update Certificate Pins**
```typescript
// Update certificate pins for new certificates
const updatedPins = {
  'api.bole.to': [
    'SHA256:NEW_PRIMARY_CERTIFICATE_HASH',
    'SHA256:NEW_BACKUP_CERTIFICATE_HASH'
  ]
};

await networkSecurity.updateCertificatePins(updatedPins);
```

**Solution B: Disable Certificate Pinning (Development Only)**
```typescript
// For development/debugging only - NEVER in production
const debugNetworkConfig = {
  certificatePinningEnabled: false,
  allowInsecureConnections: true // Development only
};

await networkSecurity.updateConfig(debugNetworkConfig);
```

#### Issue: Offline Mode Not Working
**Symptoms:**
- App doesn't work offline
- Operations fail when network is poor
- Users get logged out during network interruptions

**Diagnostic Steps:**
```typescript
// Check network manager status
const networkManager = NetworkManager.getInstance();
const status = networkManager.getStatus();

console.log('Network Status:', {
  isConnected: status.isConnected,
  connectionType: status.connectionType,
  isStable: status.isStable,
  lastConnectedAt: status.lastConnectedAt
});

// Check offline queue
const queueStatus = await networkManager.getQueueStatus();
console.log('Offline Queue:', queueStatus);
```

**Solutions:**

**Solution A: Fix Network Manager**
```typescript
// Reinitialize network manager
await NetworkManager.getInstance().initialize();

// Process pending offline operations
await NetworkManager.getInstance().processPendingOperations();
```

**Solution B: Extend Offline Grace Period**
```typescript
// Allow longer offline operation
const extendedConfig = {
  offlineGracePeriod: 120, // 2 hours instead of 1
  enableOfflineMode: true,
  queueOfflineOperations: true
};

await tokenManager.updateConfig(extendedConfig);
```

### Security Framework Issues

#### Issue: Biometric Authentication Not Working
**Symptoms:**
- Biometric prompts don't appear
- Biometric authentication always fails
- Fallback to passcode not working

**Diagnostic Steps:**
1. **Check Biometric Availability**
   ```typescript
   // Test biometric hardware and enrollment
   const hasHardware = await LocalAuthentication.hasHardwareAsync();
   const isEnrolled = await LocalAuthentication.isEnrolledAsync();
   const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
   
   console.log('Biometric Status:', {
     hasHardware,
     isEnrolled,
     supportedTypes
   });
   ```

2. **Test Biometric Authentication**
   ```typescript
   // Direct biometric test
   try {
     const result = await LocalAuthentication.authenticateAsync({
       promptMessage: 'Test biometric authentication',
       fallbackLabel: 'Use Passcode',
       requireConfirmation: false
     });
     
     console.log('Biometric test result:', result);
   } catch (error) {
     console.error('Biometric test error:', error);
   }
   ```

**Solutions:**

**Solution A: Enable Biometric Fallback**
```typescript
// Configure fallback authentication
const biometricConfig = {
  enableBiometric: true,
  fallbackToPasscode: true,
  requireBiometricForSensitive: false, // Temporarily disable
  biometricPromptCancel: 'Cancel',
  biometricPromptFallback: 'Use Passcode'
};

await biometricSecurity.updateConfig(biometricConfig);
```

**Solution B: Handle Biometric Unavailability**
```typescript
// Graceful degradation when biometrics unavailable
class BiometricFallback {
  async authenticateWithFallback(operation: string): Promise<boolean> {
    if (await biometricSecurity.isBiometricAvailable()) {
      return await biometricSecurity.authenticate(operation);
    } else {
      // Fall back to PIN/password
      return await this.showPasscodePrompt(operation);
    }
  }
  
  private async showPasscodePrompt(operation: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.prompt(
        'Authentication Required',
        `Please enter your passcode to ${operation}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'OK', onPress: (passcode) => resolve(this.validatePasscode(passcode)) }
        ],
        'secure-text'
      );
    });
  }
}
```

#### Issue: Device Security Blocking Legitimate Users
**Symptoms:**
- Users with modified devices cannot login
- False positive jailbreak/root detection
- High security trust score requirements blocking users

**Diagnostic Steps:**
```typescript
// Check device security assessment details
const assessment = await deviceSecurity.getSecurityAssessment();
console.log('Security Assessment:', {
  isJailbroken: assessment.isJailbroken,
  trustScore: assessment.trustScore,
  riskLevel: assessment.riskLevel,
  indicators: assessment.indicators
});

// Check specific security indicators
const indicators = await deviceSecurity.getSecurityIndicators();
console.log('Security Indicators:', indicators);
```

**Solutions:**

**Solution A: Adjust Security Thresholds**
```typescript
// Temporarily lower security requirements
const relaxedSecurity = {
  minimumTrustScore: 0.4,     // Reduced from 0.7
  jailbreakDetectionEnabled: false,
  debugDetectionEnabled: false,
  allowCompromisedDevices: true  // Temporary
};

await deviceSecurity.updateConfig(relaxedSecurity);
```

**Solution B: Implement Security Bypass for Support**
```typescript
// Support bypass mechanism (admin only)
class SecurityBypass {
  async createSupportBypass(userId: string, reason: string): Promise<string> {
    const bypassToken = await this.generateBypassToken(userId, reason);
    
    // Store bypass with expiration
    await secureStorage.storeEncrypted(`bypass_${userId}`, JSON.stringify({
      token: bypassToken,
      reason,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      createdBy: 'support-team'
    }));
    
    return bypassToken;
  }
  
  async validateBypass(userId: string, token: string): Promise<boolean> {
    const storedBypass = await secureStorage.getDecrypted(`bypass_${userId}`);
    if (!storedBypass) return false;
    
    const bypass = JSON.parse(storedBypass);
    return bypass.token === token && bypass.expiresAt > Date.now();
  }
}
```

### Account Management Issues

#### Issue: Account Switching Not Working
**Symptoms:**
- Account switch requests fail
- User context doesn't update after switching
- Biometric prompts for account switching don't appear

**Diagnostic Steps:**
```typescript
// Check current account context
const currentUser = await hiEventsAuth.getStoredUser();
const currentAccount = await hiEventsAuth.getStoredCurrentAccount();

console.log('Current Context:', {
  user: currentUser?.email,
  currentAccount: currentAccount?.name,
  accountId: currentAccount?.id
});

// Test account switching API
try {
  const accounts = await hiEventsAuth.getMe();
  console.log('Available accounts:', accounts.accounts.length);
} catch (error) {
  console.error('Failed to get accounts:', error);
}
```

**Solutions:**

**Solution A: Reset Account Context**
```typescript
// Clear and refresh account context
await secureStorage.removeItem(HiEventsAuthClient.CURRENT_ACCOUNT_KEY);
const refreshedData = await hiEventsAuth.getMe();

// Update UI with refreshed account context
await this.updateAccountContext(refreshedData);
```

**Solution B: Fix Account Switching Flow**
```typescript
// Implement robust account switching
class AccountSwitcher {
  async switchAccountWithRetry(accountId: string, maxRetries = 3): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Ensure biometric authentication
        const biometricResult = await biometricSecurity.authenticateForOperation(
          SensitiveOperation.ACCOUNT_SWITCH,
          `Switch to account ${accountId}`
        );
        
        if (!biometricResult.success) {
          throw new Error('Biometric authentication failed');
        }
        
        // Perform account switch
        const newAccount = await hiEventsAuth.switchAccount(accountId);
        
        // Verify switch was successful
        const currentAccount = await hiEventsAuth.getStoredCurrentAccount();
        if (currentAccount?.id === accountId) {
          console.log('Account switch successful');
          return;
        } else {
          throw new Error('Account switch verification failed');
        }
      } catch (error) {
        console.error(`Account switch attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
}
```

## Debugging Tools

### Debug Mode Activation

```typescript
// Enable comprehensive debugging
const debugConfig = {
  verboseLogging: true,
  logNetworkRequests: true,
  logSecurityEvents: true,
  disableSecurityRestrictions: true, // Development only
  mockBiometricAuthentication: true,
  allowInsecureConnections: true
};

// Apply debug configuration
await debugManager.enableDebugMode(debugConfig);
```

### Logging and Monitoring

#### Enhanced Logging
```typescript
// Debug logging utility
class DebugLogger {
  static logAuthFlow(step: string, data: any): void {
    if (__DEV__) {
      console.group(`🔐 Auth Debug: ${step}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Data:', data);
      console.groupEnd();
    }
  }
  
  static logSecurityEvent(event: string, details: any): void {
    if (__DEV__) {
      console.group(`🛡️ Security Debug: ${event}`);
      console.log('Details:', details);
      console.log('Stack:', new Error().stack);
      console.groupEnd();
    }
  }
  
  static logNetworkRequest(url: string, options: any, response: any): void {
    if (__DEV__) {
      console.group(`🌐 Network Debug: ${url}`);
      console.log('Request Options:', options);
      console.log('Response:', response);
      console.groupEnd();
    }
  }
}
```

#### Performance Monitoring
```typescript
// Performance debugging
class PerformanceDebugger {
  private timers = new Map<string, number>();
  
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }
  
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ ${label}: ${duration}ms`);
    this.timers.delete(label);
    
    return duration;
  }
  
  async profileFunction<T>(
    label: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }
}

// Usage example
const debugger = new PerformanceDebugger();
const result = await debugger.profileFunction(
  'Login Process',
  () => hiEventsAuth.login(credentials)
);
```

### Testing Utilities

#### Authentication Test Suite
```typescript
// Comprehensive auth testing
class AuthTestSuite {
  async runAllTests(): Promise<TestResults> {
    const results = {
      passed: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    const tests = [
      this.testLogin,
      this.testTokenRefresh,
      this.testLogout,
      this.testAccountSwitching,
      this.testBiometricAuth,
      this.testOfflineMode,
      this.testSecurityFramework
    ];
    
    for (const test of tests) {
      try {
        await test();
        results.passed++;
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        results.failed++;
        results.errors.push(`${test.name}: ${error.message}`);
        console.error(`❌ ${test.name} failed:`, error);
      }
    }
    
    return results;
  }
  
  private async testLogin(): Promise<void> {
    const testCredentials = {
      email: 'test@example.com',
      password: 'testPassword123'
    };
    
    const result = await hiEventsAuth.login(testCredentials);
    
    if (!result.user || !result.accounts) {
      throw new Error('Login did not return expected data');
    }
  }
  
  private async testTokenRefresh(): Promise<void> {
    const initialToken = await hiEventsAuth.getAccessToken();
    await hiEventsAuth.refreshToken();
    const newToken = await hiEventsAuth.getAccessToken();
    
    if (initialToken === newToken) {
      throw new Error('Token was not refreshed');
    }
  }
  
  // Additional test methods...
}
```

## Support Procedures

### User Support Checklist

When users report authentication issues:

1. **Initial Assessment**
   - [ ] Confirm app version and device type
   - [ ] Check if issue is widespread or isolated
   - [ ] Verify user credentials are correct
   - [ ] Check service status and recent deployments

2. **Basic Troubleshooting**
   - [ ] Have user restart the app
   - [ ] Clear app cache/data
   - [ ] Check device date/time settings
   - [ ] Verify network connectivity

3. **Advanced Troubleshooting**
   - [ ] Check security event logs for user
   - [ ] Review device security assessment
   - [ ] Verify token validity and refresh attempts
   - [ ] Check for certificate pinning issues

4. **Escalation Criteria**
   - Multiple users reporting same issue
   - Security-related authentication failures
   - System-wide authentication problems
   - Potential security incidents

### Log Analysis

#### Authentication Logs
```typescript
// Log analysis utility
class LogAnalyzer {
  async analyzeAuthenticationLogs(
    userId: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<AuthAnalysis> {
    const logs = await this.getLogsForUser(userId, timeRange);
    
    return {
      totalAttempts: logs.filter(l => l.type.includes('auth_')).length,
      successfulLogins: logs.filter(l => l.type === 'auth_success').length,
      failedLogins: logs.filter(l => l.type === 'auth_failure').length,
      tokenRefreshes: logs.filter(l => l.type === 'token_refresh').length,
      securityEvents: logs.filter(l => this.isSecurityEvent(l.type)),
      deviceInfo: this.extractDeviceInfo(logs),
      timeline: this.createTimeline(logs)
    };
  }
  
  private isSecurityEvent(eventType: string): boolean {
    const securityEvents = [
      'jailbreak_detected',
      'cert_pinning_failure',
      'biometric_failure',
      'debug_detected'
    ];
    
    return securityEvents.includes(eventType);
  }
}
```

#### Performance Analysis
```typescript
// Performance issue analysis
class PerformanceAnalyzer {
  async analyzePerformance(userId: string): Promise<PerformanceReport> {
    const metrics = await this.getPerformanceMetrics(userId);
    
    return {
      avgLoginTime: this.calculateAverage(metrics.loginTimes),
      avgTokenRefreshTime: this.calculateAverage(metrics.refreshTimes),
      networkLatency: this.calculateAverage(metrics.networkTimes),
      errorRate: metrics.errors.length / metrics.totalRequests,
      recommendations: this.generateRecommendations(metrics)
    };
  }
}
```

## Emergency Procedures

### Authentication System Down

**Immediate Response (0-15 minutes):**
1. Confirm system status across all components
2. Check Hi.Events backend API health
3. Verify mobile app connectivity
4. Enable emergency maintenance mode if needed

**Short-term Response (15-60 minutes):**
1. Implement emergency access procedures
2. Deploy hotfix if issue identified
3. Communicate with users via status page
4. Monitor system recovery

**Recovery Procedures:**
```typescript
// Emergency access implementation
class EmergencyAccess {
  async enableEmergencyMode(): Promise<void> {
    // Reduce security requirements temporarily
    await securityManager.setEmergencyConfig({
      minimumTrustScore: 0.1,
      jailbreakDetectionEnabled: false,
      biometricAuthRequired: false,
      certificatePinningEnabled: false
    });
    
    // Extend token validity
    await tokenManager.extendAllTokens(24 * 60 * 60 * 1000); // 24 hours
    
    // Enable bypass for critical users
    await this.enableCriticalUserBypass();
    
    console.log('Emergency access mode enabled');
  }
  
  async disableEmergencyMode(): Promise<void> {
    // Restore normal security configuration
    await securityManager.restoreNormalConfig();
    await tokenManager.restoreNormalTokenLifecycle();
    
    console.log('Emergency access mode disabled');
  }
}
```

### Security Incident Response

**Immediate Actions:**
1. Isolate affected systems
2. Preserve evidence and logs
3. Notify security team
4. Implement temporary controls

**Investigation Steps:**
1. Analyze security logs
2. Identify attack vectors
3. Assess data exposure
4. Document findings

**Recovery Actions:**
1. Patch vulnerabilities
2. Reset compromised credentials
3. Update security controls
4. Monitor for recurrence

## Contact Information

### Support Contacts

**Level 1 Support (User Issues):**
- Email: support@bole.to
- Response Time: 4 hours during business hours

**Level 2 Support (Technical Issues):**
- Email: dev@bole.to  
- Slack: #technical-support
- Response Time: 2 hours during business hours

**Level 3 Support (Security Issues):**
- Email: security@bole.to
- Emergency Phone: +1-XXX-XXX-XXXX
- Response Time: 30 minutes 24/7

### Escalation Matrix

| Issue Type | Level 1 | Level 2 | Level 3 |
|------------|---------|---------|---------|
| User login problems | ✅ | | |
| App crashes | ✅ | ✅ | |
| API failures | | ✅ | |
| Security incidents | | | ✅ |
| System outages | | ✅ | ✅ |

---

**Document Version**: 1.0  
**Last Updated**: September 11, 2024  
**Next Review**: December 11, 2024