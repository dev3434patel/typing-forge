import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = (()=>{try{return ['https:','http:'].includes(new URL(SUPABASE_URL).protocol)&&Boolean(SUPABASE_ANON_KEY?.trim());}catch{return false;}})();
// A missing cloud setup must leave guest practice usable. Cloud callers gate on this flag.
const storage = (() => { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } })();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(isSupabaseConfigured?SUPABASE_URL:'https://unconfigured.invalid', isSupabaseConfigured?SUPABASE_ANON_KEY:'unconfigured-public-key', {
  auth: {
    storage,
    persistSession: isSupabaseConfigured && Boolean(storage),
    autoRefreshToken: isSupabaseConfigured,
  }
});
