import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text';

/** Plan media belongs to typed Cloudflare references, not arbitrary HTML URLs. */
export function sanitizePlanContent(content: string): string {
  return sanitizeHtml(sanitizeRichText(content));
}
