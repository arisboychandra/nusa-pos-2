import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configReady = Boolean(url && key && !url.includes('YOUR_PROJECT_REF'));
export const supabase = configReady ? createClient(url, key, {
  auth: { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true }
}) : null;
