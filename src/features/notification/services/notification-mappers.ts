import { withImageVariant } from '@/lib/media/urls';
import {
NotificationType,
type NotificationActor,
type NotificationMetadata
} from '../interfaces/notification.interfaces';

export type DbNotification = {
  id: string;
  type:
    | 'like'
    | 'comment'
    | 'follow'
    | 'message'
    | 'mention'
    | 'friend_request'
    | 'friend_accept'
    | 'music_article'
    | 'page_follow'
    | 'page_recommend'
    | 'page_like'
    | 'page_message'
    | 'page_audition'
    | 'page_event';
  recipient_id: string;
  actor_id: string | null;
  related_type: 'post' | 'comment' | 'story' | 'music_article' | 'page' | null;
  related_id: string | null;
  message: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

export function mapDbTypeToClient(
  dbType: DbNotification['type'],
  relatedType: DbNotification['related_type']
): NotificationType {
  switch (dbType) {
    case 'like':
      return relatedType === 'comment' ? NotificationType.COMMENT_LIKE : NotificationType.POST_LIKE;
    case 'comment':
      return relatedType === 'comment' ? NotificationType.COMMENT_REPLY : NotificationType.POST_COMMENT;
    case 'mention':
      return relatedType === 'comment'
        ? NotificationType.COMMENT_MENTION
        : NotificationType.POST_MENTION;
    case 'friend_request':
      return NotificationType.FRIEND_REQUEST;
    case 'friend_accept':
      return NotificationType.FRIEND_ACCEPTED;
    case 'message':
      return NotificationType.NEW_MESSAGE;
    case 'follow':
      return NotificationType.FRIEND_SUGGESTION;
    case 'music_article':
      return NotificationType.MUSIC_ARTICLE_PUBLISHED;
    case 'page_follow':
      return NotificationType.PAGE_FOLLOW;
    case 'page_recommend':
      return NotificationType.PAGE_RECOMMEND;
    case 'page_like':
      return NotificationType.PAGE_LIKE;
    case 'page_message':
      return NotificationType.PAGE_MESSAGE;
    case 'page_audition':
      return NotificationType.PAGE_AUDITION;
    case 'page_event':
      return NotificationType.PAGE_EVENT;
    default:
      // A row whose type this build doesn't know yet (new producer deployed
      // before the client) must never surface as `undefined` — downstream
      // renderers assume `type` is always a string.
      return NotificationType.SYSTEM;
  }
}

export function mapClientTypeToDb(type?: NotificationType): DbNotification['type'] | null {
  if (!type) return null;
  switch (type) {
    case NotificationType.POST_LIKE:
    case NotificationType.COMMENT_LIKE:
      return 'like';
    case NotificationType.POST_COMMENT:
    case NotificationType.COMMENT_REPLY:
      return 'comment';
    case NotificationType.POST_MENTION:
    case NotificationType.COMMENT_MENTION:
      return 'mention';
    case NotificationType.FRIEND_REQUEST:
      return 'friend_request';
    case NotificationType.FRIEND_ACCEPTED:
      return 'friend_accept';
    case NotificationType.NEW_MESSAGE:
      return 'message';
    case NotificationType.MUSIC_ARTICLE_PUBLISHED:
      return 'music_article';
    case NotificationType.PAGE_FOLLOW:
      return 'page_follow';
    case NotificationType.PAGE_RECOMMEND:
      return 'page_recommend';
    case NotificationType.PAGE_LIKE:
      return 'page_like';
    case NotificationType.PAGE_MESSAGE:
      return 'page_message';
    case NotificationType.PAGE_AUDITION:
      return 'page_audition';
    case NotificationType.PAGE_EVENT:
      return 'page_event';
    default:
      return null;
  }
}

export function profileToActor(profile: DbProfile | undefined, fallbackId: string): NotificationActor {
  if (!profile) {
    return { id: fallbackId, username: '', displayName: '', avatar: undefined };
  }
  const displayName =
    profile.display_name ??
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ??
    profile.username ??
    '';
  return {
    id: profile.id,
    username: profile.username ?? '',
    displayName,
    avatar: profile.avatar_url ? withImageVariant(profile.avatar_url, 'avatar') : undefined,
    isVerified: profile.is_verified ?? false,
  };
}

export function buildMetadata(row: DbNotification): NotificationMetadata {
  const meta: NotificationMetadata = {};
  if (row.related_type === 'post' && row.related_id) meta.postId = row.related_id;
  if (row.related_type === 'comment' && row.related_id) meta.commentId = row.related_id;
  if ((row.type === 'friend_request' || row.type === 'friend_accept') && row.related_id) {
    meta.friendshipId = row.related_id;
  }
  return meta;
}

export function buildTargetUrl(row: DbNotification): string | undefined {
  // Generic escape hatch: features outside the post/comment hierarchy persist
  // the path explicitly so this function does not need to know their slugs.
  if (row.link) return row.link;
  if (row.related_type === 'post' && row.related_id) return `/feed/post/${row.related_id}`;
  if (row.related_type === 'comment' && row.related_id) return `/feed/post/${row.related_id}`;
  if (row.type === 'friend_request' || row.type === 'friend_accept') return '/friends';
  if (row.type === 'message') return '/chat';
  return undefined;
}

