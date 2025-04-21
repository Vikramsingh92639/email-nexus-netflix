
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
    const { id, updates } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Config ID is required" }),
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
    
    // If activating this config, deactivate all others
    if (updates.active) {
      const { error: updateError } = await supabaseAdmin
        .from('google_auth')
        .update({ active: false })
        .neq('id', id);
        
      if (updateError) {
        console.error("Error deactivating other configs:", updateError);
        // Continue with update even if this fails
      }
    }
    
    // Update the config
    const { data, error } = await supabaseAdmin
      .from('google_auth')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating Google config:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update Google authentication configuration", details: error }),
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
    console.error("Error in update-google-config function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
