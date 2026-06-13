import type { FriendRequestBlockReason } from './friendships.types';

/**
 * Thrown when the `send_friend_request` RPC rejects a send for a known business
 * reason (rate limit, freeze, duplicate). Carries the structured payload so the
 * UI can show a specific message and unfreeze countdown without re-querying.
 */
export class FriendRequestBlockedError extends Error {
  reason: FriendRequestBlockReason;
  unfreezeAt?: string;
  counts?: { hour: number; day: number; week: number };
  limits?: { hour: number; day: number; week: number };
  freezeReason?: string;

  constructor(reason: FriendRequestBlockReason, message: string, extras: {
    unfreezeAt?: string;
    counts?: { hour: number; day: number; week: number };
    limits?: { hour: number; day: number; week: number };
    freezeReason?: string;
  } = {}) {
    super(message);
    this.name = 'FriendRequestBlockedError';
    this.reason = reason;
    this.unfreezeAt = extras.unfreezeAt;
    this.counts = extras.counts;
    this.limits = extras.limits;
    this.freezeReason = extras.freezeReason;
  }
}

/** Human-readable (Spanish) message for a block reason, with an unfreeze
 *  countdown appended when a timestamp is available. */
export function blockMessageFor(
  reason: FriendRequestBlockReason,
  unfreezeAt: string | undefined,
): string {
  const when = unfreezeAt ? formatUnfreezeRelative(unfreezeAt) : null;
  switch (reason) {
    case 'hourly_limit':
      return when
        ? `Alcanzaste el límite de 3 solicitudes por hora. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 3 solicitudes por hora.';
    case 'daily_limit':
      return when
        ? `Alcanzaste el límite de 10 solicitudes por día. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 10 solicitudes por día.';
    case 'weekly_limit':
      return when
        ? `Alcanzaste el límite de 40 solicitudes por semana. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 40 solicitudes por semana.';
    case 'new_account_daily_limit':
      return when
        ? `Las cuentas nuevas pueden enviar 3 solicitudes por día. Podrás enviar más ${when}.`
        : 'Las cuentas nuevas pueden enviar 3 solicitudes por día durante sus primeros 7 días.';
    case 'frozen':
      return when
        ? `Tu cuenta tiene un bloqueo temporal en solicitudes de amistad. Se levantará ${when}.`
        : 'Tu cuenta tiene un bloqueo temporal en solicitudes de amistad.';
    case 'already_pending':
      return 'Ya existe una solicitud pendiente con este usuario';
    case 'already_friends':
      return 'Ya son amigos';
    case 'blocked':
      return 'No es posible enviar una solicitud a este usuario';
    case 'invalid_addressee':
      return 'Destinatario inválido';
    case 'unauthenticated':
      return 'Debes iniciar sesión para enviar solicitudes';
    default:
      return 'No se pudo enviar la solicitud';
  }
}

function formatUnfreezeRelative(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return '';
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'en unos momentos';
  const totalMin = Math.ceil(diffMs / 60000);
  if (totalMin < 60) return `en ${totalMin} min`;
  const totalH = Math.ceil(totalMin / 60);
  if (totalH < 48) return `en ~${totalH} h`;
  const totalD = Math.ceil(totalH / 24);
  return `en ~${totalD} días`;
}
