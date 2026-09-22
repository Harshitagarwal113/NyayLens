import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// We fall back to dummy values in case they are not set (e.g., during build or tests).
// Zod should ensure they are present at runtime if marked required, but we made them optional in env.ts.
const supabaseUrl = env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Supabase credentials not fully configured in environment variables.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Backend service role shouldn't persist session
  }
});
