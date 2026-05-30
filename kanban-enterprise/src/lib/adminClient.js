import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Separate client instance for admin operations
// This prevents signUp from overwriting the current admin session
export const adminAuthClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,   // ← key: don't persist or override the current session
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-admin-ops', // different storage key
  },
})
