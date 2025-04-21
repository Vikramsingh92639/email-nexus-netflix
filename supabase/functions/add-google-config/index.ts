
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
    const { client_id, client_secret, description, active } = await req.json();
    
    if (!client_id || !client_secret) {
      return new Response(
        JSON.stringify({ error: "Client ID and Client Secret are required" }),
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
    
    // If activating a new config, first deactivate all existing ones
    if (active) {
      const { error: updateError } = await supabaseAdmin
        .from('google_auth')
        .update({ active: false })
        .eq('active', true);
        
      if (updateError) {
        console.error("Error deactivating existing configs:", updateError);
        // Continue with insert even if this fails
      }
    }
    
    // Insert the new config
    const { data, error } = await supabaseAdmin
      .from('google_auth')
      .insert({
        client_id,
        client_secret,
        description,
        active: active || false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting Google config:", error);
      return new Response(
        JSON.stringify({ error: "Failed to add Google authentication configuration", details: error }),
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
    console.error("Error in add-google-config function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
