import * as SecureStore from 'expo-secure-store';
import { HiEventsUser, HiEventsAccount, TokenMetadata } from './hiEventsAuthClient';
import { secureStorage } from '../security/secureStorage';
import { securityLogger } from '../security/securityLogger';

// Hi.Events token storage keys
const HI_EVENTS_TOKEN_KEY = 'hiEvents_access_token';
const HI_EVENTS_USER_KEY = 'hiEvents_user_data';
const HI_EVENTS_CURRENT_ACCOUNT_KEY = 'hiEvents_current_account';
const HI_EVENTS_TOKEN_METADATA_KEY = 'hiEvents_token_metadata';

// Legacy Gateway token keys (for backward compatibility during migration)
const GATEWAY_TOKEN_KEY = 'gateway_access_token';
const GATEWAY_REFRESH_TOKEN_KEY = 'gateway_refresh_token';  
const GATEWAY_USER_KEY = 'user_data';

// Hi.Events Token Management with Enhanced Security
export async function saveHiEventsToken(token: string) {
  try {
    // Use encrypted storage for enhanced security
    await secureStorage.storeToken(HI_EVENTS_TOKEN_KEY, token);
    securityLogger.debug('Hi.Events token stored securely', {}, 'TokenManager');
  } catch (error) {
    securityLogger.error('Failed to store Hi.Events token securely', securityLogger.sanitizeError(error), 'TokenManager');
    // Fallback to basic SecureStore
    await SecureStore.setItemAsync(HI_EVENTS_TOKEN_KEY, token);
  }
}

export async function getHiEventsToken(): Promise<string | null> {
  try {
    // Try encrypted storage first
    const token = await secureStorage.getToken(HI_EVENTS_TOKEN_KEY);
    if (token) {
      securityLogger.debug('Hi.Events token retrieved from secure storage', {}, 'TokenManager');
      return token;
    }
  } catch (error) {
    securityLogger.warn('Failed to retrieve token from secure storage, trying fallback', securityLogger.sanitizeError(error), 'TokenManager');
  }
  
  // Fallback to basic SecureStore
  return await SecureStore.getItemAsync(HI_EVENTS_TOKEN_KEY);
}

export async function removeHiEventsToken() {
  try {
    // Use secure deletion
    await secureStorage.deleteSecure(HI_EVENTS_TOKEN_KEY);
    securityLogger.debug('Hi.Events token securely deleted', {}, 'TokenManager');
  } catch (error) {
    securityLogger.warn('Failed to securely delete token, using standard deletion', securityLogger.sanitizeError(error), 'TokenManager');
    // Fallback to basic deletion
    await SecureStore.deleteItemAsync(HI_EVENTS_TOKEN_KEY);
  }
}

export async function saveHiEventsUser(user: HiEventsUser) {
  try {
    // Use encrypted storage for user data
    await secureStorage.storeEncrypted(HI_EVENTS_USER_KEY, JSON.stringify(user));
    securityLogger.debug('Hi.Events user data stored securely', { userId: user.id }, 'TokenManager');
  } catch (error) {
    securityLogger.error('Failed to store user data securely', securityLogger.sanitizeError(error), 'TokenManager');
    // Fallback to basic SecureStore
    await SecureStore.setItemAsync(HI_EVENTS_USER_KEY, JSON.stringify(user));
  }
}

export async function getHiEventsUser(): Promise<HiEventsUser | null> {
  try {
    // Try encrypted storage first
    const userData = await secureStorage.getDecrypted(HI_EVENTS_USER_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      securityLogger.debug('Hi.Events user data retrieved from secure storage', { userId: user.id }, 'TokenManager');
      return user;
    }
  } catch (error) {
    securityLogger.warn('Failed to retrieve user data from secure storage, trying fallback', securityLogger.sanitizeError(error), 'TokenManager');
  }
  
  // Fallback to basic SecureStore
  const userData = await SecureStore.getItemAsync(HI_EVENTS_USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function removeHiEventsUser() {
  try {
    // Use secure deletion
    await secureStorage.deleteSecure(HI_EVENTS_USER_KEY);
    securityLogger.debug('Hi.Events user data securely deleted', {}, 'TokenManager');
  } catch (error) {
    securityLogger.warn('Failed to securely delete user data, using standard deletion', securityLogger.sanitizeError(error), 'TokenManager');
    // Fallback to basic deletion
    await SecureStore.deleteItemAsync(HI_EVENTS_USER_KEY);
  }
}

export async function saveHiEventsCurrentAccount(account: HiEventsAccount) {
  await SecureStore.setItemAsync(HI_EVENTS_CURRENT_ACCOUNT_KEY, JSON.stringify(account));
}

export async function getHiEventsCurrentAccount(): Promise<HiEventsAccount | null> {
  const accountData = await SecureStore.getItemAsync(HI_EVENTS_CURRENT_ACCOUNT_KEY);
  return accountData ? JSON.parse(accountData) : null;
}

export async function removeHiEventsCurrentAccount() {
  await SecureStore.deleteItemAsync(HI_EVENTS_CURRENT_ACCOUNT_KEY);
}

export async function saveHiEventsTokenMetadata(metadata: TokenMetadata) {
  await SecureStore.setItemAsync(HI_EVENTS_TOKEN_METADATA_KEY, JSON.stringify(metadata));
}

export async function getHiEventsTokenMetadata(): Promise<TokenMetadata | null> {
  const metadataStr = await SecureStore.getItemAsync(HI_EVENTS_TOKEN_METADATA_KEY);
  return metadataStr ? JSON.parse(metadataStr) : null;
}

export async function removeHiEventsTokenMetadata() {
  await SecureStore.deleteItemAsync(HI_EVENTS_TOKEN_METADATA_KEY);
}

export async function clearAllHiEventsData() {
  await Promise.all([
    removeHiEventsToken(),
    removeHiEventsUser(),
    removeHiEventsCurrentAccount(),
    removeHiEventsTokenMetadata(),
  ]);
}

// Legacy Gateway token functions (for backward compatibility during migration)
export async function saveToken(token: string) {
  await SecureStore.setItemAsync(GATEWAY_TOKEN_KEY, token);
}

export async function saveRefreshToken(refreshToken: string) {
  await SecureStore.setItemAsync(GATEWAY_REFRESH_TOKEN_KEY, refreshToken);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(GATEWAY_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(GATEWAY_REFRESH_TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(GATEWAY_TOKEN_KEY);
}

export async function removeRefreshToken() {
  await SecureStore.deleteItemAsync(GATEWAY_REFRESH_TOKEN_KEY);
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync(GATEWAY_USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  const userData = await SecureStore.getItemAsync(GATEWAY_USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function removeUser() {
  await SecureStore.deleteItemAsync(GATEWAY_USER_KEY);
}

// Migration utility to check if user has legacy Gateway tokens
export async function hasLegacyGatewayTokens(): Promise<boolean> {
  const gatewayToken = await getToken();
  return !!gatewayToken;
}

// Migration utility to clear legacy Gateway tokens
export async function clearLegacyGatewayData() {
  await Promise.all([
    removeToken(),
    removeRefreshToken(),
    removeUser(),
  ]);
}