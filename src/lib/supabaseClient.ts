import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rzlagjmfyriyhtkbmvnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bGFnam1meXJpeWh0a2Jtdm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDk5MTYsImV4cCI6MjA2MDMyNTkxNn0.ablERNzgCpAVGH-M-MmjqiOotIXiBUtGpxkStpw-O5k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
