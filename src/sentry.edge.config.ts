import * as Sentry from '@sentry/nextjs';
import { SENTRY_ENVIRONMENT } from '@/config/sentry';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sendDefaultPii: true,
  enableLogs: true,
});
