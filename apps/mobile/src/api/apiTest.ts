import { httpClient } from './httpClient';
import { realApiService } from './realApiService';

/**
 * Simple API connectivity test
 * This file can be used to test the API integration independently
 */

export async function testApiConnectivity() {
  console.log('Testing API connectivity to staging gateway...');
  
  try {
    // Test 1: Health check
    const healthOk = await httpClient.healthCheck();
    console.log(`Health check: ${healthOk ? 'PASS' : 'FAIL'}`);
    
    if (healthOk) {
      // Test 2: Get categories (public endpoint)
      try {
        const categories = await realApiService.getCategories();
        console.log(`Categories endpoint: PASS (${categories.length} categories)`);
      } catch (error) {
        console.log('Categories endpoint: FAIL', error);
      }
      
      // Test 3: Get public events
      try {
        const events = await realApiService.getEvents({ per_page: 5 });
        console.log(`Events endpoint: PASS (${events.data.length} events)`);
      } catch (error) {
        console.log('Events endpoint: FAIL', error);
      }
    }
    
    return healthOk;
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return false;
  }
}

// Quick test for authentication endpoints (requires real credentials)
export async function testAuthEndpoints(email: string, password: string) {
  console.log('Testing authentication endpoints...');
  
  try {
    const loginResponse = await realApiService.login(email, password);
    console.log('Login endpoint: PASS', {
      userEmail: loginResponse.user.email,
      accountsCount: loginResponse.accounts.length,
      hasToken: !!loginResponse.token
    });
    return true;
  } catch (error: any) {
    console.log('Login endpoint: FAIL', error.message);
    return false;
  }
}

// Usage: Call this from a React component to test
export async function runBasicAPITest() {
  const results = {
    connectivity: await testApiConnectivity(),
    timestamp: new Date().toISOString()
  };
  
  console.log('API Test Results:', results);
  return results;
}