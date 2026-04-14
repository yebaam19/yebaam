import { NextResponse } from 'next/server';
import { getServerClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const { data: sessionData } = await supabase.auth.getSession();
  return NextResponse.json({
    user: data.user,
    accessToken: sessionData.session?.access_token ?? null,
  });
}
