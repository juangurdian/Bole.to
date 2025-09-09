import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import { GatewayAuthService, User as GatewayUser, GatewayError } from "./gateway-auth-service";
import { deepLinkHandler, initializeDeepLinking, cleanupDeepLinking } from "./deep-link-handler";
import { googleProvider, appleProvider, getAvailableProviders } from "./oauth-providers";

interface AuthContextType {
  user: GatewayUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  availableOAuthProviders: string[];
  accountSelectionRequired: boolean;
  availableAccounts: any[];
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // OAuth methods
  authenticateWithGoogle: () => Promise<void>;
  authenticateWithApple: () => Promise<void>;
  authenticateWithOAuth: (provider: string, idToken: string) => Promise<void>;
  
  // Account selection
  selectAccount: (accountId: string) => Promise<void>;
  
  // Session management
  getSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GatewayUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOAuthProviders, setAvailableOAuthProviders] = useState<string[]>([]);
  const [accountSelectionRequired, setAccountSelectionRequired] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);

  const gatewayAuth = GatewayAuthService.getInstance();

  useEffect(() => {
    initializeAuth();
    return cleanupAuth;
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize deep linking
      initializeDeepLinking();
      
      // Set up deep link handlers
      setupDeepLinkHandlers();
      
      // Check for existing authentication
      await checkAuthState();
      
      // Get available OAuth providers
      await loadAvailableProviders();
      
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupAuth = () => {
    cleanupDeepLinking();
  };

  const setupDeepLinkHandlers = () => {

    deepLinkHandler.setAccountSelectionCallback((accounts: any[]) => {
      setAccountSelectionRequired(true);
      setAvailableAccounts(accounts);
    });
  };

  const checkAuthState = async () => {
    try {
      const isValid = await gatewayAuth.isTokenValid();
      
      if (isValid) {
        // Token is valid, get user profile
        const profile = await gatewayAuth.getProfile();
        setUser(profile);
      } else {
        // Try to refresh the token
        try {
          await gatewayAuth.refreshToken();
          const profile = await gatewayAuth.getProfile();
          setUser(profile);
        } catch (refreshError) {
          // Refresh failed, user needs to log in again
          console.log("Token refresh failed, user needs to log in again");
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      setUser(null);
    }
  };

  const loadAvailableProviders = async () => {
    try {
      const providers = await getAvailableProviders();
      setAvailableOAuthProviders(providers.map(p => p.name));
    } catch (error) {
      console.warn("Failed to load OAuth providers:", error);
      setAvailableOAuthProviders([]);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      
      const result = await gatewayAuth.login({
        email,
        password,
        rememberMe,
      });

      setUser(result.user);
      
      console.log('Gateway login successful for:', email);
    } catch (error) {
      console.error('Gateway login failed:', error);
      
      if (error instanceof GatewayError) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (allDevices: boolean = false) => {
    try {
      setIsLoading(true);
      
      await gatewayAuth.logout(allDevices);
      setUser(null);
      setAccountSelectionRequired(false);
      setAvailableAccounts([]);
      
      console.log('Gateway logout successful');
    } catch (error) {
      console.error('Gateway logout error:', error);
      // Clear local state even if logout API call fails
      setUser(null);
      setAccountSelectionRequired(false);
      setAvailableAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await gatewayAuth.getProfile();
      setUser(updatedUser);
    } catch (error) {
      console.error('Refresh user failed:', error);
      throw error;
    }
  };

  const authenticateWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      if (!availableOAuthProviders.includes('google')) {
        throw new Error('Google Sign-In is not available on this device');
      }

      // Get ID token from Google
      const idToken = await googleProvider.startOAuth();
      
      // Authenticate with Gateway using the ID token
      const result = await gatewayAuth.authenticateWithOAuth('google', idToken);
      
      // Check if account selection is required
      if (result.linkedProvider === 'multiple') {
        setAccountSelectionRequired(true);
        setAvailableAccounts(result.user?.socialAccounts || []);
      } else {
        setUser(result.user);
        setAccountSelectionRequired(false);
        setAvailableAccounts([]);
        
        if (result.isNewUser) {
          Alert.alert(
            "Welcome!",
            "Your account has been created with Google Sign-In.",
            [{ text: "OK" }]
          );
        }
      }
      
      console.log('Google OAuth login successful');
    } catch (error) {
      console.error('Google OAuth authentication failed:', error);
      
      if (error instanceof GatewayError) {
        if (error.code === 'OAUTH_CANCELLED') {
          // User cancelled, don't show error
          return;
        }
        throw new Error(error.message);
      } else {
        throw new Error('Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithApple = async () => {
    try {
      setIsLoading(true);
      
      if (!availableOAuthProviders.includes('apple')) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Get ID token from Apple
      const idToken = await appleProvider.startOAuth();
      
      // Authenticate with Gateway using the ID token
      const result = await gatewayAuth.authenticateWithOAuth('apple', idToken);
      
      // Check if account selection is required
      if (result.linkedProvider === 'multiple') {
        setAccountSelectionRequired(true);
        setAvailableAccounts(result.user?.socialAccounts || []);
      } else {
        setUser(result.user);
        setAccountSelectionRequired(false);
        setAvailableAccounts([]);
        
        if (result.isNewUser) {
          Alert.alert(
            "Welcome!",
            "Your account has been created with Apple Sign-In.",
            [{ text: "OK" }]
          );
        }
      }
      
      console.log('Apple OAuth login successful');
    } catch (error) {
      console.error('Apple OAuth authentication failed:', error);
      
      if (error instanceof GatewayError) {
        if (error.code === 'OAUTH_CANCELLED') {
          // User cancelled, don't show error
          return;
        }
        throw new Error(error.message);
      } else {
        throw new Error('Apple Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithOAuth = async (provider: string, idToken: string) => {
    // This method is kept for compatibility with existing interfaces
    // In practice, the specific provider methods (authenticateWithGoogle, authenticateWithApple) are preferred
    try {
      setIsLoading(true);
      
      const result = await gatewayAuth.authenticateWithOAuth(
        provider as 'google' | 'apple', 
        idToken
      );
      
      setUser(result.user);
      
      console.log(`OAuth login successful for ${provider}`);
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      
      // This would typically involve calling a Gateway endpoint for account selection
      // For now, we'll simulate by selecting from available accounts
      const selectedAccount = availableAccounts.find(acc => acc.id === accountId);
      
      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }

      // Complete the authentication with the selected account
      // This would be implemented based on the Gateway's account selection flow
      
      setAccountSelectionRequired(false);
      setAvailableAccounts([]);
      
      console.log('Account selection completed:', accountId);
    } catch (error) {
      console.error('Account selection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSessions = async (): Promise<any[]> => {
    try {
      return await gatewayAuth.getSessions();
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await gatewayAuth.revokeSession(sessionId);
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    }
  };

  const revokeAllSessions = async () => {
    try {
      await gatewayAuth.revokeAllSessions();
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      availableOAuthProviders,
      accountSelectionRequired,
      availableAccounts,
      login, 
      logout, 
      refreshUser,
      authenticateWithGoogle,
      authenticateWithApple,
      authenticateWithOAuth,
      selectAccount,
      getSessions,
      revokeSession,
      revokeAllSessions,
    }}>
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

export type { AuthContextType, GatewayUser as User };