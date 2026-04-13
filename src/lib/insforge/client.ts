import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
  throw new Error(
    'Missing InsForge env vars. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in .env.local'
  );
}

export const insforge = createClient({
  baseUrl,
  anonKey,
  // Session is driven by our httpOnly `insforge_access_token` cookie +
  // /api/auth/me rehydration. The SDK's internal refresh flow has no valid
  // refresh cookie in this setup, so let it stay silent instead of firing a
  // noisy POST /api/auth/refresh → 401 on every stale call.
  autoRefreshToken: false,
});
