import React, { createContext, useContext, useState, useEffect } from "react";
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser } from "./token";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await getToken();
      const userData = await getUser();
      if (token && userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Mock login - accept any credentials
    const mockUser: User = {
      id: "mock-user-id",
      name: "Mock User",
      email: email,
    };
    
    const mockToken = "mock-token";
    
    await saveToken(mockToken);
    await saveUser(mockUser);
    setUser(mockUser);
  };

  const logout = async () => {
    await removeToken();
    await removeUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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