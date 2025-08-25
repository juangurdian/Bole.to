import * as SecureStore from 'expo-secure-store';

// Updated to use Gateway token keys for consistency
const TOKEN_KEY = 'gateway_access_token';
const REFRESH_TOKEN_KEY = 'gateway_refresh_token';  
const USER_KEY = 'user_data';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function saveRefreshToken(refreshToken: string) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function removeRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  const userData = await SecureStore.getItemAsync(USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function removeUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}