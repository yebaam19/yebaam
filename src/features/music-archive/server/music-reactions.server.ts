import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type { AlbumReactionCounts, AlbumReactionKind } from '../types/music.types';

const KINDS: AlbumReactionKind[] = ['like', 'love', 'fire', 'star'];

/** Aggregated reaction counts for an album + the current viewer's selection.
 *  Returns zeros if the album has no reactions yet. */
export const getAlbumReactionCounts = cache(
  async (albumId: string): Promise<AlbumReactionCounts> => {
    const client = await getServerClient();
    const [{ data: rows }, { data: u }] = await Promise.all([
      client.from('music_album_reactions').select('reaction, user_id').eq('album_id', albumId),
      client.auth.getUser(),
    ]);
    const counts: AlbumReactionCounts = {
      like: 0,
      love: 0,
      fire: 0,
      star: 0,
      userReaction: null,
    };
    const viewerId = u.user?.id ?? null;
    for (const r of ((rows as Array<{ reaction: string; user_id: string }> | null) ?? [])) {
      if ((KINDS as string[]).includes(r.reaction)) {
        counts[r.reaction as AlbumReactionKind] += 1;
      }
      if (viewerId && r.user_id === viewerId && (KINDS as string[]).includes(r.reaction)) {
        counts.userReaction = r.reaction as AlbumReactionKind;
      }
    }
    return counts;
  },
);
