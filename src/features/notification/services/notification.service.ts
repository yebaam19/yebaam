import { supabase } from '@/utils/supabase/client';
import {
  NotificationType,
  type GetNotificationsFilters,
  type Notification,
  type NotificationActor,
  type NotificationMetadata,
  type NotificationPreferences,
  type NotificationStats,
  type NotificationsResponse,
  type UpdatePreferencesDTO,
} from '../interfaces/notification.interfaces';

type DbNotification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'friend_request' | 'friend_accept';
  recipient_id: string;
  actor_id: string | null;
  related_type: 'post' | 'comment' | 'story' | null;
  related_id: string | null;
  message: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
};

function mapDbTypeToClient(
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
  }
}

function mapClientTypeToDb(type?: NotificationType): DbNotification['type'] | null {
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
    default:
      return null;
  }
}

function profileToActor(profile: DbProfile | undefined, fallbackId: string): NotificationActor {
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
    avatar: profile.avatar_url ?? undefined,
    isVerified: profile.is_verified ?? false,
  };
}

function buildMetadata(row: DbNotification): NotificationMetadata {
  const meta: NotificationMetadata = {};
  if (row.related_type === 'post' && row.related_id) meta.postId = row.related_id;
  if (row.related_type === 'comment' && row.related_id) meta.commentId = row.related_id;
  if ((row.type === 'friend_request' || row.type === 'friend_accept') && row.related_id) {
    meta.friendshipId = row.related_id;
  }
  return meta;
}

function buildTargetUrl(row: DbNotification): string | undefined {
  if (row.related_type === 'post' && row.related_id) return `/feed/post/${row.related_id}`;
  if (row.related_type === 'comment' && row.related_id) return `/feed/post/${row.related_id}`;
  if (row.type === 'friend_request' || row.type === 'friend_accept') return '/feed/friends';
  if (row.type === 'message') return '/chat';
  return undefined;
}

export class NotificationService {
  private async hydrateActors(rows: DbNotification[]): Promise<Map<string, DbProfile>> {
    const actorIds = Array.from(
      new Set(rows.map((r) => r.actor_id).filter((x): x is string => x !== null))
    );
    if (actorIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, display_name, avatar_url, is_verified')
      .in('id', actorIds);

    if (error || !data) return new Map();

    const map = new Map<string, DbProfile>();
    for (const profile of data as DbProfile[]) map.set(profile.id, profile);
    return map;
  }

  private rowToNotification(row: DbNotification, actors: Map<string, DbProfile>): Notification {
    const actor = profileToActor(
      row.actor_id ? actors.get(row.actor_id) : undefined,
      row.actor_id ?? ''
    );
    return {
      id: row.id,
      userId: row.recipient_id,
      type: mapDbTypeToClient(row.type, row.related_type),
      actor,
      message: row.message ?? '',
      metadata: buildMetadata(row),
      isRead: row.is_read,
      createdAt: row.created_at,
      readAt: row.read_at ?? undefined,
      targetUrl: buildTargetUrl(row),
    };
  }

  async getAll(filters?: GetNotificationsFilters): Promise<NotificationsResponse> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return {
        notifications: [],
        pagination: { page, limit, total: 0, unreadCount: 0, hasMore: false },
      };
    }

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    const dbType = mapClientTypeToDb(filters?.type);
    if (dbType) query = query.eq('type', dbType);

    const readFilter =
      filters?.filter === 'unread' ? false : filters?.filter === 'read' ? true : filters?.isRead;
    if (readFilter !== undefined) query = query.eq('is_read', readFilter);

    if (filters?.since) query = query.gte('created_at', filters.since);

    const { data, error, count } = await query;
    if (error || !data) {
      throw new Error(error?.message || 'Error al obtener notificaciones');
    }

    const rows = data as DbNotification[];
    const actors = await this.hydrateActors(rows);
    const notifications = rows.map((r) => this.rowToNotification(r, actors));

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total: count ?? notifications.length,
        unreadCount: unreadCount ?? 0,
        hasMore: (count ?? 0) > to + 1,
      },
    };
  }

  async getById(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();
    if (error || !data) throw new Error(error?.message || 'Error al obtener notificación');

    const row = data as DbNotification;
    const actors = await this.hydrateActors([row]);
    return this.rowToNotification(row, actors);
  }

  async getStats(): Promise<NotificationStats> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return {
        totalCount: 0,
        unreadCount: 0,
        countByType: {} as Record<NotificationType, number>,
      };
    }

    const { count: total } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId);

    const { count: unread } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    return {
      totalCount: total ?? 0,
      unreadCount: unread ?? 0,
      countByType: {} as Record<NotificationType, number>,
    };
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds);
    if (error) throw new Error(error.message || 'Error al marcar como leídas');
  }

  async markOneAsRead(notificationId: string): Promise<void> {
    return this.markAsRead([notificationId]);
  }

  async markAllAsRead(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    if (error) throw new Error(error.message || 'Error al marcar todas como leídas');
  }

  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    if (error) throw new Error(error.message || 'Error al eliminar notificación');
  }

  async deleteMany(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);
    if (error) throw new Error(error.message || 'Error al eliminar notificaciones');
  }

  async getPreferences(): Promise<NotificationPreferences> {
    throw new Error('Notification preferences not yet supported — no table in schema');
  }

  async updatePreferences(_: UpdatePreferencesDTO): Promise<NotificationPreferences> {
    throw new Error('Notification preferences not yet supported — no table in schema');
  }

  async subscribeToPush(_: PushSubscription): Promise<void> {
    throw new Error('Push notifications not yet supported — no table in schema');
  }
}

export const notificationService = new NotificationService();
