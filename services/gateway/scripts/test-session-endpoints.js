#!/usr/bin/env node

/**
 * Test script for session management endpoints
 */

const axios = require('axios');

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  deviceInfo: {
    deviceType: 'mobile',
    deviceName: 'Test iPhone',
    os: 'iOS',
    osVersion: '17.0',
    userAgent: 'Bole.to/1.0 (iPhone; iOS 17.0)',
    appVersion: '1.0.0'
  }
};

async function testSessionManagement() {
  console.log('🧪 Testing Session Management Endpoints\n');

  try {
    // Step 1: Login to get tokens
    console.log('1. Testing login with device info...');
    const loginResponse = await axios.post(`${GATEWAY_URL}/auth/login`, testUser);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const accessToken = loginResponse.data.data.tokens.access_token;
    console.log('✅ Login successful\n');

    // Step 2: Get user sessions
    console.log('2. Testing GET /auth/sessions...');
    const sessionsResponse = await axios.get(`${GATEWAY_URL}/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        limit: 10,
        offset: 0
      }
    });

    if (!sessionsResponse.data.success) {
      throw new Error('Get sessions failed');
    }

    const sessions = sessionsResponse.data.data.sessions;
    console.log(`✅ Retrieved ${sessions.length} sessions`);
    
    if (sessions.length > 0) {
      console.log('Session details:');
      sessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Device: ${session.deviceInfo.deviceName} (${session.deviceInfo.os})`);
        console.log(`     Created: ${session.createdAt}`);
        console.log(`     Active: ${session.isActive}`);
        console.log(`     Current: ${session.isCurrent}`);
      });
    }
    console.log('');

    // Step 3: Test session revocation (if we have sessions)
    if (sessions.length > 0) {
      console.log('3. Testing DELETE /auth/sessions/:id...');
      const sessionToRevoke = sessions[sessions.length - 1]; // Revoke the oldest session
      
      const revokeResponse = await axios.delete(`${GATEWAY_URL}/auth/sessions/${sessionToRevoke.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!revokeResponse.data.success) {
        throw new Error('Session revocation failed');
      }

      console.log(`✅ Session ${sessionToRevoke.id} revoked successfully\n`);
    }

    // Step 4: Verify sessions were updated
    console.log('4. Verifying sessions after revocation...');
    const updatedSessionsResponse = await axios.get(`${GATEWAY_URL}/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const updatedSessions = updatedSessionsResponse.data.data.sessions;
    console.log(`✅ Now showing ${updatedSessions.length} sessions\n`);

    console.log('🎉 All session management tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run tests
testSessionManagement().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});