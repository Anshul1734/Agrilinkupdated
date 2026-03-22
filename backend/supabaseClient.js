import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://tcjkxutpiofxvjykfppv.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjamt4dXRwaW9meHZqeWtmcHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzk0ODcsImV4cCI6MjA4OTc1NTQ4N30.-vCUYJ3TKkVBSCecTC-0Rs_ifvuCCzM8ij8HZp_t5J4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
