import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, AuthUser } from "./authService";
import { Account, LoginResponse } from "../types/models";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Basic auth
  login: (email: string, password: string) => Promise<LoginResponse>;
  selectAccount: (accountId: string) => Promise<void>;
  logout: () => Promise<void>;
  // User management
  refreshUser: () => Promise<void>;
  // Connection status
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Test API connectivity
      const connectionStatus = await authService.testConnection();
      setIsOnline(connectionStatus);
      
      if (!connectionStatus) {
        console.warn('API is not accessible, running in offline mode');
        setIsLoading(false);
        return;
      }

      // Check if user is already authenticated
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const response = await authService.login(email, password);
      
      // If user has single account and token is provided, they're fully logged in
      if (response.accounts.length === 1 && response.token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const selectAccount = async (accountId: string) => {
    try {
      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      await authService.selectAccount(accountId);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Account selection failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (!isAuthenticated || !isOnline) return;
      
      const refreshedUser = await authService.refreshUserData();
      setUser(refreshedUser);
    } catch (error: any) {
      console.error("Error refreshing user data:", error);
      // If refresh fails due to auth error, logout user
      if (error.message?.includes('401') || error.message?.includes('authentication')) {
        await logout();
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    selectAccount,
    logout,
    refreshUser,
    isOnline
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Account selection component for multi-tenant users
export function AccountSelector({ 
  accounts, 
  onSelect, 
  loading 
}: { 
  accounts: Account[], 
  onSelect: (accountId: string) => void, 
  loading?: boolean 
}) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Select Account</h2>
      <p>You have access to multiple accounts. Please choose one to continue:</p>
      {accounts.map(account => (
        <button 
          key={account.id}
          onClick={() => onSelect(account.id)}
          disabled={loading}
          style={{ 
            display: 'block', 
            width: '100%', 
            margin: '10px 0', 
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <strong>{account.name}</strong>
          <br />
          <small>{account.domain}</small>
        </button>
      ))}
    </div>
  );
}