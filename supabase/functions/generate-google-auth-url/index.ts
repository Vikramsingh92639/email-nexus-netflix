
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
    const { configId } = await req.json();
    
    if (!configId) {
      return new Response(
        JSON.stringify({ error: "Configuration ID is required" }),
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
      .eq("id", configId)
      .single();
    
    if (googleAuthError) {
      console.error("Error fetching Google auth config:", googleAuthError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Google authentication configuration", details: googleAuthError }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!googleAuthData) {
      return new Response(
        JSON.stringify({ error: "Google authentication configuration not found" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const projectId = "vmztmhwrsyomkohkglcv"; 
    
    // Generate the OAuth URL
    // Use the exact same redirect URI as configured in Google Cloud Console
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/google-auth-callback`;
    
    // Use a minimal scope for testing - this will work without verification
    const scope = encodeURIComponent('profile email');
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${encodeURIComponent(googleAuthData.client_id)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&access_type=offline&prompt=consent&state=${configId}`;
    
    return new Response(
      JSON.stringify({ success: true, authUrl }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in generate-google-auth-url function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
