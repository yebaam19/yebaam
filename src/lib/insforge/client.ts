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
});
