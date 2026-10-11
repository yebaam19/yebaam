import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import {
markAllNotificationsRead as markAllNotificationsReadAction,
markNotificationsRead as markNotificationsReadAction,
} from '../actions/notification.actions';
import {
NotificationType,
type GetNotificationsFilters,
type Notification,
type NotificationPreferences,
type NotificationStats,
type NotificationsResponse,
type UpdatePreferencesDTO
} from '../interfaces/notification.interfaces';

import { buildMetadata,buildTargetUrl,mapClientTypeToDb,mapDbTypeToClient,profileToActor,type DbNotification,type DbProfile } from './notification-mappers';

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

    const userId = await getCurrentUserId();
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
    const userId = await getCurrentUserId();
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
    // Use a Server Action so the UPDATE runs against the caller's cookie
    // session — the browser client's access token races with session refresh
    // and caused silent 0-row updates here.
    const res = await markNotificationsReadAction(notificationIds);
    if (!res.ok) {
      if (res.error === 'unauthorized') throw new Error('No authenticated user');
      throw new Error(res.message || 'Error al marcar como leídas');
    }
    if (res.updated === 0) throw new Error('notification_not_updated');
  }

  async markOneAsRead(notificationId: string): Promise<void> {
    return this.markAsRead([notificationId]);
  }

  async markAllAsRead(): Promise<void> {
    const res = await markAllNotificationsReadAction();
    if (!res.ok) {
      if (res.error === 'unauthorized') return;
      throw new Error(res.message || 'Error al marcar todas como leídas');
    }
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
