import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Read when the replay integration attaches (lazy-loaded below).
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
  enableLogs: true,
});

// Lazy-load Session Replay so it stays out of the initial client bundle.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replay) => {
      Sentry.addIntegration(replay({ maskAllText: true, blockAllMedia: true }));
    })
    .catch(() => {});
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
