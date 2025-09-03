import React, { createContext, useContext, useState, useEffect } from "react";
import { GatewayAuthService } from "./gateway-auth-service";
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser } from "./token";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profile?: {
    avatar?: string;
    bio?: string;
  };
  socialAccounts?: Array<{
    provider: string;
    linkedAt: string;
  }>;
}

interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  osVersion: string;
}

interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  authenticateWithOAuth: (provider: string, idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const gatewayAuth = GatewayAuthService.getInstance();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Verify token is still valid by fetching user profile
        const userData = await gatewayAuth.getProfile();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // Clear invalid tokens
      await removeToken();
      await removeUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser, tokens } = await gatewayAuth.login({
        email,
        password,
        rememberMe
      });
      
      await saveToken(tokens.accessToken);
      await saveUser(loggedInUser);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (allDevices: boolean = false) => {
    try {
      setIsLoading(true);
      await gatewayAuth.logout(allDevices);
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if server request fails
    } finally {
      await removeToken();
      await removeUser();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await gatewayAuth.getProfile();
      await saveUser(userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const authenticateWithOAuth = async (provider: string, idToken: string) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser, tokens } = await gatewayAuth.authenticateWithOAuth(
        provider as 'google' | 'apple',
        idToken
      );
      
      await saveToken(tokens.accessToken);
      await saveUser(loggedInUser);
      setUser(loggedInUser);
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      logout, 
      refreshUser,
      authenticateWithOAuth
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