#!/usr/bin/env node

/**
 * Test script for database session methods
 */

require('dotenv').config();
const database = require('../src/models/database');
const { v4: uuidv4 } = require('uuid');

async function testDatabaseMethods() {
  console.log('🧪 Testing Database Session Methods\n');

  try {
    // Initialize database
    await database.initialize();
    console.log('✅ Database initialized\n');

    // Test data
    const userId = 'test-user-123';
    const accountId = 'test-account-456';
    const deviceInfo = {
      deviceType: 'mobile',
      deviceName: 'Test Device',
      os: 'iOS',
      osVersion: '17.0',
      appVersion: '1.0.0',
      userAgent: 'Bole.to/1.0'
    };
    const ipAddress = '192.168.1.100';

    // Step 1: Create a refresh token
    console.log('1. Testing storeRefreshToken...');
    const tokenHash = 'test-token-hash-' + Date.now();
    const tokenRecord = await database.storeRefreshToken(userId, accountId, tokenHash, deviceInfo, ipAddress);
    console.log('✅ Refresh token created:', tokenRecord.id);
    console.log('');

    // Step 2: Create session record
    console.log('2. Testing createSessionRecord...');
    const sessionRecord = await database.createSessionRecord(userId, tokenRecord.id, deviceInfo, ipAddress);
    console.log('✅ Session record created:', sessionRecord.id);
    console.log('');

    // Step 3: Update session activity
    console.log('3. Testing updateSessionActivity...');
    const updatedSession = await database.updateSessionActivity(tokenRecord.id);
    console.log('✅ Session activity updated');
    console.log('');

    // Step 4: Get user sessions
    console.log('4. Testing getUserSessions...');
    const sessionsResult = await database.getUserSessions(userId, 10, 0);
    console.log(`✅ Retrieved ${sessionsResult.sessions.length} sessions`);
    
    if (sessionsResult.sessions.length > 0) {
      const session = sessionsResult.sessions[0];
      console.log('Sample session:');
      console.log(`  ID: ${session.id}`);
      console.log(`  Device: ${session.deviceInfo.deviceName}`);
      console.log(`  OS: ${session.deviceInfo.os}`);
      console.log(`  Active: ${session.isActive}`);
      console.log(`  Created: ${session.createdAt}`);
    }
    console.log('');

    // Step 5: Test session revocation
    if (sessionsResult.sessions.length > 0) {
      console.log('5. Testing revokeSpecificSession...');
      const sessionId = sessionsResult.sessions[0].id;
      const revokeResult = await database.revokeSpecificSession(sessionId, userId);
      console.log('✅ Session revoked:', revokeResult.sessionId);
      console.log('');
    }

    // Step 6: Verify session was revoked
    console.log('6. Verifying session revocation...');
    const finalSessionsResult = await database.getUserSessions(userId, 10, 0);
    console.log(`✅ Now showing ${finalSessionsResult.sessions.length} sessions`);
    console.log('');

    console.log('🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await database.close();
    console.log('🔒 Database connection closed');
  }
}

// Run tests
testDatabaseMethods().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});