
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, User, Admin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("adminCredentials");
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(false);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
      }
    }
    
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setAdmin(adminData);
        setIsAuthenticated(true);
        setIsAdmin(true);
      } catch (err) {
        console.error("Error parsing stored admin:", err);
        localStorage.removeItem("adminCredentials");
      }
    }
  }, []);

  // User login
  const login = async (accessToken: string): Promise<boolean> => {
    try {
      // Validate token with Supabase
      const { data, error } = await supabase.functions.invoke('fetch-access-tokens');
      
      if (error) {
        toast({
          title: "Login Error",
          description: error.message || "Failed to fetch tokens",
          variant: "destructive"
        });
        return false;
      }
      
      if (!data || !data.data) {
        toast({
          title: "Login Error",
          description: "No access tokens found",
          variant: "destructive"
        });
        return false;
      }
      
      // Check if token exists and is not blocked
      const foundToken = data.data.find((token: any) => token.token === accessToken);
      
      if (!foundToken) {
        toast({
          title: "Invalid Token",
          description: "The access token does not exist.",
          variant: "destructive"
        });
        return false;
      }
      
      if (foundToken.blocked) {
        toast({
          title: "Blocked Token",
          description: "This access token has been blocked by an administrator.",
          variant: "destructive"
        });
        return false;
      }
      
      // Token is valid, create user object
      const userData: User = {
        id: foundToken.id,
        accessToken: foundToken.token,
        isBlocked: foundToken.blocked
      };
      
      // Store user data
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      toast({
        title: "Login Successful",
        description: "You have successfully logged in as a user.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Admin login
  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      // Default admin credentials if none are set
      const defaultAdmin = { username: "admin", password: "password" };
      
      // Try to get admin credentials from local storage
      const storedAdmin = localStorage.getItem("adminCredentials");
      let adminCredentials = defaultAdmin;
      
      if (storedAdmin) {
        try {
          adminCredentials = JSON.parse(storedAdmin);
        } catch (err) {
          console.error("Error parsing admin credentials:", err);
          // If there's an error parsing, use the default
        }
      } else {
        // Set default admin credentials if none exist
        localStorage.setItem("adminCredentials", JSON.stringify(defaultAdmin));
      }
      
      // Check credentials
      if (username === adminCredentials.username && password === adminCredentials.password) {
        // Store admin state
        setAdmin(adminCredentials);
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        toast({
          title: "Login Successful",
          description: "You have successfully logged in as an administrator.",
        });
        
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid admin credentials.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Logout
  const logout = () => {
    // Clear stored data
    if (isAdmin) {
      localStorage.removeItem("adminCredentials");
      setAdmin(null);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
    
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      user,
      admin,
      login,
      adminLogin,
      logout
    }}>
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
