import 'server-only';
import { getServerClient, getServerAccessToken } from '@/lib/insforge/server';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export async function getAuthUser(): Promise<User | null> {
  const token = await getServerAccessToken();
  if (!token) return null;

  const client = await getServerClient();
  const { data: authResponse, error: authError } = await client.auth.getCurrentUser();
  if (authError || !authResponse?.user) return null;

  const userId = authResponse.user.id;
  const email = authResponse.user.email ?? '';

  const { data: profile } = await client.database
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .eq('id', userId)
    .single();

  const p = (profile as ProfileRow | null) ?? null;
  const fallbackName = email.split('@')[0] || 'user';
  const displayName =
    p?.display_name ||
    [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() ||
    p?.username ||
    fallbackName;

  return {
    id: userId,
    username: p?.username ?? fallbackName,
    displayName,
    avatarUrl: p?.avatar_url ?? null,
  };
}
