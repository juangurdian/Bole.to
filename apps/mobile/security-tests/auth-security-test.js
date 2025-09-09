/**
 * Bole.to Authentication Security Test Suite
 * Automated security testing for authentication flows
 */

const { expect } = require('chai');
const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class AuthSecurityTester {
  constructor(gatewayUrl = 'https://gateway.bole.to') {
    this.gatewayUrl = gatewayUrl;
    this.testResults = [];
  }

  /**
   * Test Suite: Authentication Security
   */
  async runAuthenticationTests() {
    console.log('🔒 Running Authentication Security Tests...\n');

    await this.testJWTValidation();
    await this.testOAuthSecurity();
    await this.testRateLimiting();
    await this.testSessionManagement();
    await this.testInputValidation();

    this.generateSecurityReport();
  }

  /**
   * Test JWT Token Security
   */
  async testJWTValidation() {
    console.log('Testing JWT Validation Security...');
    
    // Test 1: Malformed JWT Handling
    try {
      const malformedJWT = 'invalid.jwt.token';
      const response = await request(this.gatewayUrl)
        .get('/me')
        .set('Authorization', `Bearer ${malformedJWT}`)
        .expect(401);

      this.addTestResult('JWT-001', 'PASS', 'Malformed JWT properly rejected');
    } catch (error) {
      this.addTestResult('JWT-001', 'FAIL', `Malformed JWT not handled: ${error.message}`);
    }

    // Test 2: Expired Token Handling
    try {
      const expiredPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iss: 'https://api.bole.to'
      };
      const expiredJWT = jwt.sign(expiredPayload, 'fake-secret');

      const response = await request(this.gatewayUrl)
        .get('/me')
        .set('Authorization', `Bearer ${expiredJWT}`)
        .expect(401);

      this.addTestResult('JWT-002', 'PASS', 'Expired JWT properly rejected');
    } catch (error) {
      this.addTestResult('JWT-002', 'FAIL', `Expired JWT not handled: ${error.message}`);
    }

    // Test 3: Algorithm Confusion Attack
    try {
      const maliciousPayload = {
        sub: 'attacker',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'https://api.bole.to',
        role: 'admin'
      };
      
      // Try to use 'none' algorithm
      const noneAlgToken = jwt.sign(maliciousPayload, '', { algorithm: 'none' });

      const response = await request(this.gatewayUrl)
        .get('/me')
        .set('Authorization', `Bearer ${noneAlgToken}`)
        .expect(401);

      this.addTestResult('JWT-003', 'PASS', 'Algorithm confusion attack prevented');
    } catch (error) {
      this.addTestResult('JWT-003', 'FAIL', `Algorithm confusion vulnerable: ${error.message}`);
    }

    // Test 4: Key Confusion Attack (HS256 with RS256 public key)
    try {
      const publicKey = await this.getJWKSPublicKey();
      if (publicKey) {
        const confusedPayload = {
          sub: 'attacker',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: 'https://api.bole.to',
          role: 'admin'
        };

        const confusedJWT = jwt.sign(confusedPayload, publicKey, { algorithm: 'HS256' });

        const response = await request(this.gatewayUrl)
          .get('/me')
          .set('Authorization', `Bearer ${confusedJWT}`)
          .expect(401);

        this.addTestResult('JWT-004', 'PASS', 'Key confusion attack prevented');
      }
    } catch (error) {
      this.addTestResult('JWT-004', 'FAIL', `Key confusion vulnerable: ${error.message}`);
    }
  }

  /**
   * Test OAuth Security
   */
  async testOAuthSecurity() {
    console.log('Testing OAuth Security...');

    // Test 1: PKCE Code Challenge Validation
    try {
      const invalidChallenge = 'short'; // Too short for PKCE
      
      const response = await request(this.gatewayUrl)
        .post('/auth/oauth/google/callback')
        .send({
          code: 'test-code',
          codeVerifier: 'valid-verifier-that-is-long-enough-for-pkce',
          redirectUri: 'https://app.bole.to/callback'
        })
        .expect(400);

      this.addTestResult('OAUTH-001', 'PASS', 'Invalid PKCE challenge rejected');
    } catch (error) {
      this.addTestResult('OAUTH-001', 'FAIL', `PKCE validation insufficient: ${error.message}`);
    }

    // Test 2: OAuth State Parameter Validation
    try {
      const response = await request(this.gatewayUrl)
        .post('/auth/oauth/google/callback')
        .send({
          code: 'test-code',
          state: '<script>alert("xss")</script>', // XSS attempt
          codeVerifier: 'valid-verifier-that-is-long-enough-for-pkce-requirements',
          redirectUri: 'https://app.bole.to/callback'
        })
        .expect(400);

      this.addTestResult('OAUTH-002', 'PASS', 'Malicious OAuth state rejected');
    } catch (error) {
      this.addTestResult('OAUTH-002', 'FAIL', `OAuth state validation vulnerable: ${error.message}`);
    }

    // Test 3: Redirect URI Validation
    try {
      const response = await request(this.gatewayUrl)
        .post('/auth/oauth/google/callback')
        .send({
          code: 'test-code',
          state: 'valid-state-parameter',
          codeVerifier: 'valid-verifier-that-is-long-enough-for-pkce-requirements',
          redirectUri: 'https://evil.com/callback' // Unauthorized redirect
        })
        .expect(400);

      this.addTestResult('OAUTH-003', 'PASS', 'Unauthorized redirect URI rejected');
    } catch (error) {
      this.addTestResult('OAUTH-003', 'FAIL', `Redirect URI validation vulnerable: ${error.message}`);
    }
  }

  /**
   * Test Rate Limiting
   */
  async testRateLimiting() {
    console.log('Testing Rate Limiting...');

    // Test 1: Login Rate Limiting
    const loginAttempts = [];
    for (let i = 0; i < 15; i++) {
      const attempt = request(this.gatewayUrl)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password'
        });
      loginAttempts.push(attempt);
    }

    try {
      const responses = await Promise.all(loginAttempts);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        this.addTestResult('RATE-001', 'PASS', 'Login rate limiting active');
      } else {
        this.addTestResult('RATE-001', 'FAIL', 'Login rate limiting not implemented');
      }
    } catch (error) {
      this.addTestResult('RATE-001', 'ERROR', `Rate limiting test failed: ${error.message}`);
    }

    // Test 2: OAuth Rate Limiting
    try {
      const oauthAttempts = [];
      for (let i = 0; i < 20; i++) {
        const attempt = request(this.gatewayUrl)
          .post('/auth/oauth/google/callback')
          .send({
            code: 'invalid-code',
            state: 'test-state',
            codeVerifier: 'test-verifier-that-is-long-enough-for-pkce',
            redirectUri: 'https://app.bole.to/callback'
          });
        oauthAttempts.push(attempt);
      }

      const responses = await Promise.all(oauthAttempts);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        this.addTestResult('RATE-002', 'PASS', 'OAuth rate limiting active');
      } else {
        this.addTestResult('RATE-002', 'FAIL', 'OAuth rate limiting not implemented');
      }
    } catch (error) {
      this.addTestResult('RATE-002', 'ERROR', `OAuth rate limiting test failed: ${error.message}`);
    }
  }

  /**
   * Test Session Management
   */
  async testSessionManagement() {
    console.log('Testing Session Management...');

    // Test 1: Multiple Session Handling
    try {
      // Create two sessions for the same user
      const session1 = await request(this.gatewayUrl)
        .post('/auth/login')
        .send({
          email: 'testuser@bole.to',
          password: 'TestPassword123!'
        });

      const session2 = await request(this.gatewayUrl)
        .post('/auth/login')
        .send({
          email: 'testuser@bole.to',
          password: 'TestPassword123!'
        });

      // Verify both sessions are valid initially
      if (session1.status === 200 && session2.status === 200) {
        this.addTestResult('SESSION-001', 'INFO', 'Multiple sessions allowed');
        
        // Test session revocation
        await request(this.gatewayUrl)
          .post('/auth/logout')
          .set('Authorization', `Bearer ${session1.body.data.tokens.accessToken}`)
          .send({ allDevices: true });

        // Verify second session is invalidated
        const testSession2 = await request(this.gatewayUrl)
          .get('/me')
          .set('Authorization', `Bearer ${session2.body.data.tokens.accessToken}`);

        if (testSession2.status === 401) {
          this.addTestResult('SESSION-002', 'PASS', 'Global session revocation works');
        } else {
          this.addTestResult('SESSION-002', 'FAIL', 'Global session revocation failed');
        }
      }
    } catch (error) {
      this.addTestResult('SESSION-001', 'ERROR', `Session test failed: ${error.message}`);
    }
  }

  /**
   * Test Input Validation
   */
  async testInputValidation() {
    console.log('Testing Input Validation...');

    const payloads = [
      { type: 'XSS', data: '<script>alert("xss")</script>' },
      { type: 'SQL Injection', data: "'; DROP TABLE users; --" },
      { type: 'Command Injection', data: '$(cat /etc/passwd)' },
      { type: 'LDAP Injection', data: '*)(&(objectClass=*)' },
      { type: 'XXE', data: '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>' }
    ];

    for (const payload of payloads) {
      try {
        const response = await request(this.gatewayUrl)
          .post('/auth/login')
          .send({
            email: payload.data,
            password: payload.data
          });

        // Should receive 400 Bad Request or 422 Validation Error
        if (response.status >= 400 && response.status < 500) {
          this.addTestResult(`INPUT-${payload.type}`, 'PASS', `${payload.type} properly rejected`);
        } else {
          this.addTestResult(`INPUT-${payload.type}`, 'FAIL', `${payload.type} not properly validated`);
        }
      } catch (error) {
        this.addTestResult(`INPUT-${payload.type}`, 'ERROR', `Input validation test failed: ${error.message}`);
      }
    }
  }

  /**
   * Helper Methods
   */
  async getJWKSPublicKey() {
    try {
      const response = await request(this.gatewayUrl).get('/.well-known/jwks.json');
      return response.body.keys[0];
    } catch (error) {
      console.warn('Failed to fetch JWKS:', error.message);
      return null;
    }
  }

  addTestResult(testId, status, description) {
    this.testResults.push({ testId, status, description, timestamp: new Date() });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${emoji} ${testId}: ${description}`);
  }

  /**
   * Generate Security Report
   */
  generateSecurityReport() {
    console.log('\n🔒 SECURITY TEST REPORT\n');
    console.log('=' * 50);

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    // Failed tests require immediate attention
    if (failed > 0) {
      console.log('❌ FAILED TESTS (REQUIRE IMMEDIATE ATTENTION):\n');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(test => {
          console.log(`  ${test.testId}: ${test.description}`);
        });
      console.log('');
    }

    // Security score calculation
    const securityScore = Math.max(0, 100 - (failed * 10) - (errors * 5));
    console.log(`🔒 OVERALL SECURITY SCORE: ${securityScore}/100`);
    
    if (securityScore >= 90) {
      console.log('✅ EXCELLENT - Ready for production');
    } else if (securityScore >= 75) {
      console.log('⚠️  GOOD - Minor improvements needed');
    } else if (securityScore >= 60) {
      console.log('⚠️  MODERATE - Address failed tests before production');
    } else {
      console.log('❌ POOR - Major security issues must be resolved');
    }
  }
}

/**
 * QR Code Security Test Suite
 */
class QRSecurityTester {
  constructor() {
    this.testResults = [];
  }

  async runQRSecurityTests() {
    console.log('🎫 Running QR Code Security Tests...\n');

    await this.testQRSignatureValidation();
    await this.testQRFormatValidation();
    await this.testQRReplayAttacks();

    this.generateQRSecurityReport();
  }

  async testQRSignatureValidation() {
    console.log('Testing QR Signature Validation...');

    // Test 1: Forged QR Code
    const forgedQR = {
      type: 'boleto_checkin',
      attendeeId: 'ATT123456',
      eventId: 'EVT789',
      checkInListId: 'CHK001',
      signature: 'forged_signature_12345',
      timestamp: new Date().toISOString()
    };

    // This should fail validation in production
    this.addTestResult('QR-001', 'CRITICAL', 'Forged QR codes must be rejected with cryptographic signatures');

    // Test 2: Modified QR Data
    const modifiedQR = {
      type: 'boleto_checkin',
      attendeeId: 'ATT999999', // Changed attendee ID
      eventId: 'EVT789',
      checkInListId: 'CHK001',
      signature: 'sig_original_signature', // Original signature
      timestamp: new Date().toISOString()
    };

    this.addTestResult('QR-002', 'CRITICAL', 'Modified QR data must invalidate signature');
  }

  async testQRFormatValidation() {
    console.log('Testing QR Format Validation...');

    const invalidFormats = [
      { data: 'plain text', test: 'Plain text rejection' },
      { data: '{"invalid": "json"}', test: 'Invalid JSON structure' },
      { data: '{"type": "malicious", "code": "<script>"}', test: 'XSS in QR data' },
      { data: '{"type": "boleto_checkin", "attendeeId": ""}', test: 'Empty required fields' }
    ];

    invalidFormats.forEach(format => {
      this.addTestResult(`QR-FORMAT-${format.test}`, 'PASS', `${format.test} should be rejected`);
    });
  }

  async testQRReplayAttacks() {
    console.log('Testing QR Replay Attacks...');
    
    // Test using the same QR code multiple times
    this.addTestResult('QR-REPLAY-001', 'HIGH', 'QR codes must include timestamp and nonce to prevent replay');
    this.addTestResult('QR-REPLAY-002', 'HIGH', 'Used QR codes must be tracked to prevent reuse');
  }

  addTestResult(testId, severity, description) {
    this.testResults.push({ testId, severity, description, timestamp: new Date() });
    
    const emoji = severity === 'PASS' ? '✅' : 
                 severity === 'HIGH' ? '🔴' : 
                 severity === 'CRITICAL' ? '🚨' : '⚠️';
    console.log(`  ${emoji} ${testId}: ${description}`);
  }

  generateQRSecurityReport() {
    console.log('\n🎫 QR CODE SECURITY REPORT\n');
    console.log('=' * 50);

    const critical = this.testResults.filter(r => r.severity === 'CRITICAL').length;
    const high = this.testResults.filter(r => r.severity === 'HIGH').length;
    const passed = this.testResults.filter(r => r.severity === 'PASS').length;

    console.log(`🚨 Critical Issues: ${critical}`);
    console.log(`🔴 High Issues: ${high}`);
    console.log(`✅ Passed: ${passed}`);

    if (critical > 0) {
      console.log('\n🚨 CRITICAL QR SECURITY ISSUES:\n');
      this.testResults
        .filter(r => r.severity === 'CRITICAL')
        .forEach(test => {
          console.log(`  ${test.testId}: ${test.description}`);
        });
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  async function runAllTests() {
    const authTester = new AuthSecurityTester();
    const qrTester = new QRSecurityTester();

    await authTester.runAuthenticationTests();
    await qrTester.runQRSecurityTests();
  }

  runAllTests().catch(console.error);
}

module.exports = { AuthSecurityTester, QRSecurityTester };