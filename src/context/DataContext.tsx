
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
        description: `Token created on ${new Date().toLocaleDateString()}`, // Added the required description field
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days expiry
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
      const newConfig = {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        description: config.projectId,
        active: true
      };
      
      // First, deactivate all existing configs
      if (newConfig.active) {
        const { error: updateError } = await supabase
          .from('google_auth')
          .update({ active: false })
          .eq('active', true);
          
        if (updateError) throw updateError;
      }
      
      // Then insert the new config
      const { data, error } = await supabase
        .from('google_auth')
        .insert(newConfig)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedConfig: GoogleAuthConfig = {
          id: data.id,
          clientId: data.client_id,
          clientSecret: data.client_secret,
          projectId: data.description,
          authUri: "https://accounts.google.com/o/oauth2/auth",
          tokenUri: "https://oauth2.googleapis.com/token",
          authProviderCertUrl: "https://www.googleapis.com/oauth2/v1/certs",
          isActive: data.active || false
        };
        
        setGoogleConfigs(prev => [...prev, formattedConfig]);
        toast({
          title: "Success",
          description: "Google authentication configuration added successfully",
        });
      }
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
      
      // If activating this config, deactivate all others
      if (updates.active) {
        const { error: updateError } = await supabase
          .from('google_auth')
          .update({ active: false })
          .neq('id', id);
          
        if (updateError) throw updateError;
      }
      
      const { error } = await supabase
        .from('google_auth')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setGoogleConfigs(prev => 
        prev.map(item => {
          if (item.id === id) {
            const updated = { ...item };
            if (config.clientId !== undefined) updated.clientId = config.clientId;
            if (config.clientSecret !== undefined) updated.clientSecret = config.clientSecret;
            if (config.projectId !== undefined) updated.projectId = config.projectId;
            if (config.isActive !== undefined) {
              updated.isActive = config.isActive;
              // If this config is active, deactivate all others in the local state
              if (config.isActive) {
                setGoogleConfigs(prev =>
                  prev.map(c => c.id !== id ? { ...c, isActive: false } : c)
                );
              }
            }
            return updated;
          }
          return item;
        })
      );
      
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
      const { error } = await supabase
        .from('google_auth')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
        // Transform the API response to match our Email type
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
      // Find the email and get its current hidden state
      const email = emails.find(e => e.id === id);
      if (!email) return;
      
      const newHiddenState = !email.isHidden;
      
      // Update in Supabase
      const { error } = await supabase
        .from('emails')
        .update({ hidden: newHiddenState })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
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

  // Admin credentials update
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
