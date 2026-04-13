import 'server-only';
import { cookies } from 'next/headers';
import { createClient, type InsForgeClient } from '@insforge/sdk';

const COOKIE_NAME = 'insforge_access_token';

function requireEnv() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error(
      'Missing InsForge env vars. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.'
    );
  }
  return { baseUrl, anonKey };
}

export async function getServerClient(): Promise<InsForgeClient> {
  const { baseUrl, anonKey } = requireEnv();
  const store = await cookies();
  const accessToken = store.get(COOKIE_NAME)?.value;

  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken || undefined,
  });
}

export async function getServerAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export function getServiceClient(): InsForgeClient {
  const { baseUrl, anonKey } = requireEnv();
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing INSFORGE_API_KEY (server-only)');
  }

  const client = createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
  });
  client.getHttpClient().setAuthToken(apiKey);
  return client;
}
