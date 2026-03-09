import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Use env vars with hardcoded fallbacks to prevent white screen crashes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://egkvapfrjieshmsbpetq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVna3ZhcGZyamllc2htc2JwZXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTk3ODUsImV4cCI6MjA4ODQ3NTc4NX0.5nH83usT53xUBlsOzpejVLybojH1nj0CV_xgdTd8xNk';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'wellnotes_auth',
  },
});
