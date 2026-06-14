/**
 * Removes the FRIEND_REQUEST notification associated with `requestId` from the
 * notification store and decrements the unread counter if it was unread.
 *
 * Extracted verbatim from the duplicated cleanup block in `acceptFriendRequest`
 * and `rejectFriendRequest`. The dynamic `import('@/features/notification...')`
 * calls are preserved exactly to avoid a static cross-store dependency.
 */
export async function clearFriendRequestNotification(requestId: string): Promise<void> {
  // 🔔 Eliminar la notificación asociada del notification store
  const { useNotificationStore } = await import('@/features/notification/store/notification.store');
  const { NotificationType } = await import('@/features/notification/interfaces/notification.interfaces');

  const notificationStore = useNotificationStore.getState();
  const friendRequestNotification = notificationStore.notifications.find(
    n => n.type === NotificationType.FRIEND_REQUEST &&
         n.targetUrl?.includes(requestId)
  );

  if (friendRequestNotification) {
    notificationStore.removeNotificationFromList(friendRequestNotification.id);

    // Actualizar contador de no leídas
    if (!friendRequestNotification.isRead) {
      const currentCount = notificationStore.unreadCount;
      useNotificationStore.setState({ unreadCount: Math.max(0, currentCount - 1) });
    }
  }
}
