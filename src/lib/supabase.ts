import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = 'https://escrssogzpimlzhyozde.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3Jzc29nenBpbWx6aHlvemRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTQxMDAsImV4cCI6MjA4NzA5MDEwMH0.Chin9qrrtWi6ekeHvlyCiPIhVate4LB6Fel-D1F6NCE';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'wellnotes_auth',
  },
});
