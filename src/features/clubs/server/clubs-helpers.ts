import { revalidatePath } from 'next/cache';
import 'server-only';

import { ensureClubPublicChat } from '@/lib/api/clubs';
import { getServerClient,getServiceClient } from '@/utils/supabase/server';
import type { ClubPostKind } from './clubs.server';

export type ClubMemberCandidate = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  studyPlace: string | null;
};

export async function addUserToClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();
  let { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!conv) {
    const { data: club } = await svc
      .from('clubs')
      .select('id, name, owner_id')
      .eq('id', clubId)
      .maybeSingle();
    if (!club) return;
    const provisioned = await ensureClubPublicChat({
      id: (club as { id: string }).id,
      name: (club as { name: string }).name,
      owner_id: (club as { owner_id: string }).owner_id,
    });
    if (!provisioned) return;
    conv = { id: provisioned.conversationId };
  }

  await svc
    .from('conversation_participants')
    .upsert(
      { conversation_id: (conv as { id: string }).id, user_id: userId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true },
    );
}

export async function removeUserFromClubPublicChat(clubId: string, userId: string): Promise<void> {
  const svc = getServiceClient();
  const { data: conv } = await svc
    .from('conversations')
    .select('id')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!conv) return;
  await svc
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', (conv as { id: string }).id)
    .eq('user_id', userId);
}

export type ProfileLookup = { id: string; username: string | null };

/** Profile search bypasses RLS — callers must gate with canManageClubMembers first. */
export async function findProfileByUsername(
  svc: ReturnType<typeof getServiceClient>,
  rawUsername: string,
): Promise<{ profile: ProfileLookup | null; ambiguous: boolean }> {
  const normalized = rawUsername.trim().replace(/^@/, '');
  if (!normalized) return { profile: null, ambiguous: false };

  const { data: exact } = await svc
    .from('profiles')
    .select('id, username')
    .ilike('username', normalized)
    .maybeSingle();
  if (exact) return { profile: exact as ProfileLookup, ambiguous: false };

  const escaped = normalized.replace(/[\\%_]/g, '\\$&');
  const { data: partialRows } = await svc
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${escaped}%`)
    .limit(5);
  const partial = (partialRows ?? []) as ProfileLookup[];
  if (partial.length === 0) return { profile: null, ambiguous: false };
  if (partial.length === 1) return { profile: partial[0], ambiguous: false };

  const caseMatch = partial.find(
    (p) => p.username?.toLowerCase() === normalized.toLowerCase(),
  );
  if (caseMatch) return { profile: caseMatch, ambiguous: false };

  return { profile: null, ambiguous: true };
}

export async function isMusicClub(
  svc: ReturnType<typeof getServiceClient>,
  clubId: string,
): Promise<boolean> {
  const { data: club } = await svc
    .from('clubs')
    .select('category')
    .eq('id', clubId)
    .maybeSingle();
  return (club as { category?: string } | null)?.category === 'MUSICA';
}

export function buildMemberInsertRow(
  clubId: string,
  userId: string,
  musicClub: boolean,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    club_id: clubId,
    user_id: userId,
    role: 'MEMBER',
    membership_tier: 'FREE',
  };
  if (musicClub) row.status = 'approved';
  return row;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function requireUser() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data?.user) return { client, userId: null as string | null };
  return { client, userId: data.user.id };
}

export async function canManageClubMembers(
  client: Awaited<ReturnType<typeof getServerClient>>,
  clubId: string,
  userId: string,
): Promise<boolean> {
  const { data: club } = await client
    .from('clubs')
    .select('owner_id')
    .eq('id', clubId)
    .maybeSingle();
  if ((club as { owner_id: string } | null)?.owner_id === userId) return true;

  const { data: membership } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role;
  return role === 'OWNER' || role === 'ADMIN';
}

export type ClubPostMediaInput = {
  kind: 'image' | 'video';
  cfImageId?: string;
  cfVideoUid?: string;
  thumbnail?: string | null;
};

/**
 * Normalise the client-supplied media list into the snake-case JSONB shape
 * stored in `club_posts.media`. Mirrors the communities sanitizer: bad entries
 * (missing the relevant Cloudflare id) are dropped silently.
 */
export function sanitizeMedia(items: ClubPostMediaInput[] | undefined): Record<string, unknown>[] {
  if (!Array.isArray(items)) return [];
  const out: Record<string, unknown>[] = [];
  for (const m of items) {
    if (m.kind === 'image' && m.cfImageId) {
      out.push({ kind: 'image', cf_image_id: m.cfImageId });
    } else if (m.kind === 'video' && m.cfVideoUid) {
      out.push({
        kind: 'video',
        cf_video_uid: m.cfVideoUid,
        ...(m.thumbnail ? { thumbnail: m.thumbnail } : {}),
      });
    }
  }
  return out;
}

export interface CreateClubPostInput {
  clubId: string;
  kind?: ClubPostKind;
  title?: string;
  body?: string;
  media?: ClubPostMediaInput[];
  albumId?: string;
}

export function revalidateClubPaths() {
  revalidatePath('/clubs/[slug]', 'page');
}
