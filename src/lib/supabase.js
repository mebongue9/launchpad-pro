// /src/lib/supabase.js
// Supabase client initialization and configuration
// Used by all components that need database or auth access
// RELEVANT FILES: src/hooks/useAuth.js, src/hooks/useProfiles.js, src/hooks/useAudiences.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
