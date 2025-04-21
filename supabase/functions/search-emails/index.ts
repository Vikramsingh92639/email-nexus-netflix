
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

    // Check if we have an access token
    if (!googleAuthData.access_token) {
      // If we don't have an access token but we have client credentials and refresh token, try to get a new access token
      if (googleAuthData.client_id && googleAuthData.client_secret && googleAuthData.refresh_token) {
        try {
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
            googleAuthData.access_token = tokenData.access_token;
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
      } else {
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
    }
    
    // Use the access token to fetch emails with full message scope
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:" + encodeURIComponent(searchEmail), {
      headers: {
        Authorization: `Bearer ${googleAuthData.access_token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gmail API error:", errorData);
      
      // Check if token expired
      if (response.status === 401) {
        // Token might be expired, try to refresh if we have a refresh token
        if (googleAuthData.refresh_token) {
          // Similar refresh logic as above
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
    
    // Fetch details for each message (limited to first 10 for performance)
    const emailPromises = messagesData.messages.slice(0, 10).map(async (message) => {
      const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`, {
        headers: {
          Authorization: `Bearer ${googleAuthData.access_token}`,
        },
      });
      
      if (!msgResponse.ok) {
        console.error(`Failed to fetch email ${message.id}`);
        return null;
      }
      
      return msgResponse.json();
    });
    
    const emailDetails = await Promise.all(emailPromises);
    const validEmails = emailDetails.filter(email => email !== null);
    
    // Process and format the emails with complete content
    const formattedEmails = validEmails.map(email => {
      // Extract headers
      const headers = email.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";
      
      // Extract complete body content without truncation
      let body = "";
      if (email.payload.parts && email.payload.parts.length) {
        const textPart = email.payload.parts.find((part) => part.mimeType === "text/plain");
        if (textPart && textPart.body.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
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
