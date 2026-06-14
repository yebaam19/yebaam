import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MusicArticleAuthor } from '../../types/music.types';

export type { MusicArticleAuthor };

export type ProfileLite = {
  id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_cloudflare_id: string | null;
};

/** Batch-load profile mini-objects for a set of user ids. Used because
 *  club_members / club_posts / music_articles all reference auth.users(id)
 *  directly — there is no FK to public.profiles, so PostgREST embeds fail. */
async function fetchProfilesByUserIds(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, MusicArticleAuthor>> {
  const map = new Map<string, MusicArticleAuthor>();
  if (!userIds.length) return map;
  const unique = Array.from(new Set(userIds));
  const { data } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_cloudflare_id')
    .in('id', unique);
  for (const p of ((data as ProfileLite[] | null) ?? [])) {
    const nameFromParts = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
    map.set(p.id, {
      id: p.id,
      username: p.username,
      full_name: p.display_name ?? (nameFromParts || null),
      avatar_cf_image_id: p.avatar_cloudflare_id,
    });
  }
  return map;
}


export { fetchProfilesByUserIds };
