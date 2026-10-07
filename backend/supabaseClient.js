import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export function createSupabase() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
