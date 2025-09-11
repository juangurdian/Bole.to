# Migration Guide: Gateway OAuth to Hi.Events JWT

## Overview

This guide provides step-by-step instructions for migrating from the legacy Gateway OAuth/PKCE authentication system to the unified Hi.Events JWT authentication system. The migration includes backend configuration, mobile app deployment, and user data transition procedures.

## Migration Strategy

### Approach: Feature Flag Controlled Rollout

The migration uses a feature flag approach that allows:
- **Safe Production Deployment**: Gradual rollout to user segments
- **Instant Rollback Capability**: Immediate revert if issues arise  
- **A/B Testing**: Compare performance between systems
- **Zero Downtime**: Seamless transition without service interruption

### Migration Timeline

| Phase | Duration | Description | Success Criteria |
|-------|----------|-------------|------------------|
| **Phase 0** | 1 week | Backend preparation & testing | Hi.Events mobile endpoints ready |
| **Phase 1** | 1 week | Mobile app deployment with feature flags | App deployed with Hi.Events disabled |
| **Phase 2** | 2 weeks | Gradual user migration (5%, 25%, 50%) | Token migration success >99% |
| **Phase 3** | 1 week | Full migration completion | All users on Hi.Events system |
| **Phase 4** | 2 weeks | Legacy system deprecation | Gateway OAuth disabled |

## Pre-Migration Checklist

### Backend Requirements

- [ ] Hi.Events mobile auth endpoints deployed
- [ ] JWT configuration validated
- [ ] Database migration scripts ready
- [ ] Mobile API rate limiting configured
- [ ] SSL certificates and security headers verified
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested

### Mobile App Requirements

- [ ] Hi.Events authentication client implemented
- [ ] Security framework integrated (biometric, encryption)
- [ ] Token lifecycle management deployed
- [ ] Network resilience features tested
- [ ] Feature flag configuration validated
- [ ] App Store/Play Store build approval
- [ ] Rollback procedures documented

### Security Requirements

- [ ] Security assessment completed
- [ ] Penetration testing passed
- [ ] OWASP compliance verified
- [ ] Certificate pinning configured
- [ ] Device security policies defined
- [ ] Audit logging enabled
- [ ] Incident response procedures ready

## Step-by-Step Migration Procedure

### Step 1: Backend Preparation

#### 1.1 Deploy Hi.Events Mobile Endpoints
```bash
# Navigate to Hi.Events service
cd services/hi-events

# Run database migrations for mobile auth
php artisan migrate --path=/database/migrations/mobile_auth

# Deploy mobile authentication actions
php artisan route:cache
php artisan config:cache

# Verify endpoints are accessible
curl -X GET https://api.bole.to/api/auth/mobile/health
```

#### 1.2 Configure JWT Settings
```bash
# Generate JWT secret if not exists
php artisan jwt:secret

# Verify JWT configuration
php artisan tinker
>>> config('jwt.ttl')      // Should return 60 (minutes)
>>> config('jwt.algo')     // Should return 'HS256'
```

#### 1.3 Test Mobile API Endpoints
```bash
# Test health endpoint
curl -X GET https://api.bole.to/api/auth/mobile/health

# Test login endpoint with test credentials
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

### Step 2: Mobile App Deployment

#### 2.1 Build and Deploy Mobile App
```bash
# Navigate to mobile app
cd apps/mobile

# Install dependencies
npm install

# Build for production
expo build:ios --release-channel production
expo build:android --release-channel production

# Deploy to app stores (following existing procedures)
```

#### 2.2 Configure Feature Flags
```javascript
// app.config.js - Initial deployment with Hi.Events disabled
export default {
  expo: {
    extra: {
      USE_HIEVENTS_AUTH: 'false', // Start with legacy system
      HIEVENTS_URL: 'https://api.bole.to',
      // ... other config
    }
  }
};
```

#### 2.3 Verify App Deployment
- [ ] App successfully deploys to devices
- [ ] Legacy authentication still works
- [ ] Hi.Events client is present but inactive
- [ ] Feature flag system operational
- [ ] Security framework initialized

### Step 3: User Segment Migration

#### 3.1 Phase 1: Internal Testing (5% of users)
```javascript
// Enable Hi.Events for internal team and beta testers
const enableHiEventsFor = (userId) => {
  const internalUsers = ['team@bole.to', 'beta@bole.to'];
  const randomPercent = Math.random() * 100;
  
  return internalUsers.includes(userId) || randomPercent < 5;
};
```

**Monitoring Checklist:**
- [ ] Login success rates maintained
- [ ] Token refresh working correctly
- [ ] Account switching functional
- [ ] Security events properly logged
- [ ] Performance metrics within acceptable range
- [ ] No security incidents reported

#### 3.2 Phase 2: Early Adopters (25% of users)
```javascript
// Expand to 25% of users after 1 week of successful testing
const enableHiEventsFor = (userId) => {
  const hash = generateUserHash(userId);
  return (hash % 100) < 25;
};
```

**Validation Steps:**
- [ ] Monitor authentication error rates
- [ ] Verify token lifecycle management
- [ ] Check offline functionality
- [ ] Validate biometric authentication
- [ ] Confirm account switching works
- [ ] Review security audit logs

#### 3.3 Phase 3: Majority Migration (75% of users)
```javascript
// Expand to 75% of users after successful 25% rollout
const enableHiEventsFor = (userId) => {
  const hash = generateUserHash(userId);
  return (hash % 100) < 75;
};
```

#### 3.4 Phase 4: Complete Migration (100% of users)
```javascript
// Enable Hi.Events for all users
export default {
  expo: {
    extra: {
      USE_HIEVENTS_AUTH: 'true', // All users on Hi.Events
      // ... other config
    }
  }
};
```

### Step 4: Data Migration

#### 4.1 User Token Migration
```typescript
// Mobile app handles automatic token migration
class TokenMigration {
  static async migrateUserTokens(): Promise<boolean> {
    try {
      // Check for legacy Gateway tokens
      const hasLegacyTokens = await hasLegacyGatewayTokens();
      
      if (!hasLegacyTokens) {
        return false; // No migration needed
      }

      // Show migration UI to user
      const userConsent = await showMigrationDialog();
      
      if (userConsent) {
        // Clear legacy tokens
        await clearLegacyGatewayData();
        
        // Force re-authentication with Hi.Events
        await forceReAuthentication();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token migration failed:', error);
      return false;
    }
  }
}
```

#### 4.2 Session Data Migration
```typescript
// Preserve user session data during migration
class SessionMigration {
  static async preserveUserSession(legacySession: LegacySession): Promise<void> {
    try {
      // Extract user preferences
      const preferences = {
        biometricEnabled: legacySession.biometricEnabled,
        notificationsEnabled: legacySession.notificationsEnabled,
        language: legacySession.language,
        timezone: legacySession.timezone
      };

      // Store in new Hi.Events format
      await secureStorage.storeEncrypted('user_preferences', JSON.stringify(preferences));
      
      console.log('Session data migrated successfully');
    } catch (error) {
      console.error('Session migration failed:', error);
    }
  }
}
```

### Step 5: Legacy System Deprecation

#### 5.1 Gateway Service Deprecation Timeline

**Week 1: Monitoring Phase**
- [ ] Monitor Hi.Events adoption rates
- [ ] Verify zero critical issues
- [ ] Confirm all users migrated successfully
- [ ] Review security audit logs

**Week 2: Gateway Deprecation Warning**
```javascript
// Add deprecation warnings to Gateway responses
app.use('/auth', (req, res, next) => {
  res.header('X-Deprecated', 'true');
  res.header('X-Sunset', '2024-12-31T23:59:59Z');
  res.header('X-Migration-Info', 'https://docs.bole.to/migration');
  next();
});
```

**Week 3: Gateway Rate Limiting**
```javascript
// Reduce Gateway service rate limits
const gatewayLimits = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Reduced from 100 requests per window
  message: 'Gateway service is deprecated. Please update your app.'
};
```

**Week 4: Gateway Service Shutdown**
```javascript
// Return maintenance response from Gateway
app.use('/auth', (req, res) => {
  res.status(503).json({
    error: 'GATEWAY_DEPRECATED',
    message: 'This service has been deprecated. Please update your app.',
    migration_guide: 'https://docs.bole.to/migration'
  });
});
```

#### 5.2 Cleanup Procedures

**Database Cleanup:**
```sql
-- Archive legacy auth data (don't delete immediately)
CREATE TABLE legacy_auth_archive AS SELECT * FROM gateway_sessions;
CREATE TABLE legacy_oauth_archive AS SELECT * FROM oauth_tokens;

-- After 30 days, remove archived data
-- DROP TABLE legacy_auth_archive;
-- DROP TABLE legacy_oauth_archive;
```

**Code Cleanup:**
```bash
# Remove Gateway service code (after migration complete)
rm -rf services/gateway/src/auth/oauth
rm -rf services/gateway/src/auth/pkce
git add -A && git commit -m "Remove deprecated Gateway OAuth code"
```

## Rollback Procedures

### Immediate Rollback (Feature Flag)

```javascript
// Emergency rollback - revert to Gateway OAuth
export default {
  expo: {
    extra: {
      USE_HIEVENTS_AUTH: 'false', // Immediate rollback
      HIEVENTS_URL: 'https://api.bole.to',
    }
  }
};
```

### Rollback Steps

1. **Immediate Response**
   - [ ] Disable Hi.Events feature flag
   - [ ] Verify Gateway service is operational
   - [ ] Monitor authentication success rates
   - [ ] Clear Hi.Events tokens if needed

2. **User Communication**
   - [ ] In-app notification about temporary service change
   - [ ] Email to affected users explaining the situation
   - [ ] Status page update with incident details

3. **Investigation & Fix**
   - [ ] Identify root cause of rollback
   - [ ] Implement fixes in staging environment
   - [ ] Test fixes thoroughly
   - [ ] Prepare new migration plan

### Partial Rollback

```typescript
// Rollback specific user segments
const rollbackUsers = ['user1@example.com', 'user2@example.com'];

const shouldUseHiEvents = (userEmail: string): boolean => {
  if (rollbackUsers.includes(userEmail)) {
    return false; // Use Gateway for these users
  }
  return process.env.EXPO_PUBLIC_USE_HIEVENTS_AUTH === 'true';
};
```

## Monitoring and Validation

### Key Metrics to Monitor

**Authentication Metrics:**
- Login success rate (target: >99%)
- Token refresh success rate (target: >99.5%)
- Account switching success rate (target: >98%)
- Authentication response time (target: <2s)

**Security Metrics:**
- Biometric authentication adoption (target: >70%)
- Security incident count (target: 0 critical)
- Certificate pinning violations (target: 0)
- Device compromise detections (monitor trend)

**User Experience Metrics:**
- App crash rate (target: <0.1%)
- User complaints about authentication (target: <1%)
- Session duration (maintain or improve)
- Feature adoption rate (target: >80%)

### Monitoring Dashboard

```typescript
// Migration monitoring dashboard
interface MigrationMetrics {
  // User adoption
  hiEventsUserCount: number;
  gatewayUserCount: number;
  migrationSuccessRate: number;
  
  // Performance
  avgLoginTime: number;
  avgTokenRefreshTime: number;
  apiErrorRate: number;
  
  // Security  
  securityIncidentCount: number;
  biometricAdoptionRate: number;
  deviceThreatCount: number;
}
```

### Validation Tests

#### Automated Testing
```typescript
// Migration validation test suite
describe('Migration Validation', () => {
  test('User can login with Hi.Events', async () => {
    const result = await hiEventsAuth.login({
      email: 'test@example.com',
      password: 'testPassword123'
    });
    
    expect(result.user).toBeDefined();
    expect(result.accounts).toHaveLength.greaterThan(0);
    expect(result.currentAccount).toBeDefined();
  });

  test('Token refresh works correctly', async () => {
    await hiEventsAuth.login({ /* credentials */ });
    const refreshResult = await hiEventsAuth.refreshToken();
    
    expect(refreshResult).toBeDefined();
    expect(await hiEventsAuth.isTokenValid()).toBe(true);
  });

  test('Account switching requires biometric', async () => {
    await hiEventsAuth.login({ /* credentials */ });
    
    // Mock biometric failure
    mockBiometricAuth.mockResolvedValue({ success: false });
    
    await expect(
      hiEventsAuth.switchAccount('different-account-id')
    ).rejects.toThrow('Biometric authentication required');
  });
});
```

#### Manual Testing Checklist

**Pre-Migration Testing:**
- [ ] Hi.Events login flow works correctly
- [ ] Token refresh happens automatically
- [ ] Offline functionality works as expected
- [ ] Biometric authentication prompts correctly
- [ ] Account switching preserves context
- [ ] Security logging captures all events

**During Migration Testing:**
- [ ] Users can login regardless of system (Gateway/Hi.Events)
- [ ] No authentication interruptions during rollout
- [ ] Feature flag changes take effect immediately
- [ ] Rollback procedures work correctly
- [ ] Performance metrics remain stable

**Post-Migration Testing:**
- [ ] All users successfully migrated
- [ ] Legacy tokens cleared properly
- [ ] Gateway service can be safely disabled
- [ ] Security audit logs show no anomalies
- [ ] User experience maintained or improved

## Troubleshooting Common Issues

### Issue 1: JWT Token Validation Failures
**Symptoms:** 401 errors, users getting logged out unexpectedly
**Solution:**
```bash
# Check JWT configuration
php artisan tinker
>>> config('jwt.secret')
>>> config('jwt.ttl')

# Verify token signature
jwt-cli decode <token> --secret <secret>

# Check clock synchronization
ntpdate -s time.nist.gov
```

### Issue 2: Device Security Blocking Users
**Symptoms:** Users can't login on jailbroken/rooted devices
**Solution:**
```typescript
// Temporarily reduce security requirements
const securityConfig = {
  minimumTrustScore: 0.3, // Reduced from 0.7
  jailbreakDetectionEnabled: false, // Temporary disable
  deviceFingerprintingEnabled: true
};
```

### Issue 3: Biometric Authentication Not Working
**Symptoms:** Biometric prompts not appearing or failing
**Solution:**
```typescript
// Check biometric availability
const available = await LocalAuthentication.hasHardwareAsync();
const enrolled = await LocalAuthentication.isEnrolledAsync();

if (!available || !enrolled) {
  // Fall back to passcode/PIN
  await fallbackToPasscodeAuth();
}
```

### Issue 4: Network Connectivity Issues
**Symptoms:** Token refresh failing, offline mode not working
**Solution:**
```typescript
// Check network manager status
const networkStatus = NetworkManager.getInstance().getStatus();
console.log('Network status:', networkStatus);

// Force network retry
await NetworkManager.getInstance().forceRetryPendingOperations();
```

### Issue 5: Account Switching Failures
**Symptoms:** Users stuck in wrong account context
**Solution:**
```typescript
// Clear account context and force re-selection
await secureStorage.removeItem('current_account');
await hiEventsAuth.refreshUser(); // Will trigger account selection
```

## Success Criteria

### Migration Success Metrics

**Technical Success Criteria:**
- [ ] >99% of users successfully migrated
- [ ] <0.1% authentication error rate increase
- [ ] <2 second average authentication response time
- [ ] Zero critical security incidents
- [ ] >95% uptime during migration

**Business Success Criteria:**
- [ ] No increase in user complaints
- [ ] Maintained or improved user engagement
- [ ] Reduced infrastructure costs (Gateway elimination)
- [ ] Enhanced security posture
- [ ] Improved development velocity

**User Experience Success Criteria:**
- [ ] Seamless migration experience
- [ ] Enhanced offline functionality
- [ ] Faster authentication flows
- [ ] Improved security features
- [ ] Multi-account functionality adoption

### Post-Migration Validation

**30-Day Validation:**
- [ ] All users migrated successfully
- [ ] Legacy Gateway service decommissioned
- [ ] Performance metrics improved or maintained
- [ ] Security incidents below baseline
- [ ] User satisfaction maintained

**90-Day Validation:**
- [ ] Hi.Events authentication fully stable
- [ ] Advanced features (biometric, multi-account) adopted
- [ ] Development team velocity improved
- [ ] Infrastructure costs reduced
- [ ] Security posture enhanced

## Support and Documentation

### Migration Support Contacts

**Technical Issues:**
- Development Team: dev@bole.to
- Security Team: security@bole.to  
- Infrastructure Team: infra@bole.to

**User Support:**
- Customer Success: support@bole.to
- Documentation: docs@bole.to

### Additional Resources

- [Unified Auth System Documentation](./UNIFIED_AUTH_SYSTEM.md)
- [API Reference](./API_REFERENCE.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

---

**Document Version**: 1.0  
**Last Updated**: September 11, 2024  
**Migration Status**: Ready for Phase 1 Implementation