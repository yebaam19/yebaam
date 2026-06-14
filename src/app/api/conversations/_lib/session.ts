import { getServerClient } from '@/utils/supabase/server';

export async function getUserIdFromSession(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}
