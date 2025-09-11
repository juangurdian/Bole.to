import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import { GatewayAuthService, User as GatewayUser, GatewayError } from "./gateway-auth-service";
import { 
  HiEventsAuthClient, 
  HiEventsUser, 
  HiEventsAccount, 
  HiEventsError 
} from "./hiEventsAuthClient";
import { deepLinkHandler, initializeDeepLinking, cleanupDeepLinking } from "./deep-link-handler";
import { googleProvider, appleProvider, getAvailableProviders } from "./oauth-providers";
import { hasLegacyGatewayTokens, clearLegacyGatewayData } from "./token";

// Unified user type that can handle both Gateway and Hi.Events users
interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  profile?: {
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    location?: string;
    preferences?: {
      notifications: boolean;
      marketing: boolean;
      language: string;
      timezone: string;
    };
  };
  socialAccounts?: Array<{
    provider: string;
    linkedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Hi.Events specific fields
  timezone?: string;
  avatar_url?: string;
  phone?: string;
  // Current account info for Hi.Events
  currentAccount?: HiEventsAccount;
  accounts?: HiEventsAccount[];
}

interface AuthContextType {
  user: UnifiedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  availableOAuthProviders: string[];
  accountSelectionRequired: boolean;
  availableAccounts: any[];
  isUsingHiEvents: boolean;
  
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
  
  // Hi.Events specific methods
  switchAccount?: (accountId: string) => Promise<void>;
  migrateLegacyAuth?: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper functions to map between user types
function mapHiEventsUserToUnified(
  user: HiEventsUser, 
  accounts: HiEventsAccount[], 
  currentAccount?: HiEventsAccount
): UnifiedUser {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    emailVerified: !!user.email_verified_at,
    phoneVerified: !!user.phone_verified_at,
    timezone: user.timezone,
    avatar_url: user.avatar_url,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    currentAccount,
    accounts,
    profile: {
      avatar: user.avatar_url,
      preferences: {
        notifications: true,
        marketing: true,
        language: 'en',
        timezone: user.timezone || 'UTC',
      },
    },
  };
}

function mapGatewayUserToUnified(user: GatewayUser): UnifiedUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    profile: user.profile,
    socialAccounts: user.socialAccounts,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOAuthProviders, setAvailableOAuthProviders] = useState<string[]>([]);
  const [accountSelectionRequired, setAccountSelectionRequired] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  
  // Determine which auth system to use
  const isUsingHiEvents = process.env.EXPO_PUBLIC_USE_HIEVENTS_AUTH === 'true';
  
  const gatewayAuth = GatewayAuthService.getInstance();
  const hiEventsAuth = HiEventsAuthClient.getInstance();

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

  const cleanupAuth = async () => {
    cleanupDeepLinking();
    
    // Cleanup network manager
    networkManager.off('online');
    networkManager.off('offline');
    networkManager.off('connectionChanged');
    
    // Cleanup token manager if using Hi.Events
    if (isUsingHiEvents && tokenManager) {
      await tokenManager.performFullCleanup();
    }
  };

  const setupDeepLinkHandlers = () => {

    deepLinkHandler.setAccountSelectionCallback((accounts: any[]) => {
      setAccountSelectionRequired(true);
      setAvailableAccounts(accounts);
    });
  };

  const checkAuthState = async () => {
    try {
      if (isUsingHiEvents) {
        // Hi.Events authentication
        const isValid = await hiEventsAuth.isTokenValid();
        
        if (isValid) {
          // Token is valid, get user profile
          const { user, accounts, currentAccount } = await hiEventsAuth.getMe();
          setUser(mapHiEventsUserToUnified(user, accounts, currentAccount));
          
          // Handle account selection
          if (accounts.length > 1 && !currentAccount) {
            setAccountSelectionRequired(true);
            setAvailableAccounts(accounts);
          }
        } else {
          // Try to refresh the token
          try {
            await hiEventsAuth.refreshToken();
            const { user, accounts, currentAccount } = await hiEventsAuth.getMe();
            setUser(mapHiEventsUserToUnified(user, accounts, currentAccount));
          } catch (refreshError) {
            // Refresh failed, user needs to log in again
            console.log("Hi.Events token refresh failed, user needs to log in again");
            setUser(null);
          }
        }
      } else {
        // Legacy Gateway authentication
        const isValid = await gatewayAuth.isTokenValid();
        
        if (isValid) {
          // Token is valid, get user profile
          const profile = await gatewayAuth.getProfile();
          setUser(mapGatewayUserToUnified(profile));
        } else {
          // Try to refresh the token
          try {
            await gatewayAuth.refreshToken();
            const profile = await gatewayAuth.getProfile();
            setUser(mapGatewayUserToUnified(profile));
          } catch (refreshError) {
            // Refresh failed, user needs to log in again
            console.log("Gateway token refresh failed, user needs to log in again");
            setUser(null);
          }
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
      
      if (isUsingHiEvents) {
        // Hi.Events login
        const { user, accounts, currentAccount } = await hiEventsAuth.login({
          email,
          password,
          rememberMe,
        });

        setUser(mapHiEventsUserToUnified(user, accounts, currentAccount));
        
        // Handle account selection
        if (accounts.length > 1 && !currentAccount) {
          setAccountSelectionRequired(true);
          setAvailableAccounts(accounts);
        }
        
        console.log('Hi.Events login successful for:', email);
      } else {
        // Legacy Gateway login
        const result = await gatewayAuth.login({
          email,
          password,
          rememberMe,
        });

        setUser(mapGatewayUserToUnified(result.user));
        
        console.log('Gateway login successful for:', email);
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      if (error instanceof HiEventsError || error instanceof GatewayError) {
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
      
      if (isUsingHiEvents) {
        await hiEventsAuth.logout();
        console.log('Hi.Events logout successful');
      } else {
        await gatewayAuth.logout(allDevices);
        console.log('Gateway logout successful');
      }
      
      setUser(null);
      setAccountSelectionRequired(false);
      setAvailableAccounts([]);
    } catch (error) {
      console.error('Logout error:', error);
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
      if (isUsingHiEvents) {
        const { user, accounts, currentAccount } = await hiEventsAuth.getMe();
        setUser(mapHiEventsUserToUnified(user, accounts, currentAccount));
      } else {
        const updatedUser = await gatewayAuth.getProfile();
        setUser(mapGatewayUserToUnified(updatedUser));
      }
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
      
      if (isUsingHiEvents) {
        // Hi.Events account selection
        const account = await hiEventsAuth.switchAccount(accountId);
        
        // Update the current user with the new account
        if (user) {
          setUser({
            ...user,
            currentAccount: account,
          });
        }
        
        setAccountSelectionRequired(false);
        setAvailableAccounts([]);
        
        console.log('Hi.Events account selection completed:', accountId);
      } else {
        // Legacy Gateway account selection
        const selectedAccount = availableAccounts.find(acc => acc.id === accountId);
        
        if (!selectedAccount) {
          throw new Error('Selected account not found');
        }

        // Complete the authentication with the selected account
        // This would be implemented based on the Gateway's account selection flow
        
        setAccountSelectionRequired(false);
        setAvailableAccounts([]);
        
        console.log('Gateway account selection completed:', accountId);
      }
    } catch (error) {
      console.error('Account selection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSessions = async (): Promise<any[]> => {
    try {
      if (isUsingHiEvents) {
        // Hi.Events doesn't have session management yet
        // Return empty array for now
        return [];
      } else {
        return await gatewayAuth.getSessions();
      }
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      if (isUsingHiEvents) {
        // Hi.Events doesn't have session management yet
        console.warn('Session management not available with Hi.Events');
      } else {
        await gatewayAuth.revokeSession(sessionId);
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      throw error;
    }
  };

  const revokeAllSessions = async () => {
    try {
      if (isUsingHiEvents) {
        // Hi.Events doesn't have session management yet
        console.warn('Session management not available with Hi.Events');
      } else {
        await gatewayAuth.revokeAllSessions();
      }
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      throw error;
    }
  };

  // Hi.Events specific methods
  const switchAccount = async (accountId: string) => {
    if (!isUsingHiEvents) {
      throw new Error('Account switching only available with Hi.Events');
    }
    
    return selectAccount(accountId);
  };

  const migrateLegacyAuth = async (): Promise<boolean> => {
    try {
      const hasLegacyTokens = await hasLegacyGatewayTokens();
      
      if (!hasLegacyTokens) {
        return false; // No migration needed
      }

      // Show migration alert
      return new Promise((resolve) => {
        Alert.alert(
          "Account Migration",
          "We've upgraded our authentication system. Please sign in again to continue using the app.",
          [
            {
              text: "Sign In",
              onPress: async () => {
                await clearLegacyGatewayData();
                await logout(); // Clear current state
                resolve(true);
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
          ]
        );
      });
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
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
      isUsingHiEvents,
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
      switchAccount: isUsingHiEvents ? switchAccount : undefined,
      migrateLegacyAuth: isUsingHiEvents ? migrateLegacyAuth : undefined,
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