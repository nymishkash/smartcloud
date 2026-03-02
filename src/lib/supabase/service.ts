import { createClient } from '@supabase/supabase-js'

// Service role client bypasses RLS — use only for server-side operations
// like inserting access_logs on behalf of the user.
// NEVER expose this client to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
