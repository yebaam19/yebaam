import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/auth/callback',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasSession = Boolean(user);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && user) {
    const { data: adminRow } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const isPlatformAdmin = Boolean(adminRow);

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

    if (isPlatformAdmin && !isAdminRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (isPlatformAdmin && isPublicRoute && pathname !== '/') {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (!isPlatformAdmin && isAdminRoute) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  if (hasSession && isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.svg).*)',
  ],
};
