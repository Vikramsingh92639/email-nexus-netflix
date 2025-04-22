
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchEmail } = await req.json();
    
    if (!searchEmail) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get active Google auth config
    const { data: googleAuthData, error: googleAuthError } = await supabaseAdmin
      .from("google_auth")
      .select("*")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    
    if (googleAuthError) {
      console.error("Google auth error:", googleAuthError);
      return new Response(
        JSON.stringify({ error: "Error fetching Google authentication", details: googleAuthError }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!googleAuthData) {
      console.error("No active Google authentication found");
      return new Response(
        JSON.stringify({ error: "No active Google authentication found. Please add and activate a Google Auth configuration in the Admin panel." }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Enhanced token handling with auto-refresh
    let accessToken = googleAuthData.access_token;
    let needsRefresh = false;
    
    // Check if token is expired or will expire soon (within 5 minutes)
    if (googleAuthData.token_expiry) {
      const expiryTime = new Date(googleAuthData.token_expiry).getTime();
      const currentTime = Date.now();
      const fiveMinutesMs = 5 * 60 * 1000;
      
      if (currentTime + fiveMinutesMs >= expiryTime) {
        needsRefresh = true;
      }
    } else if (!accessToken) {
      needsRefresh = true;
    }
    
    // Refresh token if needed
    if (needsRefresh && googleAuthData.client_id && googleAuthData.client_secret && googleAuthData.refresh_token) {
      try {
        console.log("Refreshing access token automatically");
        
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: googleAuthData.client_id,
            client_secret: googleAuthData.client_secret,
            refresh_token: googleAuthData.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          // Update the access token in the database
          const { error: updateError } = await supabaseAdmin
            .from("google_auth")
            .update({
              access_token: tokenData.access_token,
              token_expiry: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
            })
            .eq("id", googleAuthData.id);
            
          if (updateError) {
            console.error("Error updating access token:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to update access token", details: updateError }),
              { 
                status: 200, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            );
          }
          
          // Use the new access token
          accessToken = tokenData.access_token;
          console.log("Successfully refreshed access token");
        } else {
          console.error("Failed to refresh access token:", tokenData);
          return new Response(
            JSON.stringify({ 
              error: "Failed to refresh access token. Please reauthorize with Google in the Admin panel."
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return new Response(
          JSON.stringify({ 
            error: "Error refreshing token. Please reauthorize with Google in the Admin panel." 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          error: "No access token available. You need to complete the Google OAuth process in the Admin panel." 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Use the access token to fetch emails - search the full inbox for the sender
    // Modified to use search within inbox rather than just from: query
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox from:" + encodeURIComponent(searchEmail), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gmail API error:", errorData);
      
      // Check if token expired
      if (response.status === 401) {
        // Handle 401 by suggesting reauthorization
        return new Response(
          JSON.stringify({ 
            error: "Access token expired. Please try again or reauthorize in the Admin panel."
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch emails from Gmail API: " + (errorData.error?.message || "Unknown error"),
          status: response.status,
          errorDetails: errorData
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const messagesData = await response.json();
    
    if (!messagesData.messages || messagesData.messages.length === 0) {
      return new Response(
        JSON.stringify({ emails: [], message: "No emails found from this sender" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Fetch details for each message
    const emailPromises = messagesData.messages.slice(0, 20).map(async (message) => {
      try {
        const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (!msgResponse.ok) {
          console.error(`Failed to fetch email ${message.id}: ${msgResponse.status}`);
          return null;
        }
        
        return msgResponse.json();
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error);
        return null;
      }
    });
    
    const emailDetails = await Promise.all(emailPromises);
    const validEmails = emailDetails.filter(email => email !== null);
    
    // Process and format the emails with complete content
    let formattedEmails = validEmails.map(email => {
      // Extract headers
      const headers = email.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";
      
      // Extract complete body content without truncation
      let body = "";
      if (email.payload.parts && email.payload.parts.length) {
        // Try to find text/plain part first
        const textPart = email.payload.parts.find((part) => part.mimeType === "text/plain");
        if (textPart && textPart.body.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } 
        // If not found, try to find HTML part
        else {
          const htmlPart = email.payload.parts.find((part) => part.mimeType === "text/html");
          if (htmlPart && htmlPart.body.data) {
            const htmlContent = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            body = htmlContent;
          }
        }
      } else if (email.payload.body && email.payload.body.data) {
        body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      
      return {
        id: email.id,
        subject,
        from,
        to,
        body,
        date,
        isRead: !email.labelIds.includes("UNREAD"),
        isHidden: false
      };
    });
    
    // Sort emails by date - newest first
    formattedEmails = formattedEmails.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    // Store emails in Supabase
    if (formattedEmails.length > 0) {
      for (const email of formattedEmails) {
        const { error: insertError } = await supabaseAdmin
          .from("emails")
          .upsert({
            id: email.id,
            from_address: email.from,
            to_address: email.to,
            subject: email.subject,
            snippet: email.body,  // Store the full email body
            date: new Date(email.date).toISOString(),
            read: email.isRead,
            hidden: email.isHidden
          }, { onConflict: 'id' });
          
        if (insertError) {
          console.error("Error storing email:", insertError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        emails: formattedEmails,
        count: formattedEmails.length,
        message: formattedEmails.length > 0 ? `Found ${formattedEmails.length} emails` : "No emails found" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in search-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
