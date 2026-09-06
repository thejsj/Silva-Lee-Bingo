import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (supabaseUrl && supabasePublishableKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey)
  } catch (e) {
    console.error(
      "Error initializing Supabase client despite URL and Key being present. This might be due to an invalid URL format or other issues:",
      e,
    )
  }
} else {
  console.warn(
    "Supabase URL or publishable key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  )
}

export const supabase = supabaseInstance
