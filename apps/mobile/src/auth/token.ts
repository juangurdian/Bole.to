import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const ACCOUNT_KEY = 'account_data';

// Token management
export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// User management
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

// Account management (for multi-tenant support)
export async function saveAccount(account: any) {
  await SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(account));
}

export async function getAccount(): Promise<any | null> {
  const accountData = await SecureStore.getItemAsync(ACCOUNT_KEY);
  return accountData ? JSON.parse(accountData) : null;
}

export async function removeAccount() {
  await SecureStore.deleteItemAsync(ACCOUNT_KEY);
}

// Clear all auth data
export async function clearAllAuthData() {
  await Promise.all([
    removeToken(),
    removeUser(),
    removeAccount()
  ]);
}