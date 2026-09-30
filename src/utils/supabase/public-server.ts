import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Cookie-free, anonymous client for intentionally public, shared-cache reads.
 * Never use a service key or attach a caller's session to this client. */
export function getPublicServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
