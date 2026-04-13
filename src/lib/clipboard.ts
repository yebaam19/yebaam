/**
 * Robust clipboard copy that never throws an unhandled rejection.
 *
 * - Prefers the async Clipboard API.
 * - Falls back to a hidden textarea + document.execCommand('copy') when the
 *   async API is unavailable or rejects (e.g. NotAllowedError when the
 *   document is not focused — common when the user triggers a copy while
 *   DevTools has focus).
 * - Returns a boolean instead of throwing, so callers can show a toast
 *   without needing their own try/catch.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to DOM fallback.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
