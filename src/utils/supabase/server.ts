import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore if middleware refreshes sessions.
        }
      },
    },
  });
};

/**
 * Server client bound to the caller's session — use from route handlers and
 * Server Actions when you want RLS to apply with the user's identity.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Service-role client — bypasses RLS. Use ONLY from server code for
 * privileged operations (admin tasks, cron-like jobs, user-impersonation-
 * sensitive flows). Never expose this client or its key to the browser.
 */
export function getServiceClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot create service client');
  }
  return createServiceRoleClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Return the raw access token from the current Supabase session cookie,
 * or null when unauthenticated. Useful for forwarding the token to
 * downstream services (e.g. Storage API direct calls).
 */
export async function getServerAccessToken(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
