// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vmztmhwrsyomkohkglcv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtenRtaHdyc3lvbWtvaGtnbGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzQ2OTksImV4cCI6MjA2MDgxMDY5OX0.N6Vu9bRH9klX5DcyHl60VfEZ18cKCHIeYGuuPu9Pcp4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);