
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User, Admin } from "@/types";

// Default admin credentials
const DEFAULT_ADMIN = {
  username: "Admin@Akshay",
  password: "Admin@Akshay"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Load stored auth state on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("authState");
    if (storedAuth) {
      const { isAuthenticated, isAdmin, user, admin } = JSON.parse(storedAuth);
      setIsAuthenticated(isAuthenticated);
      setIsAdmin(isAdmin);
      setUser(user);
      setAdmin(admin);
    }
  }, []);

  // Save auth state to localStorage when it changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("authState", JSON.stringify({ isAuthenticated, isAdmin, user, admin }));
    } else {
      localStorage.removeItem("authState");
    }
  }, [isAuthenticated, isAdmin, user, admin]);

  // User login
  const login = async (accessToken: string, isAdminLogin: boolean = false): Promise<boolean> => {
    // For admin login, this function shouldn't be used (use adminLogin instead)
    if (isAdminLogin) return false;

    // In a real app, validate token against stored tokens
    const storedTokens = JSON.parse(localStorage.getItem("accessTokens") || "[]");
    const foundToken = storedTokens.find((t: User) => t.accessToken === accessToken && !t.isBlocked);

    if (foundToken) {
      setUser(foundToken);
      setIsAuthenticated(true);
      setIsAdmin(false);
      return true;
    }
    return false;
  };

  // Admin login
  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    // Check against stored admin credentials, falling back to defaults
    const storedAdmin = JSON.parse(localStorage.getItem("adminCredentials") || JSON.stringify(DEFAULT_ADMIN));
    
    if (username === storedAdmin.username && password === storedAdmin.password) {
      setAdmin(storedAdmin);
      setIsAuthenticated(true);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, admin, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
