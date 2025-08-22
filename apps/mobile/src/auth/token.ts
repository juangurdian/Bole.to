import * as SecureStore from 'expo-secure-store';
import { coreApi, socialApi, cameraApi } from '../api/client';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  // Update all API clients with the new token
  coreApi.setToken(token);
  socialApi.setToken(token);
  cameraApi.setToken(token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  // Clear token from all API clients
  coreApi.setToken(null);
  socialApi.setToken(null);
  cameraApi.setToken(null);
}

export async function setUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const userData = await SecureStore.getItemAsync(USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

export async function clearAuth(): Promise<void> {
  await removeToken();
  await SecureStore.deleteItemAsync(USER_KEY);
}

// Initialize tokens on app start
export async function initializeAuth(): Promise<void> {
  const token = await getToken();
  if (token) {
    coreApi.setToken(token);
    socialApi.setToken(token);
    cameraApi.setToken(token);
  }
}