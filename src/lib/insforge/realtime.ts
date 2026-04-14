import { insforge } from './client';
import { ensureInsforgeTokenFromCookie } from './ensure-browser-token';

const FAILURE_COOLDOWN_MS = 3_000;

let inflight: Promise<boolean> | null = null;
let lastFailureAt = 0;
let hasLoggedFailure = false;

export function isRealtimeOffline(): boolean {
  return lastFailureAt > 0 && Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS;
}

export function resetRealtimeFailure(): void {
  lastFailureAt = 0;
  hasLoggedFailure = false;
}

export async function ensureRealtimeConnected(): Promise<boolean> {
  if (insforge.realtime.isConnected) {
    lastFailureAt = 0;
    return true;
  }
  if (isRealtimeOffline()) return false;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      await ensureInsforgeTokenFromCookie();
      if (insforge.realtime.isConnected) {
        lastFailureAt = 0;
        hasLoggedFailure = false;
        return true;
      }
      await insforge.realtime.connect();
      lastFailureAt = 0;
      hasLoggedFailure = false;
      return true;
    } catch (err) {
      lastFailureAt = Date.now();
      if (!hasLoggedFailure) {
        hasLoggedFailure = true;
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[insforge.realtime] offline — live updates disabled (${message}). Retrying on next action.`,
        );
      }
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function disconnectRealtime(): Promise<void> {
  resetRealtimeFailure();
  try {
    await insforge.realtime.disconnect();
  } catch {
    // ignore — already disconnected or SDK offline
  }
}
