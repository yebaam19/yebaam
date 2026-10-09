import { describe, expect, it } from 'vitest';
import { plainArticleText, sanitizeCommunityArticleContent, splitCommunityArticleContent } from '@/features/communities/lib/article-content';
import { parseArticleCursor } from '@/features/communities/lib/article-cursor';

const assetId = 'e90b4974-7c60-47f0-8f5a-cb8a1d858acf';

describe('community article content boundary', () => {
  it('keeps prose and a canonical library reference without persisting a delivery URL', () => {
    const content = sanitizeCommunityArticleContent(
      `<h2>Crónica</h2><p>Una historia compartida.</p><figure data-community-asset-id="${assetId}"><figcaption>Imagen</figcaption></figure><p>Final.</p>`,
    );
    expect(content).toContain(`<figure data-community-asset-id="${assetId}"></figure>`);
    expect(splitCommunityArticleContent(content)).toEqual([
      { html: '<h2>Crónica</h2><p>Una historia compartida.</p>' },
      { assetId }, { html: '<p>Final.</p>' },
    ]);
    expect(plainArticleText(content)).toContain('Una historia compartida.');
  });

  it('removes executable HTML, raw media and forged asset markers', () => {
    const content = sanitizeCommunityArticleContent(
      '<p onclick="alert(1)">Texto</p><script>alert(1)</script><img src="https://imagedelivery.net/key/id/public">' +
      '<figure data-community-asset-id="invalid"><figcaption>Falso</figcaption></figure>' +
      '<a href="javascript:alert(1)" target="_blank">Enlace</a>',
    );
    expect(content).not.toMatch(/onclick|<script|<img|imagedelivery\.net|javascript:|data-community-asset-id=/);
    expect(content).toContain('Texto');
    expect(splitCommunityArticleContent(content).every((part) => part.assetId === undefined)).toBe(true);
  });
});

describe('community article pagination cursor', () => {
  it('accepts the bounded cursor produced by the listing', () => {
    const cursor = { createdAt: '2026-10-09T00:00:00+00:00', id: assetId };
    expect(parseArticleCursor(JSON.stringify(cursor))).toEqual(cursor);
    expect(parseArticleCursor(null)).toBeNull();
  });

  it.each(['not-json', JSON.stringify({ createdAt: 'invalid', id: assetId }),
    JSON.stringify({ createdAt: '2026-10-09T00:00:00+00:00', id: 'not-uuid' }), 'x'.repeat(513), ['duplicate']])
  ('rejects a malformed or repeated query cursor', (cursor) => {
    expect(() => parseArticleCursor(cursor)).toThrow();
  });
});
