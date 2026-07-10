import 'server-only';
import type { getServerClient } from '@/utils/supabase/server';

export type PageRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  contact: Record<string, unknown> | null;
  privacy: string;
  is_verified: boolean | null;
  verification_requested_at: string | null;
  post_count: number | null;
  follower_count: number | null;
  recommend_count?: number | null;
  like_count?: number | null;
  featured_type?: string | null;
  featured_post_id?: string | null;
  featured_cf_image_id?: string | null;
  featured_autoplay?: boolean | null;
  chat_publico_room_id?: string | null;
  foro_space_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type Viewer = {
  userId: string | null;
  followingIds: Set<string>;
  teamRoles: Map<string, string>;
  owners: Map<string, ProfileLite>;
  followerCounts: Map<string, number>;
  /** pageId → set of reaction types the viewer has active */
  viewerReactions: Map<string, Set<'recommend' | 'like'>>;
  /** public_chat_topics.id → slug (rooms live at /feed/chat-publico/[topicSlug]) */
  chatTopicSlugs: Map<string, string>;
  /** forum_spaces.id → slug (spaces live at /foro/[spaceSlug]) */
  foroSpaceSlugs: Map<string, string>;
};

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `page-${Date.now()}`
  );
}

export function mapPage(row: PageRow, viewer: Viewer) {
  const owner = viewer.owners.get(row.owner_id);
  const ownerName =
    [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || owner?.username || undefined;
  const followerCount = viewer.followerCounts.get(row.id) ?? row.follower_count ?? 0;

  // Privacidad por Defecto (Macro Reglamento Art. 2): ante privacy NULL asumimos
  // el estado MÁS restringido — nunca 'public' fail-open.
  const privacy = row.privacy ?? 'restricted';
  const isPrivileged = viewer.userId === row.owner_id || viewer.teamRoles.has(row.id);
  // El contacto (email/teléfono/dirección) es dato personal (Art. 2/5, Ley 1581):
  // sólo se sirve en páginas públicas o al titular/equipo. Para el resto viaja
  // vacío y no aparece en listados, búsqueda ni detalle.
  const contact = (privacy === 'public' || isPrivileged ? (row.contact ?? {}) : {}) as Record<
    string,
    unknown
  >;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'OTHER',
    subcategory: row.subcategory ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    contact,
    followerCount,
    isFollowing: viewer.followingIds.has(row.id),
    isVerified: Boolean(row.is_verified),
    ownerId: row.owner_id,
    ownerName,
    ownerUsername: owner?.username ?? undefined,
    ownerAvatar: owner?.avatar_url ?? undefined,
    ownerBio: owner?.bio ?? undefined,
    userRole:
      viewer.userId === row.owner_id
        ? 'owner'
        : viewer.teamRoles.get(row.id)?.toLowerCase(),
    postCount: row.post_count ?? 0,
    recommendCount: row.recommend_count ?? 0,
    likeCount: row.like_count ?? 0,
    hasRecommended: viewer.viewerReactions.get(row.id)?.has('recommend') ?? false,
    hasLiked: viewer.viewerReactions.get(row.id)?.has('like') ?? false,
    featuredType: (row.featured_type as 'reel' | 'video' | 'image' | null) ?? null,
    featuredPostId: row.featured_post_id ?? null,
    featuredCfImageId: row.featured_cf_image_id ?? null,
    featuredAutoplay: Boolean(row.featured_autoplay),
    // §7 vínculo chat/foro — el id vive en pages, pero las rutas son por slug,
    // así que también se resuelve el slug (null si la sala/espacio ya no existe
    // o está archivado: el cliente cae al enlace genérico).
    chatPublicoRoomId: row.chat_publico_room_id ?? null,
    chatPublicoRoomSlug: row.chat_publico_room_id
      ? (viewer.chatTopicSlugs.get(row.chat_publico_room_id) ?? null)
      : null,
    foroSpaceId: row.foro_space_id ?? null,
    foroSpaceSlug: row.foro_space_id
      ? (viewer.foroSpaceSlugs.get(row.foro_space_id) ?? null)
      : null,
    verificationRequestedAt: row.verification_requested_at ?? undefined,
    privacy,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadPageContext(
  client: Awaited<ReturnType<typeof getServerClient>>,
  rows: PageRow[],
  viewerId: string | null
): Promise<Viewer> {
  const pageIds = rows.map((r) => r.id);
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)));
  const chatTopicIds = Array.from(
    new Set(rows.map((r) => r.chat_publico_room_id).filter((id): id is string => Boolean(id)))
  );
  const foroSpaceIds = Array.from(
    new Set(rows.map((r) => r.foro_space_id).filter((id): id is string => Boolean(id)))
  );

  const [
    ownersRes,
    viewerFollowsRes,
    viewerTeamRes,
    followerCountsRes,
    viewerReactionsRes,
    chatTopicsRes,
    foroSpacesRes,
  ] = await Promise.all([
      ownerIds.length
        ? client
            .from('profiles')
            .select('id,username,first_name,last_name,avatar_url,bio')
            .in('id', ownerIds)
        : Promise.resolve({ data: [] as ProfileLite[] }),
      viewerId && pageIds.length
        ? client
            .from('page_followers')
            .select('page_id')
            .eq('user_id', viewerId)
            .in('page_id', pageIds)
        : Promise.resolve({ data: [] as Array<{ page_id: string }> }),
      viewerId && pageIds.length
        ? client
            .from('page_team_members')
            .select('page_id,role')
            .eq('user_id', viewerId)
            .in('page_id', pageIds)
        : Promise.resolve({ data: [] as Array<{ page_id: string; role: string }> }),
      pageIds.length
        ? client.from('page_followers').select('page_id').in('page_id', pageIds)
        : Promise.resolve({ data: [] as Array<{ page_id: string }> }),
      viewerId && pageIds.length
        ? client
            .from('page_reactions')
            .select('page_id,type')
            .eq('user_id', viewerId)
            .in('page_id', pageIds)
        : Promise.resolve({ data: [] as Array<{ page_id: string; type: string }> }),
      chatTopicIds.length
        ? client
            .from('public_chat_topics')
            .select('id,slug,is_archived')
            .in('id', chatTopicIds)
        : Promise.resolve({
            data: [] as Array<{ id: string; slug: string; is_archived: boolean }>,
          }),
      foroSpaceIds.length
        ? client.from('forum_spaces').select('id,slug,enabled').in('id', foroSpaceIds)
        : Promise.resolve({
            data: [] as Array<{ id: string; slug: string; enabled: boolean }>,
          }),
    ]);

  const owners = new Map<string, ProfileLite>();
  for (const p of (ownersRes.data ?? []) as ProfileLite[]) owners.set(p.id, p);

  const followingIds = new Set<string>();
  for (const f of (viewerFollowsRes.data ?? []) as Array<{ page_id: string }>) {
    followingIds.add(f.page_id);
  }

  const teamRoles = new Map<string, string>();
  for (const t of (viewerTeamRes.data ?? []) as Array<{ page_id: string; role: string }>) {
    teamRoles.set(t.page_id, t.role);
  }

  const followerCounts = new Map<string, number>();
  for (const f of (followerCountsRes.data ?? []) as Array<{ page_id: string }>) {
    followerCounts.set(f.page_id, (followerCounts.get(f.page_id) ?? 0) + 1);
  }

  const viewerReactions = new Map<string, Set<'recommend' | 'like'>>();
  for (const r of (viewerReactionsRes.data ?? []) as Array<{ page_id: string; type: string }>) {
    if (r.type !== 'recommend' && r.type !== 'like') continue;
    const set = viewerReactions.get(r.page_id) ?? new Set();
    set.add(r.type);
    viewerReactions.set(r.page_id, set);
  }

  // Salas archivadas / espacios deshabilitados no reciben deep-link: sus rutas
  // responden notFound, así que el slug sólo se expone cuando siguen vivos.
  const chatTopicSlugs = new Map<string, string>();
  for (const t of (chatTopicsRes.data ?? []) as Array<{
    id: string;
    slug: string;
    is_archived: boolean;
  }>) {
    if (!t.is_archived) chatTopicSlugs.set(t.id, t.slug);
  }

  const foroSpaceSlugs = new Map<string, string>();
  for (const s of (foroSpacesRes.data ?? []) as Array<{
    id: string;
    slug: string;
    enabled: boolean;
  }>) {
    if (s.enabled) foroSpaceSlugs.set(s.id, s.slug);
  }

  return {
    userId: viewerId,
    followingIds,
    teamRoles,
    owners,
    followerCounts,
    viewerReactions,
    chatTopicSlugs,
    foroSpaceSlugs,
  };
}
