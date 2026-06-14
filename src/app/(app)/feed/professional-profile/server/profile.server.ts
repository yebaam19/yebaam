import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import {
  type ProfileRow,
  type UserProfileRow,
  USER_COLUMNS,
  toProfile,
} from './profile.mappers';
import { hydrateProfile } from './profile-hydrate.server';

type SupabaseServerClient = Awaited<ReturnType<typeof getServerClient>>;

async function loadUserById(
  client: SupabaseServerClient,
  userId: string,
): Promise<UserProfileRow | null> {
  const { data } = await client
    .from('profiles')
    .select(USER_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  return (data as UserProfileRow | null) ?? null;
}

export async function getMyProfile(): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;

  const user = await loadUserById(client, userId);
  return hydrateProfile(client, toProfile(data as ProfileRow, user));
}

export async function getProfileByUsername(username: string): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();

  const { data: user } = await client
    .from('profiles')
    .select(USER_COLUMNS)
    .eq('username', username)
    .maybeSingle();
  if (!user) return null;

  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('user_id', (user as UserProfileRow).id)
    .maybeSingle();
  if (error || !data) return null;

  return hydrateProfile(client, toProfile(data as ProfileRow, user as UserProfileRow));
}

export async function getProfileById(id: string): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();
  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  const user = await loadUserById(client, (data as ProfileRow).user_id);
  return hydrateProfile(client, toProfile(data as ProfileRow, user));
}

export async function listPublicProfiles(
  limit = 24,
  offset = 0,
): Promise<{ profiles: ProfessionalProfile[]; total: number }> {
  const client = await getServerClient();

  const { data, error, count } = await client
    .from('professional_profiles')
    .select('*', { count: 'exact' })
    .eq('visibility', 'PUBLIC')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { profiles: [], total: 0 };

  const rows = data as ProfileRow[];
  if (rows.length === 0) return { profiles: [], total: count ?? 0 };

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: users } = await client.from('profiles').select(USER_COLUMNS).in('id', userIds);
  const userById = new Map<string, UserProfileRow>();
  for (const u of (users ?? []) as UserProfileRow[]) userById.set(u.id, u);

  const profiles = rows.map((r) => toProfile(r, userById.get(r.user_id) ?? null));
  return { profiles, total: count ?? profiles.length };
}

export type OwnerExtras = {
  titleDiplomas: Map<string, string | null>;
  studyDiplomas: Map<string, string | null>;
};

/**
 * Owner-only fetch for credential evidence references.
 * Public hydration deliberately omits diploma_cf_image_id; this helper merges
 * those values back in for the profile owner only. Caller must guard via isOwner.
 */
export async function hydrateOwnerExtras(profileId: string): Promise<OwnerExtras> {
  const client = await getServerClient();
  const [titles, studies] = await Promise.all([
    client.from('professional_profile_titles').select('id, diploma_cf_image_id').eq('professional_profile_id', profileId),
    client.from('professional_profile_studies').select('id, diploma_cf_image_id').eq('professional_profile_id', profileId),
  ]);
  const titleDiplomas = new Map<string, string | null>();
  const studyDiplomas = new Map<string, string | null>();
  for (const r of (titles.data ?? []) as Array<{ id: string; diploma_cf_image_id: string | null }>) {
    titleDiplomas.set(r.id, r.diploma_cf_image_id);
  }
  for (const r of (studies.data ?? []) as Array<{ id: string; diploma_cf_image_id: string | null }>) {
    studyDiplomas.set(r.id, r.diploma_cf_image_id);
  }
  return { titleDiplomas, studyDiplomas };
}

export async function checkIsFollowing(profileId: string): Promise<boolean> {
  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return false;

  const { data } = await client
    .from('professional_profile_follows')
    .select('id')
    .eq('professional_profile_id', profileId)
    .eq('follower_id', userId)
    .maybeSingle();
  return !!data;
}
