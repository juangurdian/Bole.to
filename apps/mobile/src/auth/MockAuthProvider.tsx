import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  city?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    setTimeout(() => {
      // Auto-login for development
      if (process.env.NODE_ENV === "development") {
        setUser({
          id: "mock-user-1",
          name: "Test User",
          email: "test@example.com",
          city: "Managua",
        });
      }
      setIsLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: "mock-user-1",
      name: "Test User",
      email: email,
      city: "Managua",
    });
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: "mock-user-new",
      name: name,
      email: email,
      city: "Managua",
    });
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return context;
}

// Export as useAuth as well for compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within MockAuthProvider");
  }
  return context;
}