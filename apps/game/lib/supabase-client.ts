import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

const supabaseUrl = 'https://nmmaiyaljmuxuqcgcwjg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbWFpeWFsam11eHVxY2djd2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mzk2ODUsImV4cCI6MjA2NTQxNTY4NX0.2ZtL2EUTCem4R-BPWibjMa0HaPj0Ic223mOwlDs35r0'

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (e) {
    console.error(
      "Error initializing Supabase client despite URL and Key being present. This might be due to an invalid URL format or other issues:",
      e,
    )
    // supabaseInstance remains null
  }
} else {
  console.warn(
    "Supabase URL or Anon Key is missing. Supabase-dependent features (photo uploads, final submissions) will be disabled. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in your Vercel project for full functionality.",
  )
}

export const supabase = supabaseInstance
