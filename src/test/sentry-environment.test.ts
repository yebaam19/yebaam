import { afterEach, expect, it, vi } from 'vitest';
import { resolveSentryEnvironment } from '@/lib/sentry-environment';

const sentry = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({
  init: sentry.init,
  withSentryConfig: (config: unknown) => config,
  captureRouterTransitionStart: vi.fn(),
}));
vi.mock('next-intl/plugin', () => ({ default: () => (config: unknown) => config }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  sentry.init.mockClear();
});

it.each([
  [undefined, undefined, undefined, 'local'],
  ['', '', undefined, 'local'],
  [undefined, undefined, 'preview', 'preview'],
  [undefined, undefined, 'production', 'production'],
  [undefined, 'qa', 'preview', 'qa'],
  ['staging', 'qa', 'preview', 'staging'],
  ['  ', '  ', ' preview ', 'preview'],
])('resolves deployment labels without using optimization mode', (explicit, app, deployment, expected) => {
  expect(resolveSentryEnvironment(explicit, app, deployment)).toBe(expected);
});

it.each(['', 'preview', 'production'])('embeds one shared label for all SDKs with VERCEL_ENV=%s', async (deployment) => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_ENV', '');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', '');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
  vi.stubEnv('VERCEL_ENV', deployment);
  const { default: config } = await import('../../next.config');
  const label = config.env?.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  expect(label).toBe(deployment || 'local');
  // Next replaces this property at build time in each of the three bundles.
  vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', String(label));
  await import('@/sentry.server.config');
  await import('@/sentry.edge.config');
  await import('@/instrumentation-client');
  expect(sentry.init).toHaveBeenCalledTimes(3);
  for (const [options] of sentry.init.mock.calls) expect(options.environment).toBe(label);
});
