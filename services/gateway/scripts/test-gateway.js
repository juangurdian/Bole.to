#!/usr/bin/env node

/**
 * Simple test script for Gateway service
 * Run with: node scripts/test-gateway.js
 */

const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001';

async function testEndpoint(method, path, data = null) {
  try {
    console.log(`\n🧪 Testing ${method.toUpperCase()} ${path}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${GATEWAY_URL}${path}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    
    return response;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Gateway Service Tests');
  console.log(`📡 Gateway URL: ${GATEWAY_URL}`);
  
  // Test 1: Health Check
  console.log('\n=== Health Checks ===');
  await testEndpoint('GET', '/healthz');
  await testEndpoint('GET', '/healthz?deep=true');
  
  // Test 2: JWKS Endpoint
  console.log('\n=== JWKS Endpoint ===');
  await testEndpoint('GET', '/.well-known/jwks.json');
  
  // Test 3: OAuth Start Flow
  console.log('\n=== OAuth Start Flow ===');
  await testEndpoint('POST', '/auth/oauth/google/start', {
    redirectUri: 'com.bole.to://oauth/callback'
  });
  
  // Test 4: Invalid OAuth Provider
  console.log('\n=== Invalid OAuth Provider ===');
  await testEndpoint('POST', '/auth/oauth/invalid/start', {
    redirectUri: 'com.bole.to://oauth/callback'
  });
  
  // Test 5: Missing Authorization for Profile
  console.log('\n=== Missing Authorization ===');
  await testEndpoint('GET', '/me');
  
  // Test 6: Invalid Endpoint
  console.log('\n=== Invalid Endpoint ===');
  await testEndpoint('GET', '/invalid-endpoint');
  
  console.log('\n✅ Gateway tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Health checks should return 200 OK');
  console.log('- JWKS should return JWT public keys');
  console.log('- OAuth start should return auth URL and PKCE parameters');
  console.log('- Invalid requests should return appropriate error responses');
  console.log('- Profile endpoints should require authorization');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Gateway Service Test Script');
  console.log('');
  console.log('Usage: node scripts/test-gateway.js');
  console.log('');
  console.log('Environment Variables:');
  console.log('  GATEWAY_URL - Gateway service URL (default: http://localhost:3001)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/test-gateway.js');
  console.log('  GATEWAY_URL=http://gateway.bole.to node scripts/test-gateway.js');
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});