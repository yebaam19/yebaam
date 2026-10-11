import * as Sentry from '@sentry/nextjs';
import { SENTRY_ENVIRONMENT } from '@/config/sentry';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sendDefaultPii: true,
  // Dev-only: attaching the V8 Inspector to capture stack-frame locals runs for ALL
  // execution (not just sampled traces) and lengthens serverless cold starts.
  includeLocalVariables: process.env.NODE_ENV !== 'production',
  enableLogs: true,
});
