import { NextResponse } from 'next/server';

// Legacy InsForge endpoint that mirrored the SDK access token into an
// httpOnly cookie. Supabase's @supabase/ssr package manages its own
// session cookies, so this route is intentionally a no-op now. Kept
// to avoid 404s from stale clients during the cutover; safe to delete
// once nothing in the app references it.
export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
