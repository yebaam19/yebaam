import 'server-only';

import sanitizeHtml from 'sanitize-html';

/**
 * Server-side allowlist sanitizer for user-authored rich text (TipTap output).
 *
 * Article bodies are stored as raw HTML and rendered with
 * `dangerouslySetInnerHTML`, so anything that survives this function executes in
 * the app's origin for every reader. The editor is not a control: Server Actions
 * are plain RPCs, so `content` can be posted directly without ever loading
 * TipTap.
 *
 * Sanitize on the way IN (so the database never holds a payload) and again on
 * the way OUT (so rows written before this existed, or by any other path, are
 * still safe to render). Both, deliberately — neither alone is enough.
 *
 * `<script>` is inert under `innerHTML`, which is why an allowlist rather than a
 * blocklist is the right shape here: the live vectors are attribute-based
 * (`onerror`, `onload`), URL-scheme-based (`javascript:`, `data:`) and
 * container-based (`<iframe srcdoc>`, `<object>`, `<style>`), and an allowlist
 * excludes all of them by construction instead of by enumeration.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'span', 'div',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    // TipTap emits these for lists, alignment and code blocks. `class` is
    // allowed but filtered below; `style` is not allowed at all, since it
    // carries its own injection surface (`url()`, `expression()`).
    '*': ['class'],
    ol: ['start', 'type', 'class'],
    li: ['data-checked', 'class'],
    code: ['class'],
    pre: ['class'],
    th: ['colspan', 'rowspan', 'class'],
    td: ['colspan', 'rowspan', 'class'],
  },
  // Anything not http(s) or a protocol-relative URL is dropped, which is what
  // removes `javascript:` and `data:` payloads from href/src.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // Drop the *contents* of these too, not just the tags — otherwise stripping
  // `<style>` would spill its CSS into the article as visible text.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  transformTags: {
    // A user-authored link that opens a new tab must not get scripting access
    // to the opener window.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer nofollow' } : {}),
      },
    }),
  },
};

/** Sanitize user-authored article HTML. Safe to call on already-clean input. */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
}
