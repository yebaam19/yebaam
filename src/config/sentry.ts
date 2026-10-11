// Next config embeds the same deployment label in server, edge, and browser bundles.
export const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'local';
