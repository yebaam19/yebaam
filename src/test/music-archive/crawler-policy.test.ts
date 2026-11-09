import { describe, expect, it } from 'vitest';
import { resolveRobots } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data';
import robots from '@/app/robots';

describe('music crawler policy', () => {
  const policy = robots();
  const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
  const general = rules.find((rule) => rule.userAgent === '*')!;
  const training = rules.find((rule) => rule.userAgent === 'ClaudeBot')!;
  const generalDisallow = general.disallow as string[];

  it('excludes the music root, query variants and children for ClaudeBot only', () => {
    expect(training.disallow).toEqual([
      ...generalDisallow, '/musica$', '/musica?', '/musica/',
    ]);
    expect(training.allow).toBe('/');
    expect(training.disallow).not.toContain('/');
  });

  it.each(['Googlebot', 'Bingbot', 'Claude-SearchBot', 'Claude-User'])(
    'leaves %s on the existing general policy',
    (agent) => {
      expect(rules.some((rule) => rule.userAgent === agent)).toBe(false);
      expect(general.allow).toBe('/');
      expect(general.disallow).not.toContain('/');
      expect(generalDisallow.some((path) => path.startsWith('/musica'))).toBe(false);
    },
  );

  it('retains private exclusions in the specific group instead of overriding them', () => {
    for (const path of ['/admin/', '/api/', '/feed/', '/auth/', '/monitoring']) {
      expect(general.disallow).toContain(path);
      expect(training.disallow).toContain(path);
    }
    expect(policy.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it('serializes separate groups into the actual Next.js robots format', () => {
    const output = resolveRobots(policy);
    expect(output).toContain('User-Agent: *\nAllow: /\n');
    expect(output).toContain('User-Agent: ClaudeBot\nAllow: /\n');
    expect(output).toContain('Disallow: /musica$\nDisallow: /musica?\nDisallow: /musica/\n');
    expect(output).toContain(`Sitemap: ${policy.sitemap}`);
  });
});
