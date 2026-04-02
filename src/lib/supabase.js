import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function initSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('Supabase init failed, using mock data:', err.message)
    return null
  }
}

export const supabase = initSupabase()

// Check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase
