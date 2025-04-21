
import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContextType, User, GoogleAuthConfig, Email, Admin } from "@/types";
import { v4 as uuidv4 } from "@/utils/uuid";

import { mockAccessTokens, mockGoogleConfigs, mockEmails } from "@/mockData";

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access Tokens
  const [accessTokens, setAccessTokens] = useState<User[]>(mockAccessTokens);
  
  // Google Auth Configs
  const [googleConfigs, setGoogleConfigs] = useState<GoogleAuthConfig[]>(mockGoogleConfigs);
  
  // Emails
  const [emails, setEmails] = useState<Email[]>(mockEmails);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem("accessTokens");
    if (storedTokens) {
      setAccessTokens(JSON.parse(storedTokens));
    }

    const storedConfigs = localStorage.getItem("googleConfigs");
    if (storedConfigs) {
      setGoogleConfigs(JSON.parse(storedConfigs));
    }

    const storedEmails = localStorage.getItem("emails");
    if (storedEmails) {
      setEmails(JSON.parse(storedEmails));
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("accessTokens", JSON.stringify(accessTokens));
  }, [accessTokens]);

  useEffect(() => {
    localStorage.setItem("googleConfigs", JSON.stringify(googleConfigs));
  }, [googleConfigs]);

  useEffect(() => {
    localStorage.setItem("emails", JSON.stringify(emails));
  }, [emails]);

  // Access Token operations
  const addAccessToken = (token: string) => {
    const newToken: User = {
      id: uuidv4(),
      accessToken: token,
      isBlocked: false
    };
    setAccessTokens(prev => [...prev, newToken]);
  };

  const deleteAccessToken = (id: string) => {
    setAccessTokens(prev => prev.filter(token => token.id !== id));
  };

  const blockAccessToken = (id: string, blocked: boolean) => {
    setAccessTokens(prev => 
      prev.map(token => 
        token.id === id ? { ...token, isBlocked: blocked } : token
      )
    );
  };

  // Google Config operations
  const addGoogleConfig = (config: Omit<GoogleAuthConfig, "id" | "isActive">) => {
    const newConfig: GoogleAuthConfig = {
      ...config,
      id: uuidv4(),
      isActive: true
    };
    setGoogleConfigs(prev => [...prev, newConfig]);
  };

  const updateGoogleConfig = (id: string, config: Partial<GoogleAuthConfig>) => {
    setGoogleConfigs(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...config } : item
      )
    );
  };

  const deleteGoogleConfig = (id: string) => {
    setGoogleConfigs(prev => prev.filter(config => config.id !== id));
  };

  // Email operations
  const fetchEmails = async (emailId: string): Promise<Email[]> => {
    // In a real app, this would make an API call to Gmail using the OAuth credentials
    // For now, we'll simulate filtering emails from the sample data
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter emails where from contains the given email
    const filtered = mockEmails.filter(email => 
      email.from.toLowerCase().includes(emailId.toLowerCase())
    );
    
    // Sort by date (newest first)
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setEmails(sorted);
    return sorted;
  };

  const toggleEmailVisibility = (id: string) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === id ? { ...email, isHidden: !email.isHidden } : email
      )
    );
  };

  // Admin credentials update
  const updateAdminCredentials = (username: string, password: string) => {
    const updatedAdmin: Admin = { username, password };
    localStorage.setItem("adminCredentials", JSON.stringify(updatedAdmin));
  };

  return (
    <DataContext.Provider value={{
      accessTokens,
      googleConfigs,
      emails,
      fetchEmails,
      addAccessToken,
      deleteAccessToken,
      blockAccessToken,
      addGoogleConfig,
      updateGoogleConfig,
      deleteGoogleConfig,
      toggleEmailVisibility,
      updateAdminCredentials
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
