/**
 * Paw glyph, aliased from `lucide-react` to match `heroicons-shim`.
 *
 * Was the last `@iconify/react` call site in the app — that library fetched
 * each glyph at runtime from api.iconify.design, so the icon stayed blank
 * until a third-party round-trip finished and never rendered offline.
 */
export { PawPrint as PawIcon } from 'lucide-react'
