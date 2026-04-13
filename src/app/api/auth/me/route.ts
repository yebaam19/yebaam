import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@insforge/sdk';

const COOKIE_NAME = 'insforge_access_token';

export async function GET() {
  const store = await cookies();
  const accessToken = store.get(COOKIE_NAME)?.value;
  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return NextResponse.json({ error: 'Missing InsForge env' }, { status: 500 });
  }

  const client = createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    edgeFunctionToken: accessToken,
  });

  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.json({ user: data.user, accessToken });
}
