import { useSyncExternalStore } from 'react';

let permissionRequest: Promise<NotificationPermission> | null = null;

function subscribe(onChange: () => void) {
  if (!('Notification' in window)) return () => {};
  let active = true;
  if (Notification.permission === 'default') {
    permissionRequest ??= Notification.requestPermission().finally(() => {
      permissionRequest = null;
    });
    void permissionRequest.then(() => {
      if (active) onChange();
    }).catch(() => {});
  }
  window.addEventListener('focus', onChange);
  return () => {
    active = false;
    window.removeEventListener('focus', onChange);
  };
}

function getSnapshot() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function useBrowserNotificationPermission() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
