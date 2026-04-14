import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser Supabase client. Memoized so repeated calls in the same tab
 * return the same instance (avoids re-creating the WebSocket on every
 * service-method call).
 */
export const createClient = () => {
  if (!cached) {
    cached = createBrowserClient(supabaseUrl!, supabaseKey!);
  }
  return cached;
};

/**
 * Convenience singleton — equivalent to `createClient()`. Use this when
 * you just want a shared client at the top of a service module without
 * the `()` call.
 */
export const supabase = createClient();
