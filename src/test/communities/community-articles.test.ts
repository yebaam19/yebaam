import { describe, expect, it } from 'vitest';
import { plainArticleText, sanitizeCommunityArticleContent, splitCommunityArticleContent } from '@/features/communities/lib/article-content';

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
