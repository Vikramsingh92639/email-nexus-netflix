
import React, { createContext, useContext, useState, useEffect } from "react";
import { DataContextType, User, GoogleAuthConfig, Email, Admin } from "@/types";
import { v4 as uuidv4 } from "@/utils/uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access Tokens
  const [accessTokens, setAccessTokens] = useState<User[]>([]);
  
  // Google Auth Configs
  const [googleConfigs, setGoogleConfigs] = useState<GoogleAuthConfig[]>([]);
  
  // Emails
  const [emails, setEmails] = useState<Email[]>([]);

  // Load data from Supabase on mount
  useEffect(() => {
    fetchAccessTokens();
    fetchGoogleConfigs();
    fetchEmails();
  }, []);

  // Fetch data using Edge Functions
  const fetchAccessTokens = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-access-tokens');
      
      if (error) throw error;
      
      if (data && data.success && data.data) {
        const tokens: User[] = data.data.map((token: any) => ({
          id: token.id,
          accessToken: token.token,
          isBlocked: token.blocked || false
        }));
        setAccessTokens(tokens);
      }
    } catch (error) {
      console.error('Error fetching access tokens:', error);
    }
  };

  const fetchGoogleConfigs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-configs');
      
      if (error) throw error;
      
      if (data && data.success && data.data) {
        const configs: GoogleAuthConfig[] = data.data.map((config: any) => ({
          id: config.id,
          clientId: config.client_id,
          clientSecret: config.client_secret,
          projectId: config.description,
          authUri: "https://accounts.google.com/o/oauth2/auth",
          tokenUri: "https://oauth2.googleapis.com/token",
          authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs",
          isActive: config.active || false
        }));
        setGoogleConfigs(configs);
      }
    } catch (error) {
      console.error('Error fetching Google configs:', error);
    }
  };

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const emailList: Email[] = data.map(email => ({
          id: email.id,
          from: email.from_address,
          to: email.to_address,
          subject: email.subject,
          body: email.snippet,
          date: email.date,
          isRead: email.read || false,
          isHidden: email.hidden || false
        }));
        setEmails(emailList);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  // Access Token operations
  const addAccessToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('add-access-token', {
        body: {
          token: token,
          description: `Token created on ${new Date().toLocaleDateString()}`,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      if (data.success && data.data) {
        const formattedToken: User = {
          id: data.data.id,
          accessToken: data.data.token,
          isBlocked: data.data.blocked || false
        };
        
        setAccessTokens(prev => [...prev, formattedToken]);
        toast({
          title: "Success",
          description: "Access token added successfully",
        });
      }
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error adding access token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add access token",
        variant: "destructive"
      });
    }
  };

  const deleteAccessToken = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-access-token', {
        body: { id }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      setAccessTokens(prev => prev.filter(token => token.id !== id));
      toast({
        title: "Success",
        description: "Access token deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting access token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete access token",
        variant: "destructive"
      });
    }
  };

  const blockAccessToken = async (id: string, blocked: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-access-token', {
        body: { id, blocked }
      });
      
      if (error) throw error;
      
      if (data.error) throw new Error(data.error);
      
      setAccessTokens(prev => 
        prev.map(token => 
          token.id === id ? { ...token, isBlocked: blocked } : token
        )
      );
      toast({
        title: "Success",
        description: `Access token ${blocked ? 'blocked' : 'unblocked'} successfully`,
      });
      
      // Refresh the tokens list to ensure we have the latest data
      await fetchAccessTokens();
      
    } catch (error: any) {
      console.error('Error blocking access token:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${blocked ? 'block' : 'unblock'} access token`,
        variant: "destructive"
      });
    }
  };

  // Google Config operations
  const addGoogleConfig = async (config: Omit<GoogleAuthConfig, "id" | "isActive">) => {
    try {
      const { error: apiError, data } = await supabase.functions.invoke('add-google-config', {
        body: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          description: config.projectId,
          active: true
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
      toast({
        title: "Success",
        description: "Google authentication configuration added successfully",
      });
    } catch (error: any) {
      console.error('Error adding Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  const updateGoogleConfig = async (id: string, config: Partial<GoogleAuthConfig>) => {
    try {
      const updates: any = {};
      
      if (config.clientId !== undefined) updates.client_id = config.clientId;
      if (config.clientSecret !== undefined) updates.client_secret = config.clientSecret;
      if (config.projectId !== undefined) updates.description = config.projectId;
      if (config.isActive !== undefined) updates.active = config.isActive;
      
      const { error: apiError, data } = await supabase.functions.invoke('update-google-config', {
        body: {
          id: id,
          updates: updates
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
      toast({
        title: "Success",
        description: "Google authentication configuration updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  const deleteGoogleConfig = async (id: string) => {
    try {
      const { error: apiError, data } = await supabase.functions.invoke('delete-google-config', {
        body: {
          id: id
        }
      });
      
      if (apiError) throw apiError;
      
      if (data && data.error) throw new Error(data.error);
      
      setGoogleConfigs(prev => prev.filter(config => config.id !== id));
      toast({
        title: "Success",
        description: "Google authentication configuration deleted successfully",
      });
      
      // Refresh Google configs to ensure we have the latest data
      await fetchGoogleConfigs();
      
    } catch (error: any) {
      console.error('Error deleting Google config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete Google authentication configuration",
        variant: "destructive"
      });
    }
  };

  // Email operations
  const searchEmails = async (emailId: string): Promise<Email[]> => {
    try {
      setEmails([]);
      const { data, error } = await supabase.functions.invoke('search-emails', {
        body: { searchEmail: emailId }
      });

      if (error) throw new Error(error.message);
      
      if (data.error) throw new Error(data.error);
      
      if (data.emails && Array.isArray(data.emails)) {
        const formattedEmails: Email[] = data.emails.map((email: any) => ({
          id: email.id,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body,
          date: email.date,
          isRead: email.isRead,
          isHidden: false
        }));
        
        setEmails(formattedEmails);
        return formattedEmails;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error searching emails:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search emails",
        variant: "destructive"
      });
      return [];
    }
  };

  const toggleEmailVisibility = async (id: string) => {
    try {
      const email = emails.find(e => e.id === id);
      if (!email) return;
      
      const newHiddenState = !email.isHidden;
      
      const { error } = await supabase
        .from('emails')
        .update({ hidden: newHiddenState })
        .eq('id', id);
      
      if (error) throw error;
      
      setEmails(prev => 
        prev.map(email => 
          email.id === id ? { ...email, isHidden: newHiddenState } : email
        )
      );
    } catch (error: any) {
      console.error('Error toggling email visibility:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email visibility",
        variant: "destructive"
      });
    }
  };

  const updateAdminCredentials = (username: string, password: string) => {
    const updatedAdmin: Admin = { username, password };
    localStorage.setItem("adminCredentials", JSON.stringify(updatedAdmin));
    toast({
      title: "Success",
      description: "Admin credentials updated successfully",
    });
  };

  return (
    <DataContext.Provider value={{
      accessTokens,
      googleConfigs,
      emails,
      fetchEmails: searchEmails,
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
