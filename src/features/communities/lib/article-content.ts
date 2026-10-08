import 'server-only';
import sanitizeHtml from 'sanitize-html';

const ASSET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIGURE = /<figure data-community-asset-id="([0-9a-f-]{36})">[\s\S]*?<\/figure>/gi;

export type ArticlePart = { html: string; assetId?: never } | { assetId: string; html?: never };

// The editor only stores references to library media. HTML remains useful for
// prose, but no upload URL or arbitrary image source is accepted as article data.
export function sanitizeCommunityArticleContent(raw: string): string {
  const safe = sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'figure', 'figcaption'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'], figure: ['data-community-asset-id'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
    transformTags: {
      a: (tagName, attrs) => ({ tagName, attribs: {
        ...attrs, ...(attrs.target === '_blank' ? { rel: 'noopener noreferrer nofollow' } : {}),
      } }),
      figure: (_tagName, attrs) => {
        const id = attrs['data-community-asset-id'];
        const attribs: Record<string, string> = id && ASSET_ID.test(id)
          ? { 'data-community-asset-id': id.toLowerCase() } : {};
        return { tagName: id && ASSET_ID.test(id) ? 'figure' : 'div', attribs };
      },
    },
  });
  return safe.replace(FIGURE, (_figure, id: string) => `<figure data-community-asset-id="${id}"></figure>`);
}

export function splitCommunityArticleContent(content: string): ArticlePart[] {
  const parts: ArticlePart[] = [];
  const pattern = new RegExp(FIGURE.source, 'gi');
  let start = 0;
  for (const match of content.matchAll(pattern)) {
    if (match.index > start) parts.push({ html: content.slice(start, match.index) });
    parts.push({ assetId: match[1] });
    start = match.index + match[0].length;
  }
  if (start < content.length) parts.push({ html: content.slice(start) });
  return parts;
}

export function plainArticleText(content: string): string {
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
