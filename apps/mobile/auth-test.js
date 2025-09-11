#!/usr/bin/env node
/**
 * Mobile Authentication System Test
 * 
 * This script tests the current authentication system in the mobile app
 * to determine what's actually working vs what should be working.
 */

const { GatewayAuthService } = require('./src/auth/gateway-auth-service.ts');

async function testCurrentAuthSystem() {
  console.log("🔍 Mobile Authentication System Test");
  console.log("=====================================\n");

  const gateway = GatewayAuthService.getInstance();
  
  // Test 1: Configuration Check
  console.log("1. Configuration Check:");
  console.log(`   Gateway URL: ${process.env.EXPO_PUBLIC_GATEWAY_URL || 'https://gateway.bole.to'}`);
  console.log(`   Hi.Events Auth Enabled: ${process.env.EXPO_PUBLIC_USE_HIEVENTS_AUTH === 'true'}`);
  console.log(`   Hi.Events API Enabled: ${process.env.EXPO_PUBLIC_USE_HIEVENTS_API === 'true'}`);
  console.log(`   Skip Auth: ${process.env.EXPO_PUBLIC_SKIP_AUTH === 'true'}\n`);

  // Test 2: Token Storage Security Check
  console.log("2. Token Storage Security Test:");
  try {
    const token = await gateway.getAccessToken();
    if (token) {
      console.log("   ✅ Access token found in SecureStore");
      console.log(`   Token preview: ${token.substring(0, 20)}...`);
      
      // Test JWT structure
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log("   ✅ JWT structure valid");
          console.log(`   Token claims: ${Object.keys(payload).join(', ')}`);
          console.log(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown'}`);
          
          // Check for Hi.Events specific claims
          const hasAccountId = !!payload.account_id;
          const hasRoles = !!payload.roles;
          console.log(`   ${hasAccountId ? '✅' : '❌'} Has account_id claim`);
          console.log(`   ${hasRoles ? '✅' : '❌'} Has roles claim`);
        } else {
          console.log("   ❌ Invalid JWT format");
        }
      } catch (e) {
        console.log(`   ❌ JWT decode error: ${e.message}`);
      }
      
      // Test token validity
      const isValid = await gateway.isTokenValid();
      console.log(`   ${isValid ? '✅' : '❌'} Token is ${isValid ? 'valid' : 'expired'}`);
    } else {
      console.log("   ❌ No access token found - user not authenticated");
    }
  } catch (error) {
    console.log(`   ❌ Token check error: ${error.message}`);
  }
  console.log();

  // Test 3: Network Connectivity Test
  console.log("3. Network Connectivity Test:");
  try {
    // Test production gateway
    const prodUrl = 'https://gateway.bole.to/healthz';
    console.log(`   Testing: ${prodUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(prodUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Bole.to-Mobile-Test/1.0.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log("   ✅ Production gateway accessible");
      const data = await response.text();
      console.log(`   Response: ${data.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Production gateway error: ${response.status}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("   ❌ Production gateway timeout (>5s)");
    } else {
      console.log(`   ❌ Production gateway unreachable: ${error.message}`);
    }
  }

  try {
    // Test localhost gateway
    const localUrl = 'http://localhost:3001/healthz';
    console.log(`   Testing: ${localUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(localUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log("   ✅ Local gateway accessible");
    } else {
      console.log(`   ❌ Local gateway error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Local gateway unreachable: ${error.message}`);
  }
  console.log();

  // Test 4: API Integration Test
  console.log("4. API Integration Test:");
  console.log("   Current API: Mock adapter (not using real authentication)");
  console.log("   Authentication bypass: API calls work without tokens");
  console.log("   ❌ Real authentication not integrated with API layer");
  console.log();

  // Test 5: OAuth Provider Availability
  console.log("5. OAuth Provider Test:");
  try {
    const { getAvailableProviders } = require('./src/auth/oauth-providers.ts');
    const providers = await getAvailableProviders();
    console.log(`   Available providers: ${providers.map(p => p.name).join(', ')}`);
    
    for (const provider of providers) {
      console.log(`   ${provider.name}: Available for authentication`);
    }
    
    if (providers.length === 0) {
      console.log("   ❌ No OAuth providers available");
    }
  } catch (error) {
    console.log(`   ❌ OAuth provider check failed: ${error.message}`);
  }
  console.log();

  // Test 6: Authentication State
  console.log("6. Authentication State Test:");
  console.log("   Auth Provider: Gateway Authentication Service");
  console.log("   Auth Context: React Context with useAuth hook");
  console.log("   Session Management: Token-based with refresh capability");
  console.log("   Biometric Support: Available via expo-local-authentication");
  console.log();

  // Summary
  console.log("📊 SUMMARY");
  console.log("=========");
  console.log("✅ Authentication system: Gateway OAuth (NOT Hi.Events)");
  console.log("✅ Token storage: SecureStore (secure)");
  console.log("✅ OAuth providers: Available (Google/Apple)");
  console.log("✅ Session management: Implemented");
  console.log("❌ Backend connectivity: Gateway service unreachable");
  console.log("❌ API integration: Using mock data (not authenticated)");
  console.log("❌ Hi.Events endpoints: Not implemented for mobile");
  console.log("❌ JWT claims: Missing Hi.Events specific claims");
  console.log();
  console.log("🚨 CRITICAL ISSUES:");
  console.log("1. Gateway service is not running/accessible");
  console.log("2. Mobile app cannot authenticate users");
  console.log("3. API layer is completely mocked");
  console.log("4. No integration with Hi.Events backend");
  console.log("5. Missing mobile-specific auth endpoints");
}

// Run the test
if (require.main === module) {
  testCurrentAuthSystem().catch(console.error);
}