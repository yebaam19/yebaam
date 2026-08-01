/**
 * `Content-Disposition: attachment` with an ASCII fallback plus the RFC 5987
 * UTF-8 form, so a file called `Canción — Lado A.mp3` reaches the browser with
 * its accents intact instead of the R2 uuid (or a mojibake fallback).
 *
 * Shared by the chat attachment presigner, the R2 download presigner, and the
 * admin album `.zip` response — three call sites that must not drift, since a
 * malformed header silently degrades to "download named after the URL".
 */
export function attachmentDisposition(filename: string, fallbackName = 'archivo'): string {
  const clean =
    filename
      .replace(/[\r\n]/g, ' ')
      .trim()
      .slice(0, 200) || fallbackName;
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(clean).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
