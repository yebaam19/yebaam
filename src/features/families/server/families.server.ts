import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import type {
  FamilyRow,
  FamilyMemberRow,
  FamilyMemberPermissionsRow,
  FamilyPersonRow,
  FamilyEventRow,
  FamilyPhotoRow,
  FamilyStoryRow,
  FamilyDocumentRow,
  FamilyInvitationRow,
  FamilyRelationshipRow,
  FamilyTreeNodeRow,
  FamilyWithViewer,
} from '../types/family.types';

async function getViewerId(): Promise<string | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export const listMyFamilies = cache(async (): Promise<FamilyWithViewer[]> => {
  const viewerId = await getViewerId();
  if (!viewerId) return [];

  const client = await getServerClient();

  const { data: members } = await client
    .from('family_members')
    .select('family_id, role')
    .eq('profile_id', viewerId);

  const familyIds = (members ?? []).map((m) => m.family_id);
  if (familyIds.length === 0) return [];

  const { data: families } = await client
    .from('families')
    .select('*')
    .in('id', familyIds)
    .order('updated_at', { ascending: false });

  const roleByFamily = new Map<string, FamilyMemberRow['role']>();
  for (const m of members ?? []) roleByFamily.set(m.family_id, m.role);

  return (families as FamilyRow[] | null ?? []).map((f) => ({
    ...f,
    viewer_role: roleByFamily.get(f.id) ?? null,
    has_pending_invite: false,
  }));
});

export const listMyPendingFamilyInvitations = cache(async () => {
  const viewerId = await getViewerId();
  if (!viewerId) return [];
  const client = await getServerClient();
  const { data } = await client
    .from('family_invitations')
    .select('id, family_id, invitee_id, invited_by, person_id, status, responded_at, created_at')
    .eq('invitee_id', viewerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return (data as FamilyInvitationRow[] | null) ?? [];
});

export const getFamilyBySlug = cache(async (slug: string): Promise<FamilyWithViewer | null> => {
  const client = await getServerClient();
  const { data } = await client.from('families').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  const viewerId = await getViewerId();
  let role: FamilyMemberRow['role'] | null = null;
  let hasPending = false;
  if (viewerId) {
    const [{ data: membership }, { data: invite }] = await Promise.all([
      client
        .from('family_members')
        .select('role')
        .eq('family_id', data.id)
        .eq('profile_id', viewerId)
        .maybeSingle(),
      client
        .from('family_invitations')
        .select('id')
        .eq('family_id', data.id)
        .eq('invitee_id', viewerId)
        .eq('status', 'pending')
        .maybeSingle(),
    ]);
    role = (membership as { role: FamilyMemberRow['role'] } | null)?.role ?? null;
    hasPending = Boolean(invite);
  }
  return { ...(data as FamilyRow), viewer_role: role, has_pending_invite: hasPending };
});

export const getFamilyPersons = cache(async (familyId: string): Promise<FamilyPersonRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('family_persons')
    .select('*')
    .eq('family_id', familyId)
    .order('birth_date', { ascending: true, nullsFirst: false });
  return (data as FamilyPersonRow[] | null) ?? [];
});

export const getFamilyTree = cache(async (familyId: string): Promise<FamilyTreeNodeRow[]> => {
  const client = await getServerClient();
  const { data } = await client.rpc('get_family_tree', { p_family_id: familyId });
  return (data as FamilyTreeNodeRow[] | null) ?? [];
});

export const getFamilyRelationships = cache(
  async (familyId: string): Promise<FamilyRelationshipRow[]> => {
    const client = await getServerClient();
    const { data } = await client
      .from('family_relationships')
      .select('*')
      .eq('family_id', familyId);
    return (data as FamilyRelationshipRow[] | null) ?? [];
  },
);

export const getFamilyMembers = cache(async (familyId: string) => {
  const client = await getServerClient();
  const { data: members } = await client
    .from('family_members')
    .select('id, family_id, profile_id, role, joined_at')
    .eq('family_id', familyId)
    .order('joined_at', { ascending: true });

  const rows = (members as FamilyMemberRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const profileIds = Array.from(new Set(rows.map((m) => m.profile_id)));
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', profileIds);

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        username: (p.username as string | null) ?? '',
        firstName: (p.first_name as string | null) ?? '',
        lastName: (p.last_name as string | null) ?? '',
        avatarUrl: (p.avatar_url as string | null) ?? null,
      },
    ]),
  );

  return rows.map((m) => ({
    ...m,
    profile: profileById.get(m.profile_id) ?? {
      username: '',
      firstName: '',
      lastName: '',
      avatarUrl: null,
    },
  }));
});

export const getFamilyEvents = cache(async (familyId: string): Promise<FamilyEventRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('family_events')
    .select('*')
    .eq('family_id', familyId)
    .order('event_date', { ascending: false, nullsFirst: false });
  return (data as FamilyEventRow[] | null) ?? [];
});

export const getFamilyPhotos = cache(async (familyId: string): Promise<FamilyPhotoRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('family_photos')
    .select('*')
    .eq('family_id', familyId)
    .order('taken_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  return (data as FamilyPhotoRow[] | null) ?? [];
});

export const getFamilyStories = cache(async (familyId: string): Promise<FamilyStoryRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('family_stories')
    .select('*')
    .eq('family_id', familyId)
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  return (data as FamilyStoryRow[] | null) ?? [];
});

export const getMemberPermissions = cache(
  async (familyId: string): Promise<FamilyMemberPermissionsRow[]> => {
    const client = await getServerClient();
    const { data } = await client
      .from('family_member_permissions')
      .select('*')
      .eq('family_id', familyId);
    return (data as FamilyMemberPermissionsRow[] | null) ?? [];
  },
);

export const getFamilyDocuments = cache(async (familyId: string): Promise<FamilyDocumentRow[]> => {
  const client = await getServerClient();
  const { data } = await client
    .from('family_documents')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  return (data as FamilyDocumentRow[] | null) ?? [];
});
