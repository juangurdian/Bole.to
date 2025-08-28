import { realApiService } from '../api/realApiService';
import { 
  saveToken, 
  getToken, 
  removeToken, 
  saveUser, 
  getUser, 
  removeUser,
  saveAccount,
  getAccount,
  removeAccount
} from './token';
import { User, Account, LoginResponse, TokenResponse } from '../types/models';

export interface AuthUser extends User {
  account?: Account;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authenticate user with email and password
   * Returns user data and available accounts
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await realApiService.login(email, password);
      
      // If user has only one account, auto-select it and save token
      if (response.accounts.length === 1 && response.token) {
        await this.saveAuthData(response.token, response.user, response.accounts[0]);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed. Please check your credentials and try again.');
    }
  }

  /**
   * Select account for multi-tenant users
   * Returns JWT token and saves auth data
   */
  async selectAccount(accountId: string): Promise<TokenResponse> {
    try {
      const response = await realApiService.selectAccount(accountId);
      await this.saveAuthData(response.token, response.user, response.account);
      return response;
    } catch (error) {
      console.error('Account selection failed:', error);
      throw new Error('Failed to select account. Please try again.');
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) return false;

      // Verify token by making a test API call
      await realApiService.getCurrentUser();
      return true;
    } catch (error) {
      // Token is invalid or expired
      await this.logout();
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const [token, userData, accountData] = await Promise.all([
        getToken(),
        getUser(),
        getAccount()
      ]);

      if (!token || !userData) {
        return null;
      }

      return {
        ...userData,
        account: accountData || undefined
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Refresh user data from API
   */
  async refreshUserData(): Promise<AuthUser> {
    try {
      const user = await realApiService.getCurrentUser();
      await saveUser(user);
      
      const account = await getAccount();
      return {
        ...user,
        account: account || undefined
      };
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw new Error('Failed to refresh user data');
    }
  }

  /**
   * Logout user and clear all auth data
   */
  async logout(): Promise<void> {
    try {
      await Promise.all([
        removeToken(),
        removeUser(),
        removeAccount()
      ]);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, ensure local data is cleared
    }
  }

  /**
   * Save authentication data securely
   */
  private async saveAuthData(token: string, user: User, account: Account): Promise<void> {
    await Promise.all([
      saveToken(token),
      saveUser(user),
      saveAccount(account)
    ]);
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      return await realApiService.healthCheck();
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();