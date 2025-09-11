import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import { 
  HiEventsAuthClient, 
  HiEventsUser, 
  HiEventsAccount, 
  HiEventsError 
} from "./hiEventsAuthClient";
import { 
  hasLegacyGatewayTokens, 
  clearLegacyGatewayData,
  clearAllHiEventsData 
} from "./token";

interface HiEventsAuthContextType {
  user: HiEventsUser | null;
  currentAccount: HiEventsAccount | null;
  accounts: HiEventsAccount[];
  isLoading: boolean;
  isAuthenticated: boolean;
  accountSelectionRequired: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string, accountId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Account management
  switchAccount: (accountId: string) => Promise<void>;
  
  // Migration utilities
  migrateLegacyAuth: () => Promise<boolean>;
}

const HiEventsAuthContext = createContext<HiEventsAuthContextType | null>(null);

export function HiEventsAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<HiEventsUser | null>(null);
  const [currentAccount, setCurrentAccount] = useState<HiEventsAccount | null>(null);
  const [accounts, setAccounts] = useState<HiEventsAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountSelectionRequired, setAccountSelectionRequired] = useState(false);

  const authClient = HiEventsAuthClient.getInstance();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for existing Hi.Events authentication
      await checkAuthState();
      
      // Check for legacy Gateway tokens and offer migration
      const hasLegacyTokens = await hasLegacyGatewayTokens();
      if (hasLegacyTokens && !user) {
        console.log('Legacy Gateway tokens found. Migration may be needed.');
        // Could trigger a migration flow here
      }
      
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthState = async () => {
    try {
      const isValid = await authClient.isTokenValid();
      
      if (isValid) {
        // Token is valid, get user profile and accounts
        const { user, accounts, currentAccount } = await authClient.getMe();
        setUser(user);
        setAccounts(accounts);
        setCurrentAccount(currentAccount || null);
        
        // Check if account selection is needed
        if (accounts.length > 1 && !currentAccount) {
          setAccountSelectionRequired(true);
        }
      } else {
        // Try to refresh the token
        try {
          await authClient.refreshToken();
          const { user, accounts, currentAccount } = await authClient.getMe();
          setUser(user);
          setAccounts(accounts);
          setCurrentAccount(currentAccount || null);
        } catch (refreshError) {
          // Refresh failed, user needs to log in again
          console.log("Token refresh failed, user needs to log in again");
          await clearAuthState();
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      await clearAuthState();
    }
  };

  const clearAuthState = async () => {
    await clearAllHiEventsData();
    setUser(null);
    setCurrentAccount(null);
    setAccounts([]);
    setAccountSelectionRequired(false);
  };

  const signIn = async (email: string, password: string, accountId?: string) => {
    try {
      setIsLoading(true);
      
      const { user, accounts, currentAccount } = await authClient.login({
        email,
        password,
        accountId,
      });

      setUser(user);
      setAccounts(accounts);
      
      // Handle account selection
      if (accounts.length > 1 && !currentAccount && !accountId) {
        setAccountSelectionRequired(true);
        setCurrentAccount(null);
      } else {
        setCurrentAccount(currentAccount || accounts[0]);
        setAccountSelectionRequired(false);
      }
      
      console.log('Hi.Events sign in successful for:', email);
    } catch (error) {
      console.error('Hi.Events sign in failed:', error);
      
      if (error instanceof HiEventsError) {
        throw new Error(error.message);
      } else {
        throw new Error('Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      await authClient.logout();
      await clearAuthState();
      
      console.log('Hi.Events sign out successful');
    } catch (error) {
      console.error('Hi.Events sign out error:', error);
      // Clear local state even if logout API call fails
      await clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { user, accounts, currentAccount } = await authClient.getMe();
      setUser(user);
      setAccounts(accounts);
      setCurrentAccount(currentAccount || null);
    } catch (error) {
      console.error('Refresh user failed:', error);
      throw error;
    }
  };

  const switchAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      
      const account = await authClient.switchAccount(accountId);
      setCurrentAccount(account);
      setAccountSelectionRequired(false);
      
      console.log('Account switched successfully:', accountId);
    } catch (error) {
      console.error('Account switch failed:', error);
      
      if (error instanceof HiEventsError) {
        throw new Error(error.message);
      } else {
        throw new Error('Account switch failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
    <HiEventsAuthContext.Provider 
      value={{ 
        user, 
        currentAccount,
        accounts,
        isLoading, 
        isAuthenticated: !!user,
        accountSelectionRequired,
        signIn, 
        signOut, 
        refreshUser,
        switchAccount,
        migrateLegacyAuth,
      }}
    >
      {children}
    </HiEventsAuthContext.Provider>
  );
}

export function useHiEventsAuth() {
  const context = useContext(HiEventsAuthContext);
  if (!context) {
    throw new Error("useHiEventsAuth must be used within a HiEventsAuthProvider");
  }
  return context;
}

// Export types for use in other components
export type { HiEventsAuthContextType, HiEventsUser, HiEventsAccount };