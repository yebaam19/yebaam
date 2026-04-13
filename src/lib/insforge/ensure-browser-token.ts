import { insforge } from '@/lib/insforge/client';

/**
 * Seeds the browser SDK Authorization header from the httpOnly session cookie
 * when no Bearer token is set yet (e.g. right after navigation, before checkAuth finishes).
 */
export async function ensureInsforgeTokenFromCookie(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const headers = insforge.getHttpClient().getHeaders();
    const hasAuth = Boolean(headers['Authorization'] || headers['authorization']);
    if (hasAuth) return;
  } catch {
    // fall through — try cookie probe
  }

  try {
    const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin' });
    if (!res.ok) return;
    const { accessToken } = (await res.json()) as { accessToken?: string };
    if (accessToken) {
      insforge.getHttpClient().setAuthToken(accessToken);
    }
  } catch {
    // ignore
  }
}
