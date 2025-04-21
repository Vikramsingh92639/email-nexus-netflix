
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
    const { token, description, expires_at } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create a Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Insert the new token
    const { data, error } = await supabaseAdmin
      .from('access_tokens')
      .insert({
        token,
        description: description || `Token created on ${new Date().toLocaleDateString()}`,
        expires_at: expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        blocked: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting access token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to add access token", details: error }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in add-access-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
