import 'server-only';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { getServerClient } from '@/utils/supabase/server';
import { secretCommunityInvitationCursorSchema } from '../../schemas/secretCommunityInvitationCursor.schema';

const PAGE_SIZE = 12;

export type SecretCommunityInvitation = {
  id: string;
  communityId: string;
  communityName: string;
  communitySlug: string;
  createdAt: string;
};

export type SecretCommunityInvitationPage = {
  items: SecretCommunityInvitation[];
  nextCursor: string | null;
};

type InvitationRow = {
  id: string;
  community_id: string;
  community_name: string;
  community_slug: string;
  created_at: string;
};

export async function listSecretCommunityInvitations(
  cursorJson: string | null = null,
): Promise<SecretCommunityInvitationPage> {
  const user = await getCachedAuthUser();
  if (!user) return { items: [], nextCursor: null };

  const cursor = cursorJson
    ? secretCommunityInvitationCursorSchema.parse(JSON.parse(cursorJson))
    : null;
  const client = await getServerClient();
  const { data, error } = await client.rpc('list_my_secret_community_invitations', {
    before_created_at: cursor?.createdAt ?? null,
    before_id: cursor?.id ?? null,
    page_limit: PAGE_SIZE + 1,
  });
  if (error) throw new Error('No se pudieron cargar las invitaciones.');

  const rows = ((data ?? []) as InvitationRow[]).slice(0, PAGE_SIZE);
  const last = rows.at(-1);
  return {
    items: rows.map((row) => ({
      id: row.id,
      communityId: row.community_id,
      communityName: row.community_name,
      communitySlug: row.community_slug,
      createdAt: row.created_at,
    })),
    nextCursor: data && data.length > PAGE_SIZE && last
      ? JSON.stringify({ createdAt: last.created_at, id: last.id })
      : null,
  };
}
