import 'server-only';
import { imageUrl, withImageVariant } from '@/lib/media/urls';
import { fromCommunityMedia } from '@/lib/media/parse';
import {
  Community,
  CommunityCategory,
  CommunityMember,
  CommunityPost,
  CommunityPostArticleRef,
  CommunityPostMediaItem,
  CommunityPrivacy,
  CommunityRole,
  CommunityRule,
} from '@/features/communities/types/community.types';

// Marker line format embedded by `shareCommunityArticleToFeed`:
//   [[community-article: <slug>|<title>]]
// Lives on its own line; trailing/leading whitespace is tolerated.
const ARTICLE_MARKER_RE = /\n?\s*\[\[community-article:\s*([^|\]]+)\|([^\]]+)\]\]\s*$/;

function extractArticleRef(
  body: string,
  communitySlug: string | undefined,
): { content: string; articleRef?: CommunityPostArticleRef } {
  if (!communitySlug) return { content: body };
  const match = body.match(ARTICLE_MARKER_RE);
  if (!match) return { content: body };
  const slug = match[1].trim();
  const title = match[2].trim();
  if (!slug || !title) return { content: body };
  return {
    content: body.slice(0, match.index ?? 0).trim(),
    articleRef: {
      slug,
      title,
      href: `/feed/comunidades/${communitySlug}/articulos/${slug}`,
    },
  };
}

export type CommunityRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: CommunityCategory;
  privacy: CommunityPrivacy;
  cover_image: string | null;
  profile_image: string | null;
  location: string | null;
  website: string | null;
  tags: string[] | null;
  rules: unknown;
  allow_member_posts: boolean;
  require_approval: boolean;
  is_certified: boolean;
  member_count: number;
  post_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export type CommunityMemberRow = {
  community_id: string;
  user_id: string;
  role: CommunityRole;
  status: 'active' | 'pending' | 'banned';
  joined_at: string;
};

export type CommunityPostRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  media: unknown;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type CommunityViewerCtx = {
  userId: string | null;
  ownerProfile: ProfileLite | null;
  ownerMembership: CommunityMemberRow | null;
  myMembership: CommunityMemberRow | null;
};

const SLUG_MAX_LENGTH = 80;

export function slugifyCommunity(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX_LENGTH) || `comunidad-${Date.now()}`
  );
}

function profileDisplayName(p: ProfileLite | null | undefined): string {
  if (!p) return 'Usuario';
  return (
    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
    p.username ||
    'Usuario'
  );
}

function resolveCloudflareImage(id: string | null | undefined, variant: 'public' | 'cover' | 'avatar' = 'public'): string | undefined {
  if (!id) return undefined;
  try {
    return imageUrl(id, variant);
  } catch {
    return undefined;
  }
}

function toRules(value: unknown): CommunityRule[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, idx) => {
      if (!entry || typeof entry !== 'object') return null;
      const r = entry as Record<string, unknown>;
      const title = typeof r.title === 'string' ? r.title : '';
      if (!title) return null;
      return {
        id: typeof r.id === 'string' ? r.id : `rule-${idx}`,
        title,
        description: typeof r.description === 'string' ? r.description : '',
        order: typeof r.order === 'number' ? r.order : idx + 1,
      } satisfies CommunityRule;
    })
    .filter((r): r is CommunityRule => r !== null);
}

export type CommunityPostMedia = {
  kind: 'image' | 'video';
  cfImageId?: string;
  cfVideoUid?: string;
  thumbnail?: string;
};

/**
 * Parse the `community_posts.media` JSONB column into the local
 * `CommunityPostMedia` shape. The canonical adapter (`fromCommunityMedia` in
 * `src/lib/media/parse.ts`) owns the snake-case key resolution and the
 * kind-validation rules; this function only re-projects the resulting
 * `MediaItem` into the kind-split `cfImageId` / `cfVideoUid` shape that the
 * `mapPost` logic below already consumes.
 */
export function toPostMedia(value: unknown): CommunityPostMedia[] {
  return fromCommunityMedia(value).map((m) => {
    const item: CommunityPostMedia = { kind: m.kind };
    if (m.kind === 'image') item.cfImageId = m.cfId;
    else item.cfVideoUid = m.cfId;
    if (m.thumbnailUrl) item.thumbnail = m.thumbnailUrl;
    return item;
  });
}

export function buildOwnerMember(
  row: CommunityRow,
  ownerProfile: ProfileLite | null,
  ownerMembership: CommunityMemberRow | null,
): CommunityMember {
  return {
    id: ownerProfile?.id ?? row.owner_id,
    userId: row.owner_id,
    username: ownerProfile?.username ?? '',
    name: profileDisplayName(ownerProfile),
    avatar: ownerProfile?.avatar_url
      ? withImageVariant(ownerProfile.avatar_url, 'avatar')
      : undefined,
    role: CommunityRole.OWNER,
    joinedAt: ownerMembership?.joined_at ?? row.created_at,
    isVerified: false,
  };
}

export function mapCommunity(
  row: CommunityRow,
  ctx: CommunityViewerCtx,
): Community {
  const isOwner = ctx.userId !== null && ctx.userId === row.owner_id;
  const isMember = isOwner || (ctx.myMembership?.status === 'active');

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category,
    privacy: row.privacy,
    coverImageUrl: resolveCloudflareImage(row.cover_image, 'public'),
    profileImageUrl: resolveCloudflareImage(row.profile_image, 'public'),
    stats: {
      membersCount: row.member_count,
      postsCount: row.post_count,
      activeMembers: row.member_count,
      growthRate: 0,
      postsPerDay: 0,
    },
    owner: buildOwnerMember(row, ctx.ownerProfile, ctx.ownerMembership),
    rules: toRules(row.rules),
    tags: row.tags ?? [],
    location: row.location ?? undefined,
    website: row.website ?? undefined,
    createdAt: row.created_at,
    isMember,
    isVerified: row.is_certified,
    allowMemberPosts: row.allow_member_posts,
    requireApproval: row.require_approval,
  };
}

export function mapMember(
  row: CommunityMemberRow,
  profile: ProfileLite | undefined,
): CommunityMember {
  return {
    id: `${row.community_id}:${row.user_id}`,
    userId: row.user_id,
    username: profile?.username ?? '',
    name: profileDisplayName(profile ?? null),
    avatar: profile?.avatar_url ? withImageVariant(profile.avatar_url, 'avatar') : undefined,
    role: row.role,
    joinedAt: row.joined_at,
    isVerified: false,
  };
}

export function mapPost(
  row: CommunityPostRow,
  author: ProfileLite | undefined,
  communitySlug?: string,
): CommunityPost {
  const rawMedia = toPostMedia(row.media);

  // Resolve to client-renderable items. Skip any image whose Cloudflare URL
  // can't be resolved (missing env var, etc.) so a single bad row doesn't
  // crash the whole posts query.
  const media: CommunityPostMediaItem[] = [];
  for (const m of rawMedia) {
    if (m.kind === 'image' && m.cfImageId) {
      const url = resolveCloudflareImage(m.cfImageId, 'public');
      if (url) media.push({ kind: 'image', url });
      continue;
    }
    if (m.kind === 'video' && m.cfVideoUid) {
      media.push({
        kind: 'video',
        cfVideoUid: m.cfVideoUid,
        thumbnail: m.thumbnail,
      });
    }
  }

  const images = media
    .filter((m): m is CommunityPostMediaItem & { url: string } => m.kind === 'image' && !!m.url)
    .map((m) => m.url);

  const { content, articleRef } = extractArticleRef(row.body, communitySlug);

  return {
    id: row.id,
    communityId: row.community_id,
    authorId: row.author_id,
    authorName: profileDisplayName(author ?? null),
    authorAvatar: author?.avatar_url ? withImageVariant(author.avatar_url, 'avatar') : undefined,
    content,
    images: images.length > 0 ? images : undefined,
    media: media.length > 0 ? media : undefined,
    articleRef,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: row.created_at,
    isPinned: false,
  };
}
