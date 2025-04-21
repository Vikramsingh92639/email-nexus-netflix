
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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    
    // Handle OAuth errors returned by Google
    if (error) {
      console.error("Google OAuth error:", error, errorDescription);
      return new Response(
        `<html>
          <head>
            <title>Google Authentication Failed</title>
            <meta http-equiv="refresh" content="5;url=/admin/dashboard">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background-color: #141414;
                color: white;
                text-align: center;
              }
              .error { 
                color: #E50914; 
                font-weight: bold; 
                font-size: 24px;
                margin-bottom: 16px;
              }
              .container {
                padding: 20px;
                background-color: #232323;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                max-width: 500px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">Authentication Failed</div>
              <p>Error: ${error}</p>
              <p>${errorDescription || "No additional error details provided."}</p>
              <p>Possible reasons:</p>
              <ul style="text-align: left; display: inline-block;">
                <li>Google verification has not been completed for this app</li>
                <li>The redirect URI doesn't match what's in Google Cloud Console</li>
                <li>You've denied permission</li>
              </ul>
              <p>Redirecting to dashboard...</p>
            </div>
          </body>
        </html>`,
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/html" 
          } 
        }
      );
    }
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing authorization code" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!state) {
      return new Response(
        JSON.stringify({ error: "Missing state parameter" }),
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
    
    // Get the Google auth config
    const { data: googleAuthData, error: googleAuthError } = await supabaseAdmin
      .from("google_auth")
      .select("*")
      .eq("id", state)
      .single();
    
    if (googleAuthError || !googleAuthData) {
      console.error("Error fetching Google auth config:", googleAuthError);
      return new Response(
        JSON.stringify({ error: "Invalid state parameter or configuration not found" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const projectId = "vmztmhwrsyomkohkglcv";
    
    // Exchange the authorization code for tokens
    // Use the exact same redirect URI as in the auth request
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/google-auth-callback`;
    
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: googleAuthData.client_id,
          client_secret: googleAuthData.client_secret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        console.error("Error exchanging code for token:", tokenData);
        return new Response(
          `<html>
            <head>
              <title>Token Exchange Failed</title>
              <meta http-equiv="refresh" content="5;url=/admin/dashboard">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0;
                  background-color: #141414;
                  color: white;
                  text-align: center;
                }
                .error { 
                  color: #E50914; 
                  font-weight: bold; 
                  font-size: 24px;
                  margin-bottom: 16px;
                }
                .container {
                  padding: 20px;
                  background-color: #232323;
                  border-radius: 8px;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error">Token Exchange Failed</div>
                <p>Error: ${tokenData.error}</p>
                <p>${tokenData.error_description || "No additional error details provided."}</p>
                <p>Redirecting to dashboard...</p>
              </div>
            </body>
          </html>`,
          { 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/html" 
            } 
          }
        );
      }
      
      // Update the Google auth config with the tokens
      const { error: updateError } = await supabaseAdmin
        .from("google_auth")
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
        })
        .eq("id", state);
      
      if (updateError) {
        console.error("Error updating tokens:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save tokens" }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Redirect to the admin panel
      return new Response(
        `<html>
          <head>
            <title>Google Authentication Successful</title>
            <meta http-equiv="refresh" content="3;url=/admin/dashboard">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background-color: #141414;
                color: white;
                text-align: center;
              }
              .success { 
                color: #E50914; 
                font-weight: bold; 
                font-size: 24px;
                margin-bottom: 16px;
              }
              .container {
                padding: 20px;
                background-color: #232323;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">Google Authentication Successful!</div>
              <p>Your account has been connected. Redirecting to dashboard...</p>
            </div>
          </body>
        </html>`,
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/html" 
          } 
        }
      );
    } catch (tokenError) {
      console.error("Error fetching tokens:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code for tokens" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
  } catch (error) {
    console.error("Error in google-auth-callback function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
