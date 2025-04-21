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

  // Fetch data from Supabase
  const fetchAccessTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('access_tokens')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const tokens: User[] = data.map(token => ({
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
      const { data, error } = await supabase
        .from('google_auth')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const configs: GoogleAuthConfig[] = data.map(config => ({
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
      const newToken = {
        token: token,
        blocked: false,
        description: `Token created on ${new Date().toLocaleDateString()}`,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const { data, error } = await supabase
        .from('access_tokens')
        .insert(newToken)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedToken: User = {
          id: data.id,
          accessToken: data.token,
          isBlocked: data.blocked || false
        };
        
        setAccessTokens(prev => [...prev, formattedToken]);
        toast({
          title: "Success",
          description: "Access token added successfully",
        });
      }
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
      const { error } = await supabase
        .from('access_tokens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('access_tokens')
        .update({ blocked })
        .eq('id', id);
      
      if (error) throw error;
      
      setAccessTokens(prev => 
        prev.map(token => 
          token.id === id ? { ...token, isBlocked: blocked } : token
        )
      );
      toast({
        title: "Success",
        description: `Access token ${blocked ? 'blocked' : 'unblocked'} successfully`,
      });
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
      const { error: apiError } = await supabase.functions.invoke('add-google-config', {
        body: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          description: config.projectId,
          active: true
        }
      });
      
      if (apiError) throw apiError;
      
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
      
      const { error: apiError } = await supabase.functions.invoke('update-google-config', {
        body: {
          id: id,
          updates: updates
        }
      });
      
      if (apiError) throw apiError;
      
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
      const { error: apiError } = await supabase.functions.invoke('delete-google-config', {
        body: {
          id: id
        }
      });
      
      if (apiError) throw apiError;
      
      setGoogleConfigs(prev => prev.filter(config => config.id !== id));
      toast({
        title: "Success",
        description: "Google authentication configuration deleted successfully",
      });
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
